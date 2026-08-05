import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type Utilisateur,
  type replacement_temporaire as Replacement,
} from '@prisma/client';
import { getDoualaDate } from '../periodes/douala-date';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRemplacementDto } from './dto/create-remplacement.dto';
import { UpdateRemplacementDto } from './dto/update-remplacement.dto';

const MINIMUM_DURATION_DAYS = 30;
const DAY_IN_MS = 86_400_000;
const BLOCKED_USER_STATUSES = ['Inactif', 'Suspendu'];

type ReplacementCreateInput = CreateRemplacementDto & { cree_par: string };
type TransactionClient = Prisma.TransactionClient;
type ReplacementUser = Pick<
  Utilisateur,
  | 'matricule'
  | 'nom'
  | 'prenom'
  | 'email'
  | 'telephone'
  | 'role'
  | 'est_actif'
  | 'est_indisponible'
  | 'statut'
>;

const REPLACEMENT_USER_SELECT = {
  matricule: true,
  nom: true,
  prenom: true,
  email: true,
  telephone: true,
  role: true,
  est_actif: true,
  est_indisponible: true,
  statut: true,
} satisfies Prisma.UtilisateurSelect;

@Injectable()
export class RemplacementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ReplacementCreateInput) {
    const normalized = {
      titulaire_matricule: this.requiredText(
        data.titulaire_matricule,
        'Le matricule du titulaire',
      ),
      remplacant_matricule: this.requiredText(
        data.remplacant_matricule,
        'Le matricule du remplaçant',
      ),
      role_remplace: this.requiredText(data.role_remplace, 'Le rôle remplacé'),
      region_remplacement: this.requiredText(
        data.region_remplacement,
        'La région de remplacement',
      ),
      service_remplacement: this.optionalText(data.service_remplacement),
      motif: this.requiredText(data.motif, 'Le motif'),
      date_debut: this.parseDate(data.date_debut, 'date_debut'),
      date_fin: data.date_fin
        ? this.parseDate(data.date_fin, 'date_fin')
        : null,
      duree_prevue_jours: data.duree_prevue_jours,
      cree_par: this.requiredText(data.cree_par, 'Le créateur'),
    };

    this.validatePeriod(
      normalized.date_debut,
      normalized.date_fin,
      normalized.duree_prevue_jours,
    );
    this.validateDifferentUsers(
      normalized.titulaire_matricule,
      normalized.remplacant_matricule,
    );

