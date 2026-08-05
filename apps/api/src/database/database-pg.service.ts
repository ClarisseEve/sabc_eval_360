import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DatabasePgService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private readonly logger = new Logger(DatabasePgService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    // Aucun mot de passe par défaut: un identifiant en dur laisserait l'app se
    // connecter silencieusement à une base mal configurée, et constitue un
    // secret versionné.
    const password = this.config.get<string>('PG_PASSWORD');
    if (!password) {
      throw new Error("PG_PASSWORD est requis pour ouvrir le pool PostgreSQL");
    }

    this.pool = new Pool({
      host: this.config.get('PG_HOST', 'localhost'),
      port: this.config.get<number>('PG_PORT', 5432),
      database: this.config.get('PG_DATABASE', 'sabc_business'),
      user: this.config.get('PG_USER', 'sabc'),
      password,
      max: this.config.get<number>('PG_POOL_MAX', 10),
    });
    this.logger.log('PostgreSQL pool initialized');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async execute(sql: string, params: any[] = []): Promise<number> {
    const result = await this.pool.query(sql, params);
    return result.rowCount ?? 0;
  }

  /**
   * Runs `fn` inside a PostgreSQL transaction.
   * Commits on success, rolls back on any thrown error.
   */
  async withTransaction<T>(fn: (client: { query: (sql: string, params?: any[]) => Promise<any> }) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({
        query: (sql: string, params: any[] = []) => client.query(sql, params),
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
