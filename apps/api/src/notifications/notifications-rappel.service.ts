import { Injectable, Logger } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsRappelService {
  private readonly logger = new Logger(NotificationsRappelService.name);

  constructor(
    private pg: DatabasePgService,
    private notificationsService: NotificationsService,
  ) {}

  async envoyerRappelsPeriode(
    idPeriode: string,
    nomPeriode: string,
    _dateFin: string,
    joursRestants: number,
  ): Promise<number> {
    const evaluateurs = await this.pg.query<{ evaluateur_matricule: string }>(
      `SELECT DISTINCT evaluateur_matricule FROM evaluations
       WHERE id_periode = $1 AND statut = 'brouillon'`,
      [idPeriode],
    );

    let count = 0;
    for (const row of evaluateurs) {
      await this.notificationsService.notifierRappelEvaluation(
        row.evaluateur_matricule,
        joursRestants,
      );
      count++;
    }

    this.logger.log(`[5.2] ${count} rappels envoyés pour période ${nomPeriode}`);
    return count;
  }
}
