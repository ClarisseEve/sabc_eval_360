import { Module } from '@nestjs/common';
import { DatabasePgModule } from '../database/database-pg.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RatingSheetsController } from './rating-sheets.controller';
import { RatingSheetsService } from './rating-sheets.service';
import { RatingSheetPdfService } from './rating-sheet-pdf.service';
import { RatingSheetEmailService } from './rating-sheet-email.service';

@Module({
  imports: [DatabasePgModule, PrismaModule],
  controllers: [RatingSheetsController],
  providers: [
    RatingSheetsService,
    RatingSheetPdfService,
    RatingSheetEmailService,
  ],
})
export class RatingSheetsModule {}
