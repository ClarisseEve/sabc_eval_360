import { Module, Global } from '@nestjs/common';
import { CacheService } from './common/cache.service';
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

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
