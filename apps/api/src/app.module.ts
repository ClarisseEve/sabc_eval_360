import { Module, Global } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheService } from './common/cache.service';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DatabasePgModule } from './database/database-pg.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { PeriodesModule } from './periodes/periodes.module';
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { RemplacementsModule } from './remplacements/remplacements.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TemplatesModule } from './templates/templates.module';
import { ReglesModule } from './regles/regles.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { EvaluationPermissionModule } from './evaluation-permission/evaluation-permission.module';
import { ReportsModule } from './reports/reports.module';
import { validateEnvironment } from './config/validate-env';
import { APP_THROTTLER_OPTIONS } from './config/throttler-options';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnvironment,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot(APP_THROTTLER_OPTIONS),
    CommonModule,
    PrismaModule,
    DatabasePgModule,
    AuthModule,
    UsersModule,
    EvaluationsModule,
    PeriodesModule,
    HierarchyModule,
    RemplacementsModule,
    AnalyticsModule,
    TemplatesModule,
    ReglesModule,
    DashboardModule,
    AdminModule,
    NotificationsModule,
    HealthModule,
    EvaluationPermissionModule,
    ReportsModule,
  ],
  exports: [CacheService],
  providers: [
    CacheService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
