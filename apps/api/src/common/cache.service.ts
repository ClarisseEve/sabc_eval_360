import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<any>>();
  private readonly inflight = new Map<string, Promise<any>>();
  private redisClient: ReturnType<typeof createClient> | null = null;
  private redisReady = false;
  private readonly cacheDriver: 'auto' | 'memory' | 'redis';
  private readonly redisUrl: string | null;
  private readonly keyPrefix: string;
  private readonly memoryMaxEntries: number;

  constructor(private readonly configService: ConfigService) {
    const driver = this.configService.get<string>('CACHE_DRIVER', 'auto').toLowerCase();
    this.cacheDriver = driver === 'redis' || driver === 'memory' ? driver : 'auto';
    this.redisUrl = this.configService.get<string>('REDIS_URL') ?? null;
    this.keyPrefix = this.configService.get<string>('CACHE_PREFIX', 'sabc_eval360');
    this.memoryMaxEntries = Math.max(
      1,
      Number(this.configService.get<number>('CACHE_MEMORY_MAX_ENTRIES', 500)),
    );
  }

  async onModuleInit(): Promise<void> {
    if (this.cacheDriver === 'memory') {
      this.logger.log('Cache driver: memory');
      return;
    }

    if (!this.redisUrl) {
      if (this.cacheDriver === 'redis') {
        throw new Error('CACHE_DRIVER=redis requires REDIS_URL');
      }
      this.logger.warn('REDIS_URL not configured, using in-memory cache');
      return;
    }

    const client = createClient({ url: this.redisUrl });
    client.on('error', (error) => {
      this.redisReady = false;
      this.logger.error(`Redis error: ${error.message}`);
    });

    try {
      await client.connect();
      this.redisClient = client;
      this.redisReady = true;
      this.logger.log(`Cache driver: redis (${this.redisUrl})`);
    } catch (error: any) {
      this.redisClient = null;
      this.redisReady = false;
      if (this.cacheDriver === 'redis') {
        throw error;
      }
      this.logger.warn(`Redis unavailable, falling back to in-memory cache: ${error?.message ?? error}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Le cache mémoire ne se purgeait qu'à la lecture d'une clé expirée: une
   * entrée écrite puis jamais relue restait indéfiniment. Comme certaines clés
   * sont par utilisateur (analytics:scores:<matricule>), la Map grossissait
   * sans borne — sur le chemin de repli, c'est-à-dire quand Redis est indisponible.
   */
  private setInMemory<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    if (this.store.size <= this.memoryMaxEntries) return;

    const now = Date.now();
    for (const [storedKey, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(storedKey);
    }

    // Si la purge des expirées ne suffit pas, on évince les plus anciennes:
    // une Map itère dans l'ordre d'insertion.
    for (const storedKey of this.store.keys()) {
      if (this.store.size <= this.memoryMaxEntries) break;
      this.store.delete(storedKey);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redisReady && this.redisClient) {
      const raw = await this.redisClient.get(this.buildKey(key));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    }

    return this.getFromMemory<T>(key);
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    if (this.redisReady && this.redisClient) {
      await this.redisClient.set(this.buildKey(key), JSON.stringify(data), { EX: ttlSeconds });
      return;
    }

    this.setInMemory(key, data, ttlSeconds);
  }

  async getOrCompute<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = fn()
      .then(async (data) => {
        await this.set(key, data, ttlSeconds);
        return data;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, promise);
    return promise;
  }

  async invalidate(pattern: string): Promise<void> {
    if (this.redisReady && this.redisClient) {
      const match = this.buildKey(`*${pattern}*`);
      let count = 0;

      for await (const redisKey of this.redisClient.scanIterator({ MATCH: match, COUNT: 100 })) {
        const keys = Array.isArray(redisKey) ? redisKey : [redisKey];
        if (keys.length > 0) {
          count += keys.length;
          await this.redisClient.del(keys);
        }
      }

      if (count > 0) this.logger.debug(`Invalidated ${count} redis cache entries matching "${pattern}"`);
      return;
    }

    const keys = [...this.store.keys()];
    let count = 0;
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0) this.logger.debug(`Invalidated ${count} cache entries matching "${pattern}"`);
  }

  async clear(): Promise<void> {
    if (this.redisReady && this.redisClient) {
      const match = this.buildKey('*');
      for await (const redisKey of this.redisClient.scanIterator({ MATCH: match, COUNT: 100 })) {
        const keys = Array.isArray(redisKey) ? redisKey : [redisKey];
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
    }

    this.store.clear();
  }

  async healthCheck(): Promise<'redis' | 'memory' | 'error'> {
    if (this.redisReady && this.redisClient) {
      try {
        const pong = await this.redisClient.ping();
        return pong === 'PONG' ? 'redis' : 'error';
      } catch {
        return 'error';
      }
    }

    return 'memory';
  }
}
