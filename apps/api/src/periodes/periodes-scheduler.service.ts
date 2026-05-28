import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabasePgService } from '../database/database-pg.service';
import { NotificationsOuvertureService } from '../notifications/notifications-ouverture.service';
import { NotificationsRappelService } from '../notifications/notifications-rappel.service';
import { PeriodesService } from './periodes.service';

@Injectable()
export class PeriodesSchedulerService {
  private readonly logger = new Logger(PeriodesSchedulerService.name);

  constructor(
    private pg: DatabasePgService,
    private periodesService: PeriodesService,
    private notificationsRappelService: NotificationsRappelService,
    private notificationsOuvertureService: NotificationsOuvertureService,
  ) {}

  // 00:01 Africa/Douala — open periods starting today
  @Cron('1 0 * * *', { timeZone: 'Africa/Douala' })
  async ouvrirPeriodes(): Promise<{ opened: number }> {
    const today = new Date().toISOString().split('T')[0];
    const periodes = await this.pg.query<{
      id_periode: string;
      nom_periode: string;
      date_fin: string;
    }>(
      `SELECT id_periode, nom_periode, date_fin FROM periodes_evaluation
       WHERE DATE(date_debut) = $1 AND statut = 'planifiee' AND est_ouverte = false`,
      [today],
    );

    let opened = 0;
    for (const p of periodes) {
      try {
        await this.periodesService.ouvrir(p.id_periode);
        this.logger.log(`Période ouverte: ${p.nom_periode}`);
        opened++;
        // Story 5.1 — notify all active non-ADMIN users
        this.notificationsOuvertureService
          .notifierOuverturePeriode(p.id_periode, p.nom_periode, p.date_fin)
          .catch((err) =>
            this.logger.error(`[5.1] Erreur notifications ouverture ${p.nom_periode}: ${err}`),
          );
      } catch (err) {
        this.logger.error(`Erreur ouverture ${p.nom_periode}: ${err}`);
      }
    }
    return { opened };
  }

  // 09:00 Africa/Douala — send reminders (J-7, J-3, J-1)
  @Cron('0 9 * * *', { timeZone: 'Africa/Douala' })
  async envoyerRappels(): Promise<{ sent: number }> {
    const today = new Date().toISOString().split('T')[0];
    const periodes = await this.pg.query<any>(
      `SELECT id_periode, nom_periode, date_fin, dates_rappels_json
       FROM periodes_evaluation
       WHERE est_ouverte = true AND est_cloturee = false`,
    );

    let sent = 0;
    for (const p of periodes) {
      const rappels: string[] = Array.isArray(p.dates_rappels_json)
        ? p.dates_rappels_json
        : typeof p.dates_rappels_json === 'string'
          ? JSON.parse(p.dates_rappels_json)
          : [];

      if (rappels.includes(today)) {
        const daysLeft = Math.ceil((new Date(p.date_fin).getTime() - Date.now()) / 86400000);
        const dispatched = await this.notificationsRappelService.envoyerRappelsPeriode(
          p.id_periode,
          p.nom_periode,
          p.date_fin,
          daysLeft,
        );
        sent += dispatched;
      }
    }
    return { sent };
  }

  // 23:59 Africa/Douala — close periods ending today
  // Note: periodesService.fermer() already calls calculateStatistiques() internally
  @Cron('59 23 * * *', { timeZone: 'Africa/Douala' })
  async fermerPeriodes(): Promise<{ closed: number }> {
    const today = new Date().toISOString().split('T')[0];
    const periodes = await this.pg.query<{ id_periode: string; nom_periode: string }>(
      `SELECT id_periode, nom_periode FROM periodes_evaluation
       WHERE DATE(date_fin) = $1 AND est_ouverte = true AND est_cloturee = false`,
      [today],
    );

    let closed = 0;
    for (const p of periodes) {
      try {
        await this.periodesService.fermer(p.id_periode);
        this.logger.log(`Période fermée: ${p.nom_periode}`);
        closed++;
      } catch (err) {
        this.logger.error(`Erreur fermeture ${p.nom_periode}: ${err}`);
      }
    }
    return { closed };
  }
}
