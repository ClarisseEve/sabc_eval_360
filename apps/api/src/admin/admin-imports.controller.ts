import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { AdminImportsService } from './admin-imports.service';

interface UploadedWorkbook {
  originalname: string;
  buffer: Buffer;
}

interface AuthenticatedRequest extends Request {
  user: { matricule: string };
}

@Controller('admin/imports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminImportsController {
  constructor(private readonly importsService: AdminImportsService) {}

  @Get('users/template')
  async downloadUsersTemplate(@Res() response: Response) {
    const workbook = await this.importsService.buildUsersTemplate();
    response
      .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .setHeader('Content-Disposition', 'attachment; filename="modele-utilisateurs.xlsx"')
      .send(workbook);
  }

  @Get('templates/template')
  async downloadTemplatesTemplate(@Res() response: Response) {
    const workbook = await this.importsService.buildTemplatesTemplate();
    response
      .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .setHeader('Content-Disposition', 'attachment; filename="modele-templates-evaluation.xlsx"')
      .send(workbook);
  }

  @Post('users/preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  previewUsers(
    @UploadedFile() file: UploadedWorkbook,
    @Body('initial_password') initialPassword: string,
  ) {
    return this.importsService.previewUsers(this.getFileBuffer(file), initialPassword);
  }

  @Post('users')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  importUsers(
    @UploadedFile() file: UploadedWorkbook,
    @Body('initial_password') initialPassword: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.importsService.importUsers(
      this.getFileBuffer(file),
      initialPassword,
      request.user.matricule,
      request.ip ?? '',
    );
  }

  @Post('templates/preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  previewTemplates(@UploadedFile() file: UploadedWorkbook) {
    return this.importsService.previewTemplates(this.getFileBuffer(file));
  }

  @Post('templates')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  importTemplates(@UploadedFile() file: UploadedWorkbook) {
    return this.importsService.importTemplates(this.getFileBuffer(file));
  }

  private getFileBuffer(file: UploadedWorkbook | undefined): Buffer {
    if (!file?.buffer?.length) throw new BadRequestException('Sélectionnez un fichier Excel .xlsx.');
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('Seuls les fichiers Excel .xlsx sont acceptés.');
    }
    return file.buffer;
  }
}
