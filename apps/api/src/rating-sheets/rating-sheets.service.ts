import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ruleVisibilitySql } from '../evaluations/evaluation-visibility';
import {
  buildRatingSheet,
  isRatingSheetCategory,
  isRatingSheetMethod,
  validateRatingSheetConfiguration,
} from './rating-sheet-calculation';
import type {
  RatingSheetCategoryConfig,
  RatingSheetConfiguration,
  RatingSheetEvaluation,
  RatingSheetSnapshot,
} from './rating-sheet-calculation';
import { RatingSheetPdfService } from './rating-sheet-pdf.service';
import { RatingSheetEmailService } from './rating-sheet-email.service';

interface RatingSheetUser {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  role_nom: string;
  id_service?: string | null;
  id_branche?: string | null;
}

export interface RatingSheetPeriodRow {
  id_periode: string;
  nom_periode: string;
  code_periode: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  est_ouverte: boolean;
  est_cloturee: boolean;
}

interface RatingSheetConfigurationRow {
  id_configuration?: string;
  role_evalue: string;
  methode_calcul: string;
  categories_json: unknown;
  created_at?: Date;
  updated_at?: Date;
}

interface RatingSheetEvaluationRow extends RatingSheetEvaluation {
  evaluateur_matricule: string;
  evalue_matricule: string;
}

export interface RatingSheetOverviewRow {
  id_fiche: string;
  matricule: string;
  notification_statut: string;
  notification_erreur: string | null;
  email_statut: string;
  email_erreur: string | null;
  publie_le: Date;
}

interface RatingSheetDocumentRow {
  id_fiche: string;
  matricule: string;
  contenu_json: RatingSheetSnapshot;
}

