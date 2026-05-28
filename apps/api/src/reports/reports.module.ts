import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { DatabasePgModule } from '../database/database-pg.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [DatabasePgModule],
  providers: [Reflector, RolesGuard, ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
