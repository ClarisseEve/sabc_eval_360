import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReportsService } from './reports.service';
import { ExportService } from './export.service';
import { ReportsController } from './reports.controller';
import { DatabasePgModule } from '../database/database-pg.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [DatabasePgModule, PrismaModule],
  providers: [Reflector, RolesGuard, ReportsService, ExportService],
  controllers: [ReportsController],
  exports: [ReportsService, ExportService],
})
export class ReportsModule {}
