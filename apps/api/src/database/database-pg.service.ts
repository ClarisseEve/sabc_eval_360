import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DatabasePgService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private readonly logger = new Logger(DatabasePgService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.config.get('PG_HOST', 'localhost'),
      port: this.config.get<number>('PG_PORT', 5432),
      database: this.config.get('PG_DATABASE', 'sabc_business'),
      user: this.config.get('PG_USER', 'sabc'),
      password: this.config.get('PG_PASSWORD', '***REMOVED***'),
      max: 10,
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
}
