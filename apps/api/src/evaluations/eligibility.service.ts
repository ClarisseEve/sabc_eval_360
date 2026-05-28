import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CanEvaluateResult {
  autorise: boolean;
  raison?: string;
}

export interface EligibleTargetsResult {
  auto: { matricule: string; nom: string; prenom: string; role: string | null } | null;
  subordonnes: { matricule: string; nom: string; prenom: string; role: string | null; role_nom: string | null }[];
  pairs: { matricule: string; nom: string; prenom: string; role: string | null; role_nom: string | null }[];
}

/** Returns true if the user is considered active across both active-status fields. */
function isUtilisateurActif(u: { statut: string; est_actif: boolean }): boolean {
  return u.statut === 'Actif' && u.est_actif;
}

@Injectable()
export class EligibilityService {
  constructor(private prisma: PrismaService) {}

  async canEvaluate(
    evaluateurMatricule: string,
    evalueMatricule: string,
    typeEvaluation: 'auto' | 'pairs' | 'subordonnes',
  ): Promise<CanEvaluateResult> {
    const [evaluateur, evalue] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { matricule: evaluateurMatricule } }),
      this.prisma.utilisateur.findUnique({ where: { matricule: evalueMatricule } }),
    ]);

    if (!evaluateur) {
      return { autorise: false, raison: 'Évaluateur introuvable' };
    }

    if (!evalue) {
      return { autorise: false, raison: 'Évalué introuvable' };
    }

    // Guard: évalué must be fully active (both statut AND est_actif).
    if (!isUtilisateurActif(evalue)) {
      return { autorise: false, raison: "L'utilisateur évalué n'est pas actif" };
    }

    // Guard: évaluateur must also be active.
    if (!isUtilisateurActif(evaluateur)) {
      return { autorise: false, raison: "L'évaluateur n'est pas actif" };
    }

    // Fetch role flags for the evaluateur's role to enforce business rules.
    const roleRecord = evaluateur.role
      ? await this.prisma.role.findUnique({ where: { nom_role: evaluateur.role } })
      : null;

    switch (typeEvaluation) {
      case 'auto': {
        if (roleRecord && !roleRecord.peut_auto_evaluer) {
          return { autorise: false, raison: "Le rôle de l'évaluateur ne permet pas l'auto-évaluation" };
        }
        if (evaluateurMatricule !== evalueMatricule) {
          return {
            autorise: false,
            raison: "L'auto-évaluation requiert que l'évaluateur et l'évalué soient la même personne",
          };
        }
        return { autorise: true };
      }

      case 'subordonnes': {
        if (roleRecord && !roleRecord.peut_evaluer_subordonnes) {
          return {
            autorise: false,
            raison: "Le rôle de l'évaluateur ne permet pas l'évaluation des subordonnés",
          };
        }
        if (evalue.manager_matricule !== evaluateurMatricule) {
          return { autorise: false, raison: "L'évalué n'est pas un subordonné direct de l'évaluateur" };
        }
        return { autorise: true };
      }

      case 'pairs': {
        if (roleRecord && !roleRecord.peut_evaluer_pairs) {
          return {
            autorise: false,
            raison: "Le rôle de l'évaluateur ne permet pas l'évaluation entre pairs",
          };
        }
        if (evaluateurMatricule === evalueMatricule) {
          return { autorise: false, raison: "L'évaluation entre pairs ne peut pas être une auto-évaluation" };
        }
        if (
          evaluateur.niveau_hierarchique !== evalue.niveau_hierarchique ||
          evaluateur.id_region !== evalue.id_region
        ) {
          return {
            autorise: false,
            raison: "L'évaluation entre pairs requiert le même niveau hiérarchique et la même région",
          };
        }
        return { autorise: true };
      }
    }
  }

  async getEligibleTargets(evaluateurMatricule: string): Promise<EligibleTargetsResult> {
    const evaluateur = await this.prisma.utilisateur.findUnique({
      where: { matricule: evaluateurMatricule },
    });

    if (!evaluateur) {
      throw new NotFoundException(`Évaluateur introuvable: ${evaluateurMatricule}`);
    }

    // An inactive evaluateur should not get a target list.
    if (!isUtilisateurActif(evaluateur)) {
      return { auto: null, subordonnes: [], pairs: [] };
    }

    const [subordonnes, pairs] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where: {
          manager_matricule: evaluateurMatricule,
          statut: 'Actif',
          est_actif: true,
          est_indisponible: false,
        },
        select: { matricule: true, nom: true, prenom: true, role: true, role_nom: true },
      }),
      this.prisma.utilisateur.findMany({
        where: {
          id_region: evaluateur.id_region ?? undefined,
          statut: 'Actif',
          est_actif: true,
          est_indisponible: false,
          matricule: { not: evaluateurMatricule },
          niveau_hierarchique: evaluateur.niveau_hierarchique ?? undefined,
        },
        select: { matricule: true, nom: true, prenom: true, role: true, role_nom: true },
      }),
    ]);

    return {
      auto: {
        matricule: evaluateur.matricule,
        nom: evaluateur.nom,
        prenom: evaluateur.prenom,
        role: evaluateur.role ?? null,
      },
      subordonnes,
      pairs,
    };
  }
}
