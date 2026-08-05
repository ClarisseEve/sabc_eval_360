import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ValidationScopeUser {
  matricule: string;
  manager_matricule?: string | null;
  role_nom?: string | null;
  role?: string | null;
  id_region?: string | null;
}

export interface ValidationAuthorization {
  canValidate: boolean;
  reason?: string;
}

@Injectable()
export class ValidationManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async peutValider(
    validateurMatricule: string,
    evalueMatricule: string,
  ): Promise<ValidationAuthorization> {
    const [validateur, evalue] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { matricule: validateurMatricule } }),
      this.prisma.utilisateur.findUnique({ where: { matricule: evalueMatricule } }),
    ]);

    return this.peutValiderUtilisateurs(validateur, evalue);
  }

  peutValiderUtilisateurs(
    validateur: ValidationScopeUser | null | undefined,
    evalue: ValidationScopeUser | null | undefined,
  ): ValidationAuthorization {
    if (!validateur || !evalue) {
      return { canValidate: false, reason: 'Utilisateur introuvable' };
    }

    if (evalue.manager_matricule === validateur.matricule) {
      return { canValidate: true };
    }

    if (this.verifierDRCDTT(validateur, evalue)) {
      return { canValidate: true };
    }

    return { canValidate: false, reason: 'Non autorisé à valider cette évaluation' };
  }

  aPorteeRegionale(validateur: ValidationScopeUser): boolean {
    const role = (validateur.role_nom ?? validateur.role ?? '').toUpperCase().trim();

    return (role === 'DR' || role === 'CDTT') && validateur.id_region != null;
  }

  verifierDRCDTT(validateur: ValidationScopeUser, evalue: ValidationScopeUser): boolean {
    return (
      this.aPorteeRegionale(validateur) &&
      evalue.id_region != null &&
      validateur.id_region === evalue.id_region
    );
  }

  validerMotifRejet(
    motif: string | null | undefined,
    estValidee: boolean,
  ): { valid: boolean; error?: string } {
    if (estValidee === true) {
      return { valid: true };
    }

    const trimmed = motif?.trim() ?? '';

    if (!trimmed) {
      return { valid: false, error: 'Le motif de rejet est obligatoire' };
    }

    if (trimmed.length < 20) {
      return { valid: false, error: 'Le motif de rejet doit contenir au moins 20 caractères' };
    }

    if (trimmed.length > 1000) {
      return { valid: false, error: 'Le motif de rejet ne peut pas dépasser 1000 caractères' };
    }

    return { valid: true };
  }
}
