import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemplacementsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    titulaire_matricule: string;
    remplacant_matricule: string;
    role_remplace: string;
    region_remplacement: string;
    motif: string;
    date_debut: string;
    date_fin?: string;
    duree_prevue_jours: number;
    service_remplacement?: string;
    cree_par: string;
  }) {
    const [titulaire, remplacant] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { matricule: data.titulaire_matricule } }),
      this.prisma.utilisateur.findUnique({ where: { matricule: data.remplacant_matricule } }),
    ]);

    if (!titulaire || !remplacant) throw new NotFoundException('Titulaire ou remplaçant introuvable');
    if (data.duree_prevue_jours < 30) throw new BadRequestException('Durée minimale: 30 jours');

    // Check existing active replacement for same role
    // Using raw query on MySQL replacement_temporaire table
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id_remplacement FROM replacement_temporaire
       WHERE titulaire_matricule = ? AND role_remplace = ? AND est_actif = 1
         AND (date_fin IS NULL OR date_fin >= ?)
       LIMIT 1`,
      data.titulaire_matricule, data.role_remplace, data.date_debut,
    );

    if (existing.length > 0) {
      throw new BadRequestException('Ce titulaire est déjà remplacé pour ce rôle');
    }

    // Insert replacement
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO replacement_temporaire
        (titulaire_matricule, remplacant_matricule, role_remplace, region_remplacement,
         service_remplacement, date_debut, date_fin, duree_prevue_jours, motif,
         cree_par, est_actif, notifications_envoyees, equipe_notifiee, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, NOW(), NOW())`,
      data.titulaire_matricule, data.remplacant_matricule, data.role_remplace,
      data.region_remplacement, data.service_remplacement ?? null,
      data.date_debut, data.date_fin ?? null, data.duree_prevue_jours,
      data.motif, data.cree_par,
    );

    // Update titulaire status
    await this.prisma.utilisateur.update({
      where: { matricule: data.titulaire_matricule },
      data: {
        statut: 'Indisponible',
        date_debut_indisponibilite: new Date(data.date_debut),
        date_fin_indisponibilite: data.date_fin ? new Date(data.date_fin) : null,
        motif_indisponibilite: data.motif,
      },
    });

    return { success: true, message: 'Remplacement créé avec succès' };
  }

  async terminer(idRemplacement: number, dateFin?: string) {
    const dateFinEffective = dateFin ?? new Date().toISOString().split('T')[0];

    // Update replacement
    await this.prisma.$executeRawUnsafe(
      `UPDATE replacement_temporaire SET est_actif = 0, date_fin_effective = ?, updated_at = NOW()
       WHERE id_remplacement = ?`,
      dateFinEffective, idRemplacement,
    );

    // Get replacement to find matricules
    const remplacement = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT titulaire_matricule, remplacant_matricule FROM replacement_temporaire WHERE id_remplacement = ?`,
      idRemplacement,
    );

    if (!remplacement.length) throw new NotFoundException('Remplacement introuvable');

    const { titulaire_matricule, remplacant_matricule } = remplacement[0];

    // Check if titulaire has other active replacements
    const otherActive = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT 1 FROM replacement_temporaire
       WHERE titulaire_matricule = ? AND est_actif = 1 AND id_remplacement != ? LIMIT 1`,
      titulaire_matricule, idRemplacement,
    );

    if (otherActive.length === 0) {
      await this.prisma.utilisateur.update({
        where: { matricule: titulaire_matricule },
        data: { statut: 'Actif', date_fin_indisponibilite: new Date(dateFinEffective) },
      });
    }

    // Same for remplacant
    const otherActiveR = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT 1 FROM replacement_temporaire
       WHERE remplacant_matricule = ? AND est_actif = 1 AND id_remplacement != ? LIMIT 1`,
      remplacant_matricule, idRemplacement,
    );

    if (otherActiveR.length === 0) {
      await this.prisma.utilisateur.update({
        where: { matricule: remplacant_matricule },
        data: { statut: 'Actif' },
      });
    }

    return { success: true, message: 'Remplacement terminé' };
  }

  async getActifs() {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT r.*, t.nom as titulaire_nom, t.prenom as titulaire_prenom,
              re.nom as remplacant_nom, re.prenom as remplacant_prenom
       FROM replacement_temporaire r
       LEFT JOIN utilisateurs t ON r.titulaire_matricule = t.matricule
       LEFT JOIN utilisateurs re ON r.remplacant_matricule = re.matricule
       WHERE r.est_actif = 1 AND r.date_debut <= NOW()
         AND (r.date_fin IS NULL OR r.date_fin >= NOW())
       ORDER BY r.date_debut DESC`,
    );
  }

  async getAVenir() {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT r.*, t.nom as titulaire_nom, t.prenom as titulaire_prenom,
              re.nom as remplacant_nom, re.prenom as remplacant_prenom
       FROM replacement_temporaire r
       LEFT JOIN utilisateurs t ON r.titulaire_matricule = t.matricule
       LEFT JOIN utilisateurs re ON r.remplacant_matricule = re.matricule
       WHERE r.est_actif = 1 AND r.date_debut > NOW()
       ORDER BY r.date_debut ASC`,
    );
  }

  async getHistorique(limit = 50) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT r.*, t.nom as titulaire_nom, t.prenom as titulaire_prenom,
              re.nom as remplacant_nom, re.prenom as remplacant_prenom
       FROM replacement_temporaire r
       LEFT JOIN utilisateurs t ON r.titulaire_matricule = t.matricule
       LEFT JOIN utilisateurs re ON r.remplacant_matricule = re.matricule
       WHERE r.est_actif = 0 OR (r.est_actif = 1 AND r.date_fin < NOW())
       ORDER BY r.date_fin DESC LIMIT ?`,
      limit,
    );
  }

  async getPourUtilisateur(matricule: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT r.*, t.nom as titulaire_nom, t.prenom as titulaire_prenom,
              re.nom as remplacant_nom, re.prenom as remplacant_prenom
       FROM replacement_temporaire r
       LEFT JOIN utilisateurs t ON r.titulaire_matricule = t.matricule
       LEFT JOIN utilisateurs re ON r.remplacant_matricule = re.matricule
       WHERE r.titulaire_matricule = ? OR r.remplacant_matricule = ?
       ORDER BY r.date_debut DESC`,
      matricule, matricule,
    );
  }
}