export interface RatingSheetListRow extends RatingSheetDocumentRow {
  id_periode: string;
  role_evalue: string;
  publie_le: Date;
  email_statut: string;
  nom_periode: string;
  code_periode: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class RatingSheetsService {
  private readonly logger = new Logger(RatingSheetsService.name);

  constructor(
    private readonly pg: DatabasePgService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly pdf: RatingSheetPdfService,
    private readonly email: RatingSheetEmailService,
  ) {}

  async listPeriods() {
    return this.pg.query<RatingSheetPeriodRow>(
      `SELECT id_periode, nom_periode, code_periode, date_debut, date_fin, statut, est_ouverte, est_cloturee
       FROM periodes_evaluation ORDER BY date_debut DESC`,
    );
  }

  async getAdminOverview(idPeriode: string) {
    const period = await this.getPeriod(idPeriode);
    const configurations = await this.pg.query<RatingSheetConfigurationRow>(
      `SELECT role_evalue, methode_calcul, categories_json, created_at, updated_at
       FROM rating_sheet_configurations WHERE id_periode = $1 ORDER BY role_evalue`,
      [idPeriode],
    );
    const configurationByRole = new Map(
      configurations.map((configuration) => [
        configuration.role_evalue,
        this.normalizeConfiguration(configuration),
      ]),
    );
    const roleRows = await this.prisma.role.findMany({
      where: { nom_role: { not: 'ADMIN' } },
      select: { nom_role: true },
      orderBy: { nom_role: 'asc' },
    });
    const roleNames = roleRows.map((role) => role.nom_role);
    const allRoleUsers = await this.prisma.utilisateur.findMany({
      where: { role_nom: { in: roleNames }, est_admin: false },
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        email: true,
        role_nom: true,
        est_actif: true,
        id_service: true,
        id_branche: true,
      },
      orderBy: [{ role_nom: 'asc' }, { nom: 'asc' }, { prenom: 'asc' }],
    });
    const users: RatingSheetUser[] = allRoleUsers.filter(
      (user) => user.est_actif,
    );
    const matricules = users.map((user) => user.matricule);
    const allMatricules = allRoleUsers.map((user) => user.matricule);
    const sheetRows = matricules.length
      ? await this.pg.query<RatingSheetOverviewRow>(
          `SELECT id_fiche, matricule, notification_statut, notification_erreur,
                email_statut, email_erreur, publie_le
         FROM rating_sheets WHERE id_periode = $1 AND matricule = ANY($2::varchar[])`,
          [idPeriode, matricules],
        )
      : [];
    const publishedByMatricule = new Map(
      sheetRows.map((sheet) => [sheet.matricule, sheet]),
    );
    const evaluatedMatricules = allMatricules.length
      ? new Set(
          (
            await this.pg.query<{ evalue_matricule: string }>(
              `SELECT DISTINCT evalue_matricule FROM evaluations
         WHERE id_periode = $1 AND evalue_matricule = ANY($2::varchar[])`,
              [idPeriode, allMatricules],
            )
          ).map((row) => row.evalue_matricule),
        )
      : new Set<string>();
    const lockedByRuleRole = await this.pg.query<{ role_evalue: string }>(
      `SELECT DISTINCT r.role_evalue
       FROM evaluations e
       JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.id_periode = $1 AND r.role_evalue = ANY($2::varchar[])`,
      [idPeriode, roleNames],
    );
    const lockedRoles = new Set(lockedByRuleRole.map((row) => row.role_evalue));
    for (const user of allRoleUsers) {
      if (evaluatedMatricules.has(user.matricule))
        lockedRoles.add(user.role_nom);
    }

    const evaluations = matricules.length
      ? await this.pg.query<RatingSheetEvaluationRow>(
          `SELECT e.id_evaluation, e.evaluateur_matricule, e.evalue_matricule, e.type_evaluation,
                e.statut, e.date_validation, e.note_globale, e.notations_json,
                r.criteres_evaluation_json AS rule_json
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.id_periode = $1
           AND e.evalue_matricule = ANY($2::varchar[])
           AND e.statut = 'valide'
           AND ${ruleVisibilitySql('admin')}
         ORDER BY e.date_validation ASC`,
          [idPeriode, matricules],
        )
      : [];

    const evaluatorMatricules = [
      ...new Set(
        evaluations.map((evaluation) => evaluation.evaluateur_matricule),
      ),
    ];
    const evaluatorUsers = evaluatorMatricules.length
      ? await this.prisma.utilisateur.findMany({
          where: { matricule: { in: evaluatorMatricules } },
          select: {
            matricule: true,
            role_nom: true,
            role: true,
            est_admin: true,
          },
        })
      : [];
    const evaluatorRoles = new Map(
      evaluatorUsers.map((user) => [
        user.matricule,
        user.est_admin ||
        user.role_nom.toUpperCase() === 'ADMIN' ||
        user.role.toUpperCase() === 'ADMIN'
          ? 'ADMIN'
          : user.role_nom || user.role,
      ]),
    );
    const evaluationsByMatricule = new Map<string, RatingSheetEvaluation[]>();
    for (const evaluation of evaluations) {
      const targetEvaluations =
        evaluationsByMatricule.get(evaluation.evalue_matricule) ?? [];
      targetEvaluations.push({
        ...evaluation,
        evaluateur_role:
          evaluatorRoles.get(evaluation.evaluateur_matricule) ?? null,
      });
      evaluationsByMatricule.set(
        evaluation.evalue_matricule,
        targetEvaluations,
      );
    }

    const roles = roleNames.map((role) => {
      const configuration = configurationByRole.get(role) ?? null;
      const collaborateurs = users
        .filter((user) => user.role_nom === role)
        .map((user) => {
          const sheet = publishedByMatricule.get(user.matricule);
          if (!configuration) {
            return {
              matricule: user.matricule,
              nom: user.nom,
              prenom: user.prenom,
              configuration_absente: true,
              configuration_verrouillee: lockedRoles.has(role),
              fiche: sheet ?? null,
            };
          }
          const snapshot = buildRatingSheet(
            { ...user, service: user.id_service, branche: user.id_branche },
            period,
            configuration,
            evaluationsByMatricule.get(user.matricule) ?? [],
          );
          const categoriesByType = Object.fromEntries(
            snapshot.categories.map((category) => [
              category.type,
              {
                complete: category.complete,
                evaluations_recues: category.evaluations_recues,
                note_sur_20: category.note_sur_20,
              },
            ]),
          );
          return {
            matricule: user.matricule,
            nom: user.nom,
            prenom: user.prenom,
            statut: snapshot.statut,
            note_generale_sur_20: snapshot.note_generale_sur_20,
            categories: categoriesByType,
            configuration_verrouillee: lockedRoles.has(role),
            fiche: sheet ?? null,
          };
        });
      return {
        role,
        configuration,
        configuration_verrouillee: lockedRoles.has(role),
        collaborateurs,
      };
    });

    return { periode: period, roles };
  }

