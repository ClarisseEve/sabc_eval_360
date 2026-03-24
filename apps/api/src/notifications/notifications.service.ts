import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

export type NotificationType = 'info' | 'success' | 'warning' | 'reminder' | 'evaluation' | 'validation';

export interface CreateNotificationDto {
  destinataire_matricule: string;
  titre: string;
  message: string;
  type: NotificationType;
  lien?: string;
  donnees_json?: Record<string, any>;
  id_evaluation?: string;
  id_remplacement?: number;
  expediteur_matricule?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateNotificationDto) {
    const id = randomUUID();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO notifications_utilisateurs
       (id_notification, destinataire_matricule, titre, message, type, lien, donnees_json,
        id_evaluation, id_remplacement, expediteur_matricule, est_lu, date_creation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      id,
      data.destinataire_matricule,
      data.titre,
      data.message,
      data.type,
      data.lien ?? null,
      data.donnees_json ? JSON.stringify(data.donnees_json) : null,
      data.id_evaluation ?? null,
      data.id_remplacement ?? null,
      data.expediteur_matricule ?? null,
    );
    return { id_notification: id };
  }

  async getForUser(matricule: string, options?: { non_lues_seulement?: boolean; limit?: number }) {
    const limit = options?.limit ?? 50;
    const luFilter = options?.non_lues_seulement ? 'AND est_lu = 0' : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM notifications_utilisateurs
       WHERE destinataire_matricule = ? ${luFilter}
       ORDER BY date_creation DESC LIMIT ?`,
      matricule,
      limit,
    );
  }

  async countNonLues(matricule: string): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      'SELECT COUNT(*) as count FROM notifications_utilisateurs WHERE destinataire_matricule = ? AND est_lu = 0',
      matricule,
    );
    return Number(result[0]?.count ?? 0);
  }

  async marquerCommeLue(id: string) {
    await this.prisma.$executeRawUnsafe(
      'UPDATE notifications_utilisateurs SET est_lu = 1, date_lecture = NOW() WHERE id_notification = ?',
      id,
    );
    return { success: true };
  }

  async marquerToutesLues(matricule: string) {
    await this.prisma.$executeRawUnsafe(
      'UPDATE notifications_utilisateurs SET est_lu = 1, date_lecture = NOW() WHERE destinataire_matricule = ? AND est_lu = 0',
      matricule,
    );
    return { success: true };
  }

  // ── Notification helpers ──

  async notifierNouvelleEvaluation(matriculeEvalue: string, matriculeEvaluateur: string) {
    return this.create({
      destinataire_matricule: matriculeEvalue,
      titre: 'Nouvelle évaluation',
      message: `Une évaluation vous a été assignée par ${matriculeEvaluateur}`,
      type: 'evaluation',
      expediteur_matricule: matriculeEvaluateur,
      donnees_json: { evaluateur_matricule: matriculeEvaluateur },
    });
  }

  async notifierValidationEvaluation(matriculeEvaluateur: string, estValidee: boolean) {
    return this.create({
      destinataire_matricule: matriculeEvaluateur,
      titre: estValidee ? 'Évaluation validée' : 'Évaluation rejetée',
      message: estValidee
        ? 'Votre évaluation a été validée par votre manager'
        : 'Votre évaluation a été rejetée. Veuillez la corriger et la soumettre à nouveau.',
      type: 'validation',
    });
  }

  async notifierRappelEvaluation(matriculeUtilisateur: string, joursRestants: number) {
    return this.create({
      destinataire_matricule: matriculeUtilisateur,
      titre: 'Rappel évaluation',
      message: `Il vous reste ${joursRestants} jour(s) pour compléter vos évaluations en cours`,
      type: 'reminder',
      donnees_json: { jours_restants: joursRestants },
    });
  }
}
