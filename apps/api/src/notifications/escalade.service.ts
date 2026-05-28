import { Injectable, Logger } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

interface EvaluationSoumise {
  id_evaluation: string;
  evalue_matricule: string;
  date_soumission: Date;
  jours_attente: number;
}

export interface EscaladeResult {
  l1: number;
  l2: number;
  l3: number;
  l4: number;
}

@Injectable()
export class EscaladeService {
  private readonly logger = new Logger(EscaladeService.name);

  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async traiterEscalade(): Promise<EscaladeResult> {
    const evaluations = await this.pg.query<EvaluationSoumise>(
      `SELECT id_evaluation, evalue_matricule, date_soumission,
              EXTRACT(EPOCH FROM (NOW() - date_soumission)) / 86400 AS jours_attente
       FROM evaluations
       WHERE statut = 'soumis'`,
    );

    const result: EscaladeResult = { l1: 0, l2: 0, l3: 0, l4: 0 };

    for (const eval_ of evaluations) {
      const jours = Math.floor(eval_.jours_attente);
      if (jours < 3) continue;

      // Niveau 1 (≥3j) — notifier l'évaluateur
      try {
        const evalue = await this.prisma.utilisateur.findUnique({
          where: { matricule: eval_.evalue_matricule },
          select: { manager_matricule: true },
        });

        await this.notificationsService.create({
          destinataire_matricule: eval_.evalue_matricule,
          titre: 'Évaluation en attente de validation',
          message: `Votre évaluation attend validation depuis ${jours} jours.`,
          type: 'warning',
          lien: '/evaluations',
          id_evaluation: eval_.id_evaluation,
        });
        result.l1++;
        this.logger.log(`[5.4] escalade L1: évalué ${eval_.evalue_matricule} (${jours}j)`);

        if (jours < 7 || !evalue?.manager_matricule) continue;

        // Niveau 2 (≥7j) — notifier manager N+1
        const manager = await this.prisma.utilisateur.findUnique({
          where: { matricule: evalue.manager_matricule },
          select: { manager_matricule: true },
        });

        await this.notificationsService.create({
          destinataire_matricule: evalue.manager_matricule,
          titre: 'Évaluation en attente depuis plus de 7 jours',
          message: `Une évaluation de votre équipe est en attente depuis ${jours} jours.`,
          type: 'warning',
          lien: '/evaluations',
          id_evaluation: eval_.id_evaluation,
        });
        result.l2++;
        this.logger.log(`[5.4] escalade L2: manager ${evalue.manager_matricule} (${jours}j)`);

        if (jours < 10 || !manager?.manager_matricule) continue;

        // Niveau 3 (≥10j) — notifier DR/CDTT (manager N+2)
        await this.notificationsService.create({
          destinataire_matricule: manager.manager_matricule,
          titre: 'Alerte: évaluation en attente depuis plus de 10 jours',
          message: `Une évaluation de votre région est en attente depuis ${jours} jours et requiert votre attention.`,
          type: 'warning',
          lien: '/evaluations',
          id_evaluation: eval_.id_evaluation,
        });
        result.l3++;
        this.logger.log(`[5.4] escalade L3: DR/CDTT ${manager.manager_matricule} (${jours}j)`);

        if (jours < 15) continue;

        // Niveau 4 (≥15j) — notifier les admins
        const admins = await this.prisma.utilisateur.findMany({
          where: { est_admin: true, est_actif: true },
          select: { matricule: true },
        });

        for (const admin of admins) {
          await this.notificationsService.create({
            destinataire_matricule: admin.matricule,
            titre: 'Alerte critique: évaluation en attente depuis plus de 15 jours',
            message: `Une évaluation est en attente de validation depuis ${jours} jours. Intervention requise.`,
            type: 'warning',
            lien: '/evaluations',
            id_evaluation: eval_.id_evaluation,
          });
          result.l4++;
        }
        if (admins.length > 0) {
          this.logger.log(`[5.4] escalade L4: ${admins.length} admins notifiés (${jours}j)`);
        }
      } catch (err) {
        this.logger.error(
          `[5.4] Erreur escalade pour évaluation ${eval_.id_evaluation}: ${err}`,
        );
      }
    }

    this.logger.log(
      `[5.4] escalade terminée — L1:${result.l1} L2:${result.l2} L3:${result.l3} L4:${result.l4}`,
    );
    return result;
  }
}
