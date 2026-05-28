import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsOuvertureService {
  private readonly logger = new Logger(NotificationsOuvertureService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async notifierOuverturePeriode(
    _idPeriode: string,
    nomPeriode: string,
    dateFin: string,
  ): Promise<number> {
    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: {
        statut: 'Actif',
        est_actif: true,
        role: { not: 'ADMIN' },
      },
      select: { matricule: true },
    });

    if (utilisateurs.length === 0) {
      this.logger.warn(`[5.1] Aucun utilisateur actif pour période ${nomPeriode}`);
      return 0;
    }

    const dateFinFormatted = new Date(dateFin).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    let count = 0;
    for (const user of utilisateurs) {
      try {
        await this.notificationsService.create({
          destinataire_matricule: user.matricule,
          titre: "Nouvelle période d'évaluation ouverte",
          message: `La période ${nomPeriode} est ouverte. Vous avez jusqu'au ${dateFinFormatted} pour compléter vos évaluations.`,
          type: 'info',
          lien: '/evaluations',
        });
        count++;
      } catch (err) {
        this.logger.error(
          `[5.1] Erreur notification ouverture pour ${user.matricule}: ${err}`,
        );
      }
    }

    this.logger.log(`[5.1] ${count} notifications envoyées pour période ${nomPeriode}`);
    return count;
  }
}
