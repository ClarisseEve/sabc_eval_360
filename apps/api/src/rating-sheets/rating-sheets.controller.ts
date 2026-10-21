import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Request,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { RatingSheetsService } from './rating-sheets.service';
import {
  PublishRatingSheetsDto,
  SaveRatingSheetConfigurationDto,
} from './dto/rating-sheet.dto';

interface AuthenticatedRequest {
  user: {
    matricule: string;
    is_admin: boolean;
    role: string;
  };
}

@Controller('rating-sheets')
@UseGuards(JwtAuthGuard)
export class RatingSheetsController {
  constructor(private readonly service: RatingSheetsService) {}

  @Get('mine')
  getMine(@Request() request: AuthenticatedRequest) {
    return this.service.getMySheets(request.user.matricule);
  }

  @Get('admin/periods')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  listPeriods() {
    return this.service.listPeriods();
  }

  @Get('admin/:idPeriode')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getAdminOverview(@Param('idPeriode', new ParseUUIDPipe()) idPeriode: string) {
    return this.service.getAdminOverview(idPeriode);
  }

  @Put('admin/:idPeriode/config/:role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  saveConfiguration(
    @Param('idPeriode', new ParseUUIDPipe()) idPeriode: string,
    @Param('role') role: string,
    @Body() body: SaveRatingSheetConfigurationDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.service.saveConfiguration(
      idPeriode,
      role,
      body,
      request.user.matricule,
    );
  }

  @Post('admin/:idPeriode/:role/publish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  publish(
    @Param('idPeriode', new ParseUUIDPipe()) idPeriode: string,
    @Param('role') role: string,
    @Body() body: PublishRatingSheetsDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.service.publishForRole(
      idPeriode,
      role,
      body.matricules,
      request.user.matricule,
    );
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const isAdmin =
      Boolean(request.user.is_admin) ||
      String(request.user.role ?? '').toUpperCase() === 'ADMIN';
    const file = await this.service.getPdf(id, request.user.matricule, isAdmin);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="fiche-notation-${file.matricule}.pdf"`,
    );
    return new StreamableFile(file.buffer, { type: 'application/pdf' });
  }
}