  async saveConfiguration(
    idPeriode: string,
    role: string,
    configuration: RatingSheetConfiguration,
    configurateur: string,
  ) {
    await this.getPeriod(idPeriode);
    const roleExists = await this.prisma.role.findFirst({
      where: { nom_role: role },
    });
    if (!roleExists || role.toUpperCase() === 'ADMIN') {
      throw new BadRequestException('Le rôle évalué est invalide.');
    }

    const validationError = validateRatingSheetConfiguration(configuration);
    if (validationError) throw new BadRequestException(validationError);

    const users = await this.prisma.utilisateur.findMany({
      where: { role_nom: role, est_admin: false },
      select: { matricule: true },
    });
    const matricules = users.map((user) => user.matricule);
    const evaluations = await this.pg.queryOne<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.id_periode = $1
         AND (r.role_evalue = $2 OR e.evalue_matricule = ANY($3::varchar[]))`,
      [idPeriode, role, matricules],
    );
    const existingConfiguration = await this.pg.queryOne<{
      id_configuration: string;
    }>(
      `SELECT id_configuration FROM rating_sheet_configurations
       WHERE id_periode = $1 AND role_evalue = $2`,
      [idPeriode, role],
    );
    if (existingConfiguration && Number(evaluations?.total ?? 0) > 0) {
      throw new BadRequestException(
        'La configuration est figée dès la première évaluation créée pour ce rôle.',
      );
    }

    const row = await this.pg.queryOne<RatingSheetConfigurationRow>(
      `INSERT INTO rating_sheet_configurations
         (id_periode, role_evalue, methode_calcul, categories_json, configurateur_matricule)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (id_periode, role_evalue)
       DO UPDATE SET methode_calcul = EXCLUDED.methode_calcul,
                     categories_json = EXCLUDED.categories_json,
                     configurateur_matricule = EXCLUDED.configurateur_matricule,
                     updated_at = NOW()
       RETURNING role_evalue, methode_calcul, categories_json, created_at, updated_at`,
      [
        idPeriode,
        role,
        configuration.methode_calcul,
        JSON.stringify(configuration.categories),
        configurateur,
      ],
    );
    if (!row)
      throw new Error('La configuration de fiche n’a pas été enregistrée.');
    return this.normalizeConfiguration(row);
  }

  async getMySheets(matricule: string) {
    return this.pg.query<RatingSheetListRow>(
      `SELECT s.id_fiche, s.id_periode, s.role_evalue, s.contenu_json,
              s.publie_le, s.email_statut, p.nom_periode, p.code_periode
       FROM rating_sheets s
       JOIN periodes_evaluation p ON p.id_periode = s.id_periode
       WHERE s.matricule = $1 ORDER BY s.publie_le DESC`,
      [matricule],
    );
  }

  async publishForRole(
    idPeriode: string,
    role: string,
    requestedMatricules: string[] | undefined,
    publisher: string,
  ) {
    const configurationRow =
      await this.pg.queryOne<RatingSheetConfigurationRow>(
        `SELECT role_evalue, methode_calcul, categories_json
       FROM rating_sheet_configurations WHERE id_periode = $1 AND role_evalue = $2`,
        [idPeriode, role],
      );
    if (!configurationRow)
      throw new BadRequestException(
        `Aucune configuration de fiche pour le rôle ${role}.`,
      );
    const configuration = this.normalizeConfiguration(configurationRow);
    const users = await this.prisma.utilisateur.findMany({
      where: {
        role_nom: role,
        est_actif: true,
        est_admin: false,
        ...(requestedMatricules?.length
          ? { matricule: { in: requestedMatricules } }
          : {}),
      },
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        email: true,
        role_nom: true,
        id_service: true,
        id_branche: true,
      },
    });

    if (
      requestedMatricules?.length &&
      users.length !== new Set(requestedMatricules).size
    ) {
      throw new BadRequestException(
        'La sélection contient des collaborateurs invalides pour ce rôle.',
      );
    }

    const period = await this.getPeriod(idPeriode);
    const matricules = users.map((user) => user.matricule);
    const evaluations = matricules.length
      ? await this.pg.query<RatingSheetEvaluationRow>(
          `SELECT e.id_evaluation, e.evaluateur_matricule, e.evalue_matricule, e.type_evaluation,
                e.statut, e.date_validation, e.note_globale, e.notations_json,
                r.criteres_evaluation_json AS rule_json
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.id_periode = $1 AND e.evalue_matricule = ANY($2::varchar[])
           AND e.statut = 'valide' AND ${ruleVisibilitySql('admin')}
         ORDER BY e.date_validation ASC`,
          [idPeriode, matricules],
        )
      : [];
    const evaluatorMatricules = [
      ...new Set(
        evaluations.map((evaluation) => evaluation.evaluateur_matricule),
      ),
    ];
    const evaluatorUsers = evaluatorMatricules.length
      ? await this.prisma.utilisateur.findMany({
          where: { matricule: { in: evaluatorMatricules } },
          select: {
            matricule: true,
            role_nom: true,
            role: true,
            est_admin: true,
          },
        })
      : [];
    const evaluatorRoles = new Map(
      evaluatorUsers.map((evaluator) => [
        evaluator.matricule,
        evaluator.est_admin ||
        evaluator.role_nom.toUpperCase() === 'ADMIN' ||
        evaluator.role.toUpperCase() === 'ADMIN'
          ? 'ADMIN'
          : evaluator.role_nom || evaluator.role,
      ]),
    );
    const evaluationsByMatricule = new Map<string, RatingSheetEvaluation[]>();
    for (const evaluation of evaluations) {
      const targetEvaluations =
        evaluationsByMatricule.get(evaluation.evalue_matricule) ?? [];
      targetEvaluations.push({
        ...evaluation,
        evaluateur_role:
          evaluatorRoles.get(evaluation.evaluateur_matricule) ?? null,
      });
      evaluationsByMatricule.set(
        evaluation.evalue_matricule,
        targetEvaluations,
      );
    }

    const output: Array<{
      matricule: string;
      fiche_publiee: boolean;
      notification_statut: 'envoye' | 'echec';
      email_statut: 'envoye' | 'echec';
      erreurs?: string[];
    }> = [];
    for (const user of users) {
      try {
        const snapshot = buildRatingSheet(
          { ...user, service: user.id_service, branche: user.id_branche },
          period,
          configuration,
          evaluationsByMatricule.get(user.matricule) ?? [],
        );
        const pdf = await this.pdf.create(snapshot);
        const ficheId = randomUUID();
        const saved = await this.pg.queryOne<{ id_fiche: string }>(
          `INSERT INTO rating_sheets
             (id_fiche, id_periode, matricule, role_evalue, contenu_json, publie_par, publie_le,
              notification_statut, notification_erreur, email_statut, email_erreur, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), 'en_attente', NULL, 'en_attente', NULL, NOW(), NOW())
           ON CONFLICT (id_periode, matricule)
           DO UPDATE SET role_evalue = EXCLUDED.role_evalue, contenu_json = EXCLUDED.contenu_json,
                         publie_par = EXCLUDED.publie_par, publie_le = NOW(),
                         notification_statut = 'en_attente', notification_erreur = NULL,
                         email_statut = 'en_attente', email_erreur = NULL, updated_at = NOW()
           RETURNING id_fiche`,
          [
            ficheId,
            idPeriode,
            user.matricule,
            role,
            JSON.stringify(snapshot),
            publisher,
          ],
        );

        let notificationStatus: 'envoye' | 'echec' = 'envoye';
        let emailStatus: 'envoye' | 'echec' = 'envoye';
        const errors: string[] = [];
        try {
          await this.notifications.create({
            destinataire_matricule: user.matricule,
            titre: 'Votre fiche de notation est disponible',
            message: `Votre fiche de notation pour ${period.nom_periode} est disponible dans Évaluations > Mes fiches.`,
            type: 'evaluation',
            lien: '/evaluations/fiches',
            expediteur_matricule: publisher,
            donnees_json: { id_fiche: saved?.id_fiche, id_periode: idPeriode },
          });
        } catch (error) {
          notificationStatus = 'echec';
          const message =
            error instanceof Error
              ? error.message
              : 'Erreur inconnue lors de la notification.';
          errors.push(`Notification : ${message}`);
          this.logger.error(
            `Notification de fiche échouée pour ${user.matricule}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
        try {
          await this.email.send(
            user.email,
            `${user.prenom} ${user.nom}`,
            pdf,
            `fiche-notation-${user.matricule}-${period.code_periode}.pdf`,
          );
        } catch (error) {
          emailStatus = 'echec';
          const message =
            error instanceof Error
              ? error.message
              : 'Erreur inconnue lors de l’envoi par e-mail.';
          errors.push(`E-mail : ${message}`);
          this.logger.error(
            `Fiche ${saved?.id_fiche}: e-mail non envoyé à ${user.matricule}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
        await this.pg.execute(
          `UPDATE rating_sheets SET notification_statut = $1, notification_erreur = $2,
             email_statut = $3, email_erreur = $4,
             email_envoye_le = CASE WHEN $3 = 'envoye' THEN NOW() ELSE NULL END,
             updated_at = NOW() WHERE id_fiche = $5`,
          [
            notificationStatus,
            errors.find((message) => message.startsWith('Notification :')) ??
              null,
            emailStatus,
            errors.find((message) => message.startsWith('E-mail :')) ?? null,
            saved?.id_fiche,
          ],
        );
        output.push({
          matricule: user.matricule,
          fiche_publiee: true,
          notification_statut: notificationStatus,
          email_statut: emailStatus,
          ...(errors.length ? { erreurs: errors } : {}),
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur inconnue lors de la publication.';
        this.logger.error(
          `Publication de fiche échouée pour ${user.matricule}`,
          error instanceof Error ? error.stack : undefined,
        );
        output.push({
          matricule: user.matricule,
          fiche_publiee: false,
          notification_statut: 'echec',
          email_statut: 'echec',
          erreurs: [message],
        });
      }
    }
    return {
      total: output.length,
      fiches_publiees: output.filter((result) => result.fiche_publiee).length,
      notifications_echouees: output.filter(
        (result) => result.notification_statut === 'echec',
      ).length,
      emails_echoues: output.filter((result) => result.email_statut === 'echec')
        .length,
      resultats: output,
    };
  }

  async getPdf(idFiche: string, matricule: string, isAdmin: boolean) {
    const sheet = await this.pg.queryOne<RatingSheetDocumentRow>(
      `SELECT id_fiche, matricule, contenu_json FROM rating_sheets WHERE id_fiche = $1`,
      [idFiche],
    );
    if (!sheet) throw new NotFoundException('Fiche de notation introuvable.');
    if (!isAdmin && sheet.matricule !== matricule) {
      throw new NotFoundException('Fiche de notation introuvable.');
    }
    return {
      buffer: await this.pdf.create(sheet.contenu_json),
      matricule: sheet.matricule,
    };
  }

  private async getPeriod(idPeriode: string): Promise<RatingSheetPeriodRow> {
    const period = await this.pg.queryOne<RatingSheetPeriodRow>(
      `SELECT id_periode, nom_periode, code_periode, date_debut, date_fin, statut, est_ouverte, est_cloturee
       FROM periodes_evaluation WHERE id_periode = $1`,
      [idPeriode],
    );
    if (!period)
      throw new NotFoundException('Période d’évaluation introuvable.');
    return period;
  }

  private normalizeConfiguration(
    row: RatingSheetConfigurationRow,
  ): RatingSheetConfiguration {
    if (!isRatingSheetMethod(row.methode_calcul)) {
      throw new Error('La méthode de calcul enregistrée est invalide.');
    }
    let rawCategories: unknown = row.categories_json;
    if (typeof rawCategories === 'string') {
      try {
        rawCategories = JSON.parse(rawCategories) as unknown;
      } catch (error) {
        throw new Error('Les catégories enregistrées sont invalides.', {
          cause: error,
        });
      }
    }
    if (!Array.isArray(rawCategories)) {
      throw new Error('Les catégories enregistrées sont invalides.');
    }
    const categories: RatingSheetCategoryConfig[] = rawCategories.map(
      (value, index) => {
        if (
          !isRecord(value) ||
          !isRatingSheetCategory(value.type) ||
          typeof value.poids !== 'number'
        ) {
          throw new Error(
            `La catégorie ${index + 1} enregistrée est invalide.`,
          );
        }
        return { type: value.type, poids: value.poids };
      },
    );
    const configuration: RatingSheetConfiguration = {
      methode_calcul: row.methode_calcul,
      categories,
    };
    const validationError = validateRatingSheetConfiguration(configuration);
    if (validationError) throw new Error(validationError);
    return configuration;
  }
}
