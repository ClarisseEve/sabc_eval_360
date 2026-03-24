import { Global, Module } from '@nestjs/common';
import { DatabasePgService } from './database-pg.service';

@Global()
@Module({
  providers: [DatabasePgService],
  exports: [DatabasePgService],
})
export class DatabasePgModule {}