    const id = await this.prisma.$transaction(
      async (tx) => {
        await this.validateUsersAreActive(
          tx,
          normalized.titulaire_matricule,
          normalized.remplacant_matricule,
        );
        await this.validateNoOverlap(tx, {
          titulaireMatricule: normalized.titulaire_matricule,
          roleRemplace: normalized.role_remplace,
          dateDebut: normalized.date_debut,
          dateFin: normalized.date_fin,
        });

        const replacement = await tx.replacement_temporaire.create({
          data: {
            ...normalized,
            est_actif: true,
            notifications_envoyees: false,
            equipe_notifiee: false,
          },
        });

        const today = this.today();
        if (this.isCurrent(replacement, today)) {
          await this.markTitulaireUnavailable(tx, replacement);
        }

        return replacement.id_remplacement;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return this.getById(id);
  }

  async terminer(idRemplacement: number | bigint, dateFin?: string) {
    const id = this.toBigIntId(idRemplacement);
    const effectiveEnd = dateFin
      ? this.parseDate(dateFin, 'date_fin')
      : this.today();
    const today = this.today();

    await this.prisma.$transaction(
      async (tx) => {
        const replacement = await tx.replacement_temporaire.findUnique({
          where: { id_remplacement: id },
        });
        if (!replacement) {
          throw new NotFoundException('Remplacement introuvable');
        }

        const wasCurrent = this.isCurrent(replacement, today);
        if (replacement.est_actif) {
          await tx.replacement_temporaire.update({
            where: { id_remplacement: id },
            data: {
              est_actif: false,
              date_fin_effective: effectiveEnd,
              updated_at: new Date(),
            },
          });
        }

        if (wasCurrent) {
          await this.synchronizeTitulaire(
            tx,
            replacement.titulaire_matricule,
            today,
          );
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { success: true, message: 'Remplacement terminé' };
  }

  async getById(idRemplacement: number | bigint) {
    const id = this.toBigIntId(idRemplacement);
    const replacement = await this.prisma.replacement_temporaire.findUnique({
      where: { id_remplacement: id },
    });
    if (!replacement) {
      throw new NotFoundException('Remplacement introuvable');
    }
    return (await this.addUserDetails([replacement]))[0];
  }

  async update(idRemplacement: number | bigint, data: UpdateRemplacementDto) {
    const id = this.toBigIntId(idRemplacement);
    const today = this.today();

    await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.replacement_temporaire.findUnique({
          where: { id_remplacement: id },
        });
        if (!existing) {
          throw new NotFoundException('Remplacement introuvable');
        }

        const updatedData = {
          titulaire_matricule:
            data.titulaire_matricule === undefined
              ? existing.titulaire_matricule
              : this.requiredText(
                  data.titulaire_matricule,
                  'Le matricule du titulaire',
                ),
          remplacant_matricule:
            data.remplacant_matricule === undefined
              ? existing.remplacant_matricule
              : this.requiredText(
                  data.remplacant_matricule,
                  'Le matricule du remplaçant',
                ),
          role_remplace:
            data.role_remplace === undefined
              ? existing.role_remplace
              : this.requiredText(data.role_remplace, 'Le rôle remplacé'),
          region_remplacement:
            data.region_remplacement === undefined
              ? existing.region_remplacement
              : this.requiredText(
                  data.region_remplacement,
                  'La région de remplacement',
                ),
          service_remplacement:
            data.service_remplacement === undefined
              ? existing.service_remplacement
              : this.optionalText(data.service_remplacement),
          motif:
            data.motif === undefined
              ? existing.motif
              : this.requiredText(data.motif, 'Le motif'),
          date_debut:
            data.date_debut === undefined
              ? existing.date_debut
              : this.parseDate(data.date_debut, 'date_debut'),
          date_fin:
            data.date_fin === undefined
              ? existing.date_fin
              : data.date_fin === null
                ? null
                : this.parseDate(data.date_fin, 'date_fin'),
          duree_prevue_jours:
            data.duree_prevue_jours ?? existing.duree_prevue_jours,
        };

        this.validatePeriod(
          updatedData.date_debut,
          updatedData.date_fin,
          updatedData.duree_prevue_jours,
        );
        this.validateDifferentUsers(
          updatedData.titulaire_matricule,
          updatedData.remplacant_matricule,
        );
        await this.validateUsersAreActive(
          tx,
          updatedData.titulaire_matricule,
          updatedData.remplacant_matricule,
        );

        if (existing.est_actif) {
          await this.validateNoOverlap(tx, {
            titulaireMatricule: updatedData.titulaire_matricule,
            roleRemplace: updatedData.role_remplace,
            dateDebut: updatedData.date_debut,
            dateFin: updatedData.date_fin,
            excludeId: id,
          });
        }

        const wasCurrent = this.isCurrent(existing, today);
        const replacement = await tx.replacement_temporaire.update({
          where: { id_remplacement: id },
          data: { ...updatedData, updated_at: new Date() },
        });
        const isNowCurrent = this.isCurrent(replacement, today);

        if (wasCurrent) {
          await this.synchronizeTitulaire(
            tx,
            existing.titulaire_matricule,
            today,
          );
        }
        if (
          isNowCurrent &&
          (!wasCurrent ||
            replacement.titulaire_matricule !== existing.titulaire_matricule)
        ) {
          await this.synchronizeTitulaire(
            tx,
            replacement.titulaire_matricule,
            today,
          );
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return this.getById(id);
  }

  async getActifs() {
    const today = this.today();
    const replacements = await this.prisma.replacement_temporaire.findMany({
      where: this.currentWhere(today),
      orderBy: { date_debut: 'desc' },
    });
    return this.addUserDetails(replacements);
  }

  async getAVenir() {
    const replacements = await this.prisma.replacement_temporaire.findMany({
      where: {
        est_actif: true,
        date_debut: { gt: this.today() },
      },
      orderBy: { date_debut: 'asc' },
    });
    return this.addUserDetails(replacements);
  }

  async getHistorique(limit = 50) {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), 500)
      : 50;
    const replacements = await this.prisma.replacement_temporaire.findMany({
      where: {
        OR: [
          { est_actif: false },
          { est_actif: true, date_fin: { lt: this.today() } },
        ],
      },
      orderBy: { date_fin: 'desc' },
      take: safeLimit,
    });
    return this.addUserDetails(replacements);
  }

  async getPourUtilisateur(matricule: string) {
    const replacements = await this.prisma.replacement_temporaire.findMany({
      where: {
        OR: [
          { titulaire_matricule: matricule },
          { remplacant_matricule: matricule },
        ],
      },
      orderBy: { date_debut: 'desc' },
    });
    return this.addUserDetails(replacements);
  }

  async synchronizeScheduledReplacements(date = getDoualaDate()) {
    const today = this.parseDate(date, 'date');

    return this.prisma.$transaction(
      async (tx) => {
        const expired = await tx.replacement_temporaire.findMany({
          where: {
            est_actif: true,
            date_fin: { lt: today },
          },
        });
        const affectedMatricules = new Set<string>();
        let closed = 0;

        for (const replacement of expired) {
          const result = await tx.replacement_temporaire.updateMany({
            where: {
              id_remplacement: replacement.id_remplacement,
              est_actif: true,
            },
            data: {
              est_actif: false,
              date_fin_effective: replacement.date_fin ?? today,
              updated_at: new Date(),
            },
          });
          closed += result.count;
          affectedMatricules.add(replacement.titulaire_matricule);
        }

        const current = await tx.replacement_temporaire.findMany({
          where: this.currentWhere(today),
        });
        for (const replacement of current) {
          affectedMatricules.add(replacement.titulaire_matricule);
        }

        let activated = 0;
        for (const matricule of affectedMatricules) {
          activated += await this.synchronizeTitulaire(tx, matricule, today);
        }

        return { activated, closed };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async addUserDetails(replacements: Replacement[]) {
    if (replacements.length === 0) return [];

    const matricules = [
      ...new Set(
        replacements.flatMap((replacement) => [
          replacement.titulaire_matricule,
          replacement.remplacant_matricule,
        ]),
      ),
    ];
    const users = await this.prisma.utilisateur.findMany({
      where: { matricule: { in: matricules } },
      select: REPLACEMENT_USER_SELECT,
    });
    const usersByMatricule = new Map(
      users.map((user) => [user.matricule, user] as const),
    );

    return replacements.map((replacement) => {
      const titulaire = usersByMatricule.get(replacement.titulaire_matricule);
      const remplacant = usersByMatricule.get(replacement.remplacant_matricule);

      return {
        ...replacement,
        id_remplacement: Number(replacement.id_remplacement),
        titulaire_nom: titulaire?.nom ?? null,
        titulaire_prenom: titulaire?.prenom ?? null,
        titulaire_email: titulaire?.email ?? null,
        titulaire_telephone: titulaire?.telephone ?? null,
        titulaire_role: titulaire?.role ?? null,
        remplacant_nom: remplacant?.nom ?? null,
        remplacant_prenom: remplacant?.prenom ?? null,
        remplacant_email: remplacant?.email ?? null,
        remplacant_telephone: remplacant?.telephone ?? null,
        remplacant_role: remplacant?.role ?? null,
      };
    });
  }

  private async validateUsersAreActive(
    tx: TransactionClient,
    titulaireMatricule: string,
    remplacantMatricule: string,
  ): Promise<void> {
    const users = await tx.utilisateur.findMany({
      where: { matricule: { in: [titulaireMatricule, remplacantMatricule] } },
      select: REPLACEMENT_USER_SELECT,
    });
    const byMatricule = new Map(
      users.map((user) => [user.matricule, user] as const),
    );
    const titulaire = byMatricule.get(titulaireMatricule);
    const remplacant = byMatricule.get(remplacantMatricule);

    if (!titulaire) throw new NotFoundException('Titulaire introuvable');
    if (!remplacant) throw new NotFoundException('Remplaçant introuvable');
    this.validateUserIsActive(titulaire, 'Le titulaire');
    this.validateUserIsActive(remplacant, 'Le remplaçant');
  }

  private validateUserIsActive(user: ReplacementUser, label: string): void {
    if (!user.est_actif || BLOCKED_USER_STATUSES.includes(user.statut)) {
      throw new BadRequestException(`${label} doit avoir un compte actif`);
    }
  }

  private async validateNoOverlap(
    tx: TransactionClient,
    input: {
      titulaireMatricule: string;
      roleRemplace: string;
      dateDebut: Date;
      dateFin: Date | null;
      excludeId?: bigint;
    },
  ): Promise<void> {
    const where: Prisma.replacement_temporaireWhereInput = {
      titulaire_matricule: input.titulaireMatricule,
      role_remplace: input.roleRemplace,
      est_actif: true,
      id_remplacement: input.excludeId ? { not: input.excludeId } : undefined,
      date_debut: input.dateFin ? { lte: input.dateFin } : undefined,
      OR: [{ date_fin: null }, { date_fin: { gte: input.dateDebut } }],
    };
    const existing = await tx.replacement_temporaire.findFirst({
      where,
      select: { id_remplacement: true },
    });
    if (existing) {
      throw new BadRequestException(
        'Ce titulaire est déjà remplacé pour ce rôle sur cette période',
      );
    }
  }

  private async synchronizeTitulaire(
    tx: TransactionClient,
    matricule: string,
    today: Date,
  ): Promise<number> {
    const current = await tx.replacement_temporaire.findFirst({
      where: {
        ...this.currentWhere(today),
        titulaire_matricule: matricule,
      },
      orderBy: { date_debut: 'desc' },
    });

    if (current) {
      return this.markTitulaireUnavailable(tx, current);
    }
    return this.restoreTitulaireIfSafe(tx, matricule);
  }

  private async markTitulaireUnavailable(
    tx: TransactionClient,
    replacement: Replacement,
  ): Promise<number> {
    const user = await tx.utilisateur.findUnique({
      where: { matricule: replacement.titulaire_matricule },
      select: REPLACEMENT_USER_SELECT,
    });
    if (
      !user ||
      !user.est_actif ||
      BLOCKED_USER_STATUSES.includes(user.statut)
    ) {
      return 0;
    }

    const wasAlreadyUnavailable =
      user.statut === 'Indisponible' && user.est_indisponible;
    await tx.utilisateur.updateMany({
      where: {
        matricule: replacement.titulaire_matricule,
        est_actif: true,
        statut: { notIn: BLOCKED_USER_STATUSES },
      },
      data: {
        statut: 'Indisponible',
        est_indisponible: true,
        date_debut_indisponibilite: replacement.date_debut,
        date_fin_indisponibilite: replacement.date_fin,
        motif_indisponibilite: replacement.motif,
      },
    });
    return wasAlreadyUnavailable ? 0 : 1;
  }

  private async restoreTitulaireIfSafe(
    tx: TransactionClient,
    matricule: string,
  ): Promise<number> {
    const user = await tx.utilisateur.findUnique({
      where: { matricule },
      select: REPLACEMENT_USER_SELECT,
    });
    if (
      !user ||
      !user.est_actif ||
      BLOCKED_USER_STATUSES.includes(user.statut) ||
      (user.statut !== 'Indisponible' && !user.est_indisponible)
    ) {
      return 0;
    }

    await tx.utilisateur.updateMany({
      where: {
        matricule,
        est_actif: true,
        statut: { notIn: BLOCKED_USER_STATUSES },
      },
      data: {
        statut: 'Actif',
        est_indisponible: false,
        date_debut_indisponibilite: null,
        date_fin_indisponibilite: null,
        motif_indisponibilite: null,
      },
    });
    return 0;
  }

  private currentWhere(today: Date): Prisma.replacement_temporaireWhereInput {
    return {
      est_actif: true,
      date_debut: { lte: today },
      OR: [{ date_fin: null }, { date_fin: { gte: today } }],
    };
  }

  private isCurrent(replacement: Replacement, today: Date): boolean {
    return (
      replacement.est_actif &&
      replacement.date_debut.getTime() <= today.getTime() &&
      (replacement.date_fin === null ||
        replacement.date_fin.getTime() >= today.getTime())
    );
  }

  private validateDifferentUsers(
    titulaireMatricule: string,
    remplacantMatricule: string,
  ): void {
    if (titulaireMatricule === remplacantMatricule) {
      throw new BadRequestException(
        'Le titulaire et le remplaçant doivent être différents',
      );
    }
  }

  private validatePeriod(
    dateDebut: Date,
    dateFin: Date | null,
    durationDays: number,
  ): void {
    if (
      !Number.isInteger(durationDays) ||
      durationDays < MINIMUM_DURATION_DAYS
    ) {
      throw new BadRequestException(
        `Durée minimale: ${MINIMUM_DURATION_DAYS} jours`,
      );
    }
    if (!dateFin) return;
    if (dateFin.getTime() < dateDebut.getTime()) {
      throw new BadRequestException(
        'La date de fin doit être postérieure ou égale à la date de début',
      );
    }

    const inclusiveDuration =
      Math.floor((dateFin.getTime() - dateDebut.getTime()) / DAY_IN_MS) + 1;
    if (durationDays !== inclusiveDuration) {
      throw new BadRequestException(
        `La durée prévue doit correspondre aux dates (${inclusiveDuration} jours)`,
      );
    }
  }

  private parseDate(value: string, field: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${field} doit être au format YYYY-MM-DD`);
    }
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(`${field} est invalide`);
    }
    return parsed;
  }

  private today(): Date {
    return this.parseDate(getDoualaDate(), 'date');
  }

  private requiredText(value: string, label: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new BadRequestException(`${label} est requis`);
    return trimmed;
  }

  private optionalText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed || null;
  }

  private toBigIntId(id: number | bigint): bigint {
    try {
      const parsed = BigInt(id);
      if (parsed < 1n) throw new Error('invalid');
      return parsed;
    } catch {
      throw new BadRequestException('Identifiant de remplacement invalide');
    }
  }
}
