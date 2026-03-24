import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
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

    const healthy = Object.values(checks).every((v) => v === 'ok');
    return {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  live() {
    return { status: 'ok' };
  }
}
