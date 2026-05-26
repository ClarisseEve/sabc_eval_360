import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [AuditLogService, CacheService],
  exports: [AuditLogService, CacheService],
})
export class CommonModule {}
