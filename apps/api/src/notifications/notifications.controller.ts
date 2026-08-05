import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  getMyNotifications(
    @Request() req: any,
    @Query('non_lues') nonLues?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getForUser(req.user.matricule, {
      non_lues_seulement: nonLues === 'true',
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.countNonLues(req.user.matricule);
    return { count };
  }

  @Post(':id/lire')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.marquerCommeLue(id, req.user.matricule);
  }

  @Post(':id/read')
  markAsReadAlias(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.marquerCommeLue(id, req.user.matricule);
  }

  @Post('lire-tout')
  markAllRead(@Request() req: any) {
    return this.notificationsService.marquerToutesLues(req.user.matricule);
  }

  @Post('read-all')
  markAllReadAlias(@Request() req: any) {
    return this.notificationsService.marquerToutesLues(req.user.matricule);
  }

  @Post('send-bulk')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async sendBulk(
    @Request() req: any,
    @Body() body: SendBulkNotificationDto,
  ) {
    const targets: string[] = [];

    if (body.cible === 'tous') {
      const users = await this.prisma.utilisateur.findMany({
        where: { est_actif: true, role: { not: 'ADMIN' } },
        select: { matricule: true },
      });
      targets.push(...users.map((u: { matricule: string }) => u.matricule));
    } else if (body.cible === 'role' && body.role) {
      const users = await this.prisma.utilisateur.findMany({
        where: { role: body.role, est_actif: true },
        select: { matricule: true },
      });
      targets.push(...users.map((u: { matricule: string }) => u.matricule));
    } else if (body.cible === 'region' && body.id_region) {
      const users = await this.prisma.utilisateur.findMany({
        where: { id_region: body.id_region, est_actif: true },
        select: { matricule: true },
      });
      targets.push(...users.map((u: { matricule: string }) => u.matricule));
    } else if (body.cible === 'individu' && body.matricules?.length) {
      targets.push(...body.matricules);
    }

    let sent = 0;
    for (const matricule of targets) {
      try {
        await this.notificationsService.create({
          destinataire_matricule: matricule,
          titre: body.titre,
          message: body.message,
          type: (body.type as any) ?? 'info',
          expediteur_matricule: req.user.matricule,
        });
        sent++;
      } catch {
        // skip failures silently
      }
    }

    return { sent, total_cibles: targets.length };
  }
}
