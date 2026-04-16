import { Injectable } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import {
  normalizeRuleRow,
  parseRuleEnvelope,
  type RuleCriterion,
} from './rule-schema';

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
  constructor(private pg: DatabasePgService) {}

  async listActives() {
    const rows = await this.pg.query(
      `SELECT
         id_regle,
         nom_regle,
         description,
         criteres_evaluation_json,
         est_active,
         role_evaluateur,
         role_evalue,
         type_evaluation,
         created_at,
         updated_at
       FROM regles_evaluation
       WHERE est_active = true
       ORDER BY created_at DESC`,
    );
    return rows.map((row) => normalizeRuleRow(row as any));
  }

  async findById(id: string) {
    const row = await this.pg.queryOne(
      `SELECT
         id_regle,
         nom_regle,
         description,
         criteres_evaluation_json,
         est_active,
         role_evaluateur,
         role_evalue,
         type_evaluation,
         created_at,
         updated_at
       FROM regles_evaluation
       WHERE id_regle = $1`,
      [id],
    );
    return row ? normalizeRuleRow(row as any) : null;
  }

  validateCriteres(criteres: Array<Critere | RuleCriterion>): { valide: boolean; erreurs: string[] } {
    const erreurs: string[] = [];
    const normalized = parseRuleEnvelope({ criteres }).criteres;

    if (normalized.length < MIN_CRITERES) {
      erreurs.push(`Minimum ${MIN_CRITERES} critères requis (actuellement: ${normalized.length})`);
    }

    const totalPonderation = normalized.reduce((sum, c) => sum + c.poids, 0);
    if (totalPonderation !== TOTAL_PONDERATION) {
      erreurs.push(`Somme des pondérations doit être ${TOTAL_PONDERATION}% (actuelle: ${totalPonderation}%)`);
    }

    normalized.forEach((c, i) => {
      const rawCritere = criteres[i] as Partial<Critere> | undefined;
      const requiredFields = ['libelle', 'description', 'poids', 'echelle', 'section_label'] as const;
      for (const field of requiredFields) {
        if (c[field] === undefined || c[field] === null) {
          erreurs.push(`Critère #${i}: champ '${field}' manquant`);
        }
      }

      if (c.poids !== undefined && (typeof c.poids !== 'number' || c.poids <= 0)) {
        erreurs.push(`Critère #${i}: pondération doit être un nombre positif`);
      }

      if (c.echelle) {
        if (c.echelle.min !== ECHELLE_MIN || c.echelle.max !== ECHELLE_MAX) {
          erreurs.push(`Critère #${i}: échelle doit être de ${ECHELLE_MIN} à ${ECHELLE_MAX}`);
        }
      }

      if (rawCritere?.categorie && !CATEGORIES_VALIDES.includes(rawCritere.categorie)) {
        erreurs.push(`Critère #${i}: catégorie invalide`);
      }

      if (c.section_label && !CATEGORIES_VALIDES.includes(c.section_label) && c.section_label.length > 80) {
        erreurs.push(`Critère #${i}: libellé de section trop long`);
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
      visibility_detail_options: ['aggregated', 'detailed'],
    };
  }
}
