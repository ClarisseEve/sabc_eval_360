import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import { CacheService } from '../common/cache.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
    private cache: CacheService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, 'ok' | 'error'> = {};

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      checks.mysql = 'ok';
    } catch {
      checks.mysql = 'error';
    }

    try {
      await this.pg.queryOne('SELECT 1');
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
    }

    const cacheStatus = await this.cache.healthCheck();
    checks.cache = cacheStatus === 'error' ? 'error' : 'ok';

    const healthy = Object.values(checks).every((v) => v === 'ok');
    return {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      cache_driver: cacheStatus,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  live() {
    return { status: 'ok' };
  }
}
