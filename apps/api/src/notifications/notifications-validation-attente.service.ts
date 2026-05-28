import { Injectable, Logger } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

interface EvaluationAttente {
  id_evaluation: string;
  evalue_matricule: string;
  date_soumission: Date;
}

@Injectable()
export class NotificationsValidationAttenteService {
  private readonly logger = new Logger(NotificationsValidationAttenteService.name);

  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async notifierManagersAttente(): Promise<number> {
    const evaluations = await this.pg.query<EvaluationAttente>(
      `SELECT e.id_evaluation, e.evalue_matricule, e.date_soumission
       FROM evaluations e
       JOIN periodes_evaluation p ON p.id_periode = e.id_periode
       WHERE e.statut = 'soumis'
         AND e.date_soumission < NOW() - INTERVAL '3 days'
         AND p.statut = 'ouverte'`,
    );

    if (evaluations.length === 0) {
      this.logger.log('[5.3] Aucune évaluation en attente de validation depuis >3 jours');
      return 0;
    }

    // Group by manager
    const countByManager = new Map<string, number>();
    for (const eval_ of evaluations) {
      const user = await this.prisma.utilisateur.findUnique({
        where: { matricule: eval_.evalue_matricule },
        select: { manager_matricule: true },
      });
      if (!user?.manager_matricule) continue;
      const current = countByManager.get(user.manager_matricule) ?? 0;
      countByManager.set(user.manager_matricule, current + 1);
    }

    let notified = 0;
    for (const [managerMatricule, count] of countByManager.entries()) {
      try {
        await this.notificationsService.create({
          destinataire_matricule: managerMatricule,
          titre: 'Évaluations en attente de validation',
          message: `Vous avez ${count} évaluation(s) en attente de validation depuis plus de 3 jours.`,
          type: 'warning',
          lien: '/evaluations',
        });
        notified++;
      } catch (err) {
        this.logger.error(
          `[5.3] Erreur notification manager ${managerMatricule}: ${err}`,
        );
      }
    }

    this.logger.log(`[5.3] ${notified} managers notifiés`);
    return notified;
  }
}
