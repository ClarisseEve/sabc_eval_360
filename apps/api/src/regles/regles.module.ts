import { Module } from '@nestjs/common';
import { ReglesService } from './regles.service';
import { ReglesController } from './regles.controller';

@Module({
  controllers: [ReglesController],
  providers: [ReglesService],
  exports: [ReglesService],
})
export class ReglesModule {}
