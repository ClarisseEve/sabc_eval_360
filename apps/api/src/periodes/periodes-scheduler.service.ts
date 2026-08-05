import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { DatabasePgService } from '../database/database-pg.service';
import { NotificationsOuvertureService } from '../notifications/notifications-ouverture.service';
import { NotificationsRappelService } from '../notifications/notifications-rappel.service';
import { DOUALA_TIME_ZONE, getDoualaDate } from './douala-date';
import { PeriodesService } from './periodes.service';

@Injectable()
export class PeriodesSchedulerService {
  private readonly logger = new Logger(PeriodesSchedulerService.name);

  constructor(
    private pg: DatabasePgService,
    private periodesService: PeriodesService,
    private notificationsRappelService: NotificationsRappelService,
    private notificationsOuvertureService: NotificationsOuvertureService,
    private config: ConfigService,
  ) {}

  // 00:01 Africa/Douala — open periods starting today
  @Cron('1 0 * * *', { timeZone: DOUALA_TIME_ZONE, waitForCompletion: true })
  async ouvrirPeriodes(): Promise<{ opened: number }> {
    if (!this.isSchedulerEnabled()) return { opened: 0 };

    const today = getDoualaDate();
    const periodes = await this.pg.query<{
      id_periode: string;
      nom_periode: string;
      date_fin: string;
    }>(
      `SELECT id_periode, nom_periode, date_fin FROM periodes_evaluation
       WHERE statut = 'planifiee'
         AND est_ouverte = false
         AND est_cloturee = false
         AND $1::date BETWEEN date_debut AND date_fin
         AND NOT EXISTS (
           SELECT 1 FROM periodes_evaluation AS active
           WHERE active.statut = 'ouverte'
             AND active.est_ouverte = true
             AND active.est_cloturee = false
         )
       ORDER BY date_debut ASC`,
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
  @Cron('0 9 * * *', { timeZone: DOUALA_TIME_ZONE, waitForCompletion: true })
  async envoyerRappels(): Promise<{ sent: number }> {
    if (!this.isSchedulerEnabled()) return { sent: 0 };

    const today = getDoualaDate();
    const periodes = await this.pg.query<any>(
      `SELECT id_periode, nom_periode, date_fin::text AS date_fin, dates_rappels_json
       FROM periodes_evaluation
       WHERE statut = 'ouverte'
         AND est_ouverte = true
         AND est_cloturee = false
         AND $1::date BETWEEN date_debut AND date_fin`,
      [today],
    );

    let sent = 0;
    for (const p of periodes) {
      const rappels: string[] = Array.isArray(p.dates_rappels_json)
        ? p.dates_rappels_json
        : typeof p.dates_rappels_json === 'string'
          ? JSON.parse(p.dates_rappels_json)
          : [];

      if (rappels.includes(today)) {
        const daysLeft = Math.round(
          (Date.parse(`${p.date_fin}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`))
            / 86400000,
        );
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
  @Cron('59 23 * * *', { timeZone: DOUALA_TIME_ZONE, waitForCompletion: true })
  async fermerPeriodes(): Promise<{ closed: number }> {
    if (!this.isSchedulerEnabled()) return { closed: 0 };

    const today = getDoualaDate();
    const periodes = await this.pg.query<{ id_periode: string; nom_periode: string }>(
      `SELECT id_periode, nom_periode FROM periodes_evaluation
       WHERE statut = 'ouverte'
         AND est_ouverte = true
         AND est_cloturee = false
         AND date_fin <= $1::date`,
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

  private isSchedulerEnabled(): boolean {
    return String(this.config.get('SCHEDULER_ENABLED', 'true')).trim().toLowerCase() === 'true';
  }
}
