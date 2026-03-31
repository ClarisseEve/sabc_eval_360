import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL.
 * Avoids recalculating heavy dashboard/analytics queries on every request.
 * For production at scale, swap with Redis (same interface).
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Get-or-compute: returns cached value if fresh, otherwise calls fn() and caches the result.
   */
  async getOrCompute<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fn();
    this.set(key, data, ttlSeconds);
    return data;
  }

  invalidate(pattern: string): void {
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

  clear(): void {
    this.store.clear();
  }
}
