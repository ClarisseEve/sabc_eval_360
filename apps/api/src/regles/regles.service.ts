import { Injectable, BadRequestException } from '@nestjs/common';

const CATEGORIES_VALIDES = [
  'Compétences techniques',
  'Soft skills',
  'Leadership',
  'Performance',
  'Innovation',
  "Travail d'équipe",
  'Autonomie',
  'Résolution de problèmes',
];

const MIN_CRITERES = 5;
const TOTAL_PONDERATION = 100;
const ECHELLE_MIN = 1;
const ECHELLE_MAX = 5;

export interface Critere {
  nom: string;
  description: string;
  ponderation: number;
  echelle: { min: number; max: number };
  categorie: string;
}

@Injectable()
export class ReglesService {
  validateCriteres(criteres: Critere[]): { valide: boolean; erreurs: string[] } {
    const erreurs: string[] = [];

    if (criteres.length < MIN_CRITERES) {
      erreurs.push(`Minimum ${MIN_CRITERES} critères requis (actuellement: ${criteres.length})`);
    }

    const totalPonderation = criteres.reduce((sum, c) => sum + c.ponderation, 0);
    if (totalPonderation !== TOTAL_PONDERATION) {
      erreurs.push(`Somme des pondérations doit être ${TOTAL_PONDERATION}% (actuelle: ${totalPonderation}%)`);
    }

    criteres.forEach((c, i) => {
      const requiredFields = ['nom', 'description', 'ponderation', 'echelle', 'categorie'] as const;
      for (const field of requiredFields) {
        if (c[field] === undefined || c[field] === null) {
          erreurs.push(`Critère #${i}: champ '${field}' manquant`);
        }
      }

      if (c.ponderation !== undefined && (typeof c.ponderation !== 'number' || c.ponderation <= 0)) {
        erreurs.push(`Critère #${i}: pondération doit être un nombre positif`);
      }

      if (c.echelle) {
        if (c.echelle.min !== ECHELLE_MIN || c.echelle.max !== ECHELLE_MAX) {
          erreurs.push(`Critère #${i}: échelle doit être de ${ECHELLE_MIN} à ${ECHELLE_MAX}`);
        }
      }

      if (c.categorie && !CATEGORIES_VALIDES.includes(c.categorie)) {
        erreurs.push(`Critère #${i}: catégorie '${c.categorie}' invalide`);
      }
    });

    return { valide: erreurs.length === 0, erreurs };
  }

  getCategoriesValides(): string[] {
    return [...CATEGORIES_VALIDES];
  }

  getConstraints() {
    return {
      min_criteres: MIN_CRITERES,
      total_ponderation: TOTAL_PONDERATION,
      echelle_min: ECHELLE_MIN,
      echelle_max: ECHELLE_MAX,
      categories_valides: CATEGORIES_VALIDES,
    };
  }
}
