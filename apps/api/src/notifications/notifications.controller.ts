import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

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
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.marquerCommeLue(id);
  }

  @Post('lire-tout')
  markAllRead(@Request() req: any) {
    return this.notificationsService.marquerToutesLues(req.user.matricule);
  }
}
