export const RATING_SHEET_CATEGORIES = [
  'auto',
  'pairs',
  'descendante',
  'admin',
] as const;

export type RatingSheetCategory = (typeof RATING_SHEET_CATEGORIES)[number];
export type RatingSheetMethod = 'moyenne' | 'ponderee';

export function isRatingSheetCategory(
  value: unknown,
): value is RatingSheetCategory {
  return RATING_SHEET_CATEGORIES.some((category) => category === value);
}

export function isRatingSheetMethod(
  value: unknown,
): value is RatingSheetMethod {
  return value === 'moyenne' || value === 'ponderee';
}

export interface RatingSheetCategoryConfig {
  type: RatingSheetCategory;
  poids: number;
}

export interface RatingSheetConfiguration {
  methode_calcul: RatingSheetMethod;
  categories: RatingSheetCategoryConfig[];
}

export interface RatingSheetEvaluation {
  id_evaluation: string;
  type_evaluation: string;
  statut: string;
  date_validation?: string | Date | null;
  note_globale?: number | string | null;
  notations_json: unknown;
  evaluateur_role?: string | null;
  rule_json?: unknown;
}

export type RatingSheetMention = 'Non acquis' | 'Presque acquis' | 'Acquis';

export interface RatingSheetCompetence {
  id: string;
  libelle: string;
  description: string;
  section_label: string;
  section_order: number;
  poids: number;
  niveau_requis: number;
  recommendation_text: string | null;
  score: number | null;
  mention: RatingSheetMention | null;
  notes_par_categorie: Partial<Record<RatingSheetCategory, number | null>>;
  mentions_par_categorie: Partial<
    Record<RatingSheetCategory, RatingSheetMention | null>
  >;
}

export interface RatingSheetCategoryResult {
  type: RatingSheetCategory;
  poids: number;
  evaluations_recues: number;
  complete: boolean;
  note_sur_20: number | null;
  evaluations: Array<{ date_validation: string | Date | null }>;
}

export interface RatingSheetSnapshot {
  personne: {
    matricule: string;
    nom: string;
    prenom: string;
    role: string;
    service: string | null;
    branche: string | null;
  };
  periode: {
    id_periode: string;
    nom: string;
    code: string;
    date_debut: string;
    date_fin: string;
  };
  emise_le: string;
  methode_calcul: RatingSheetMethod;
  statut: 'complete' | 'partielle';
  categories: RatingSheetCategoryResult[];
  note_generale_sur_20: number | null;
  competences: RatingSheetCompetence[];
  forces: Array<{ libelle: string; score: number | null }>;
  lacunes: Array<{
    libelle: string;
    mention: RatingSheetMention | null;
    score: number | null;
    axe: string | null;
  }>;
}

interface Criterion {
  id: string;
  libelle: string;
  description: string;
  section_label: string;
  section_order: number;
  poids: number;
  niveau_requis: number;
  recommendation_text: string | null;
}

interface CriterionRating {
  critere_id: string;
  note: number;
}

function safeParse(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    throw new Error('Les données JSON de l’évaluation sont invalides.', {
      cause: error,
    });
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numericValue(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === '') return fallback;
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function textValue(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function getRuleCriteria(value: unknown): Criterion[] {
  const parsed = asRecord(safeParse(value));
  const rawCriteria = parsed?.criteres;
  const criteria: unknown[] = Array.isArray(rawCriteria) ? rawCriteria : [];
  return criteria.map((value, index) => {
    const criterion = asRecord(value) ?? {};
    const recommendation = criterion.recommendation_text;
    return {
      id: textValue(criterion.id, `critere-${index + 1}`),
      libelle: textValue(criterion.libelle, `Compétence ${index + 1}`),
      description: textValue(criterion.description, ''),
      section_label: textValue(criterion.section_label, 'Compétences'),
      section_order: numericValue(criterion.section_order, 1),
      poids: numericValue(criterion.poids, 0),
      niveau_requis: numericValue(criterion.niveau_requis, 3),
      recommendation_text:
        typeof recommendation === 'string' && recommendation
          ? recommendation
          : null,
    };
  });
}

function getNotes(value: unknown): CriterionRating[] {
  const parsed = safeParse(value);
  const notes: unknown[] = Array.isArray(parsed) ? parsed : [];
  return notes.flatMap((value) => {
    const note = asRecord(value) ?? {};
    const score = numericValue(note.note, Number.NaN);
    const id = textValue(note.critere_id, '').trim();
    return id && Number.isFinite(score) && score >= 1 && score <= 5
      ? [{ critere_id: id, note: score }]
      : [];
  });
}

export function categoryForEvaluation(
  evaluation: RatingSheetEvaluation,
): RatingSheetCategory | null {
  if (String(evaluation.evaluateur_role ?? '').toUpperCase() === 'ADMIN')
    return 'admin';
  if (evaluation.type_evaluation === 'auto') return 'auto';
  if (evaluation.type_evaluation === 'pairs') return 'pairs';
  if (evaluation.type_evaluation === 'descendante') return 'descendante';
  return null;
}

export function validateRatingSheetConfiguration(
  configuration: RatingSheetConfiguration,
): string | null {
  if (!['moyenne', 'ponderee'].includes(configuration.methode_calcul)) {
    return 'La méthode de calcul est invalide.';
  }
  if (
    !Array.isArray(configuration.categories) ||
    configuration.categories.length < 1
  ) {
    return 'Sélectionnez au moins une catégorie d’évaluation.';
  }
  const seen = new Set<string>();
  for (const category of configuration.categories) {
    if (
      !RATING_SHEET_CATEGORIES.includes(category.type) ||
      seen.has(category.type)
    ) {
      return 'La configuration contient une catégorie invalide ou en double.';
    }
    seen.add(category.type);
    if (
      !Number.isFinite(category.poids) ||
      category.poids <= 0 ||
      category.poids > 100
    ) {
      return 'Le poids de chaque catégorie doit être compris entre 0 et 100 %.';
    }
  }
  if (configuration.methode_calcul === 'ponderee') {
    const total = configuration.categories.reduce(
      (sum, category) => sum + category.poids,
      0,
    );
    if (Math.abs(total - 100) > 0.01)
      return `La somme des poids doit être égale à 100 %. Total actuel : ${total} %.`;
  }
  return null;
}

function mentionForScore(score: number, required: number): RatingSheetMention {
  if (score >= required) return 'Acquis';
  if (score >= required - 1) return 'Presque acquis';
  return 'Non acquis';
}

export function buildRatingSheet(
  user: {
    matricule: string;
    nom: string;
    prenom: string;
    email?: string;
    role_nom: string;
    service?: string | null;
    branche?: string | null;
  },
  period: {
    id_periode: string;
    nom_periode: string;
    code_periode: string;
    date_debut: string;
    date_fin: string;
  },
  configuration: RatingSheetConfiguration,
  evaluations: RatingSheetEvaluation[],
  issuedAt = new Date(),
): RatingSheetSnapshot {
  const configuredCategories = new Map(
    configuration.categories.map((category) => [category.type, category]),
  );
  const validEvaluations = evaluations.filter(
    (evaluation) => evaluation.statut === 'valide',
  );
  const categoryResults: RatingSheetCategoryResult[] =
    RATING_SHEET_CATEGORIES.filter((type) =>
      configuredCategories.has(type),
    ).map((type) => {
      const matching = validEvaluations.filter(
        (evaluation) => categoryForEvaluation(evaluation) === type,
      );
      const scores: number[] = matching
        .map((evaluation) => evaluation.note_globale)
        .filter(
          (score): score is number | string =>
            score !== null && score !== undefined,
        )
        .map(Number)
        .filter((score) => Number.isFinite(score) && score >= 1 && score <= 5);
      const scoreSur20 = scores.length
        ? scores.reduce<number>(
            (sum: number, score: number) => sum + score * 4,
            0,
          ) / scores.length
        : null;
      const configured = configuredCategories.get(type)!;

      return {
        type,
        poids:
          configuration.methode_calcul === 'moyenne'
            ? 100 / configuredCategories.size
            : configured.poids,
        evaluations_recues: matching.length,
        complete: scoreSur20 !== null,
        note_sur_20: scoreSur20 === null ? null : Number(scoreSur20.toFixed(2)),
        evaluations: matching.map((evaluation) => ({
          date_validation: evaluation.date_validation ?? null,
        })),
      };
    });

  const availableCategories = categoryResults.filter(
    (category) => category.note_sur_20 !== null,
  );
  const availableWeight = availableCategories.reduce(
    (sum, category) => sum + category.poids,
    0,
  );
  const noteGenerale =
    availableWeight > 0
      ? availableCategories.reduce(
          (sum, category) => sum + category.note_sur_20! * category.poids,
          0,
        ) / availableWeight
      : null;

  const categoryScores = new Map(
    availableCategories.map((category) => [
      category.type,
      category.poids / availableWeight,
    ]),
  );
  const criteria = new Map<string, Criterion>();
  const ratingBuckets = new Map<string, Map<RatingSheetCategory, number[]>>();
  for (const evaluation of validEvaluations) {
    const category = categoryForEvaluation(evaluation);
    if (!category || !configuredCategories.has(category)) continue;
    const ruleCriteria = getRuleCriteria(evaluation.rule_json);
    const notesById = new Map(
      getNotes(evaluation.notations_json).map((note) => [
        note.critere_id,
        note.note,
      ]),
    );
    for (const criterion of ruleCriteria) {
      criteria.set(criterion.id, criterion);
      const rating = notesById.get(criterion.id);
      if (rating === undefined) continue;
      const categoryMap =
        ratingBuckets.get(criterion.id) ??
        new Map<RatingSheetCategory, number[]>();
      categoryMap.set(category, [...(categoryMap.get(category) ?? []), rating]);
      ratingBuckets.set(criterion.id, categoryMap);
    }
  }

  const competences = Array.from(criteria.values())
    .map((criterion) => {
      const byCategory =
        ratingBuckets.get(criterion.id) ??
        new Map<RatingSheetCategory, number[]>();
      const categoryNotes: RatingSheetCompetence['notes_par_categorie'] = {};
      const categoryMentions: RatingSheetCompetence['mentions_par_categorie'] =
        {};
      for (const category of categoryResults) {
        const notes = byCategory.get(category.type) ?? [];
        const score = notes.length
          ? Number(
              (
                notes.reduce((sum, note) => sum + note, 0) / notes.length
              ).toFixed(2),
            )
          : null;
        categoryNotes[category.type] = score;
        categoryMentions[category.type] =
          score === null
            ? null
            : mentionForScore(score, criterion.niveau_requis);
      }
      const contributions = Array.from(byCategory.entries()).flatMap(
        ([type, notes]) => {
          const weight = categoryScores.get(type);
          return weight && notes.length
            ? [
                {
                  score:
                    notes.reduce((sum, score) => sum + score, 0) / notes.length,
                  weight,
                },
              ]
            : [];
        },
      );
      const score = contributions.length
        ? contributions.reduce(
            (sum, contribution) =>
              sum + contribution.score * contribution.weight,
            0,
          ) /
          contributions.reduce(
            (sum, contribution) => sum + contribution.weight,
            0,
          )
        : null;
      const roundedScore = score === null ? null : Number(score.toFixed(2));
      const mention =
        roundedScore === null
          ? null
          : mentionForScore(roundedScore, criterion.niveau_requis);

      return {
        ...criterion,
        score: roundedScore,
        mention,
        notes_par_categorie: categoryNotes,
        mentions_par_categorie: categoryMentions,
      };
    })
    .sort(
      (a, b) =>
        a.section_order - b.section_order ||
        a.libelle.localeCompare(b.libelle, 'fr'),
    );

  return {
    personne: {
      matricule: user.matricule,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role_nom,
      service: user.service ?? null,
      branche: user.branche ?? null,
    },
    periode: {
      id_periode: period.id_periode,
      nom: period.nom_periode,
      code: period.code_periode,
      date_debut: period.date_debut,
      date_fin: period.date_fin,
    },
    emise_le: issuedAt.toISOString(),
    methode_calcul: configuration.methode_calcul,
    statut: categoryResults.every((category) => category.complete)
      ? 'complete'
      : 'partielle',
    categories: categoryResults,
    note_generale_sur_20:
      noteGenerale === null ? null : Number(noteGenerale.toFixed(2)),
    competences,
    forces: competences
      .filter((competence) => competence.mention === 'Acquis')
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5)
      .map((competence) => ({
        libelle: competence.libelle,
        score: competence.score,
      })),
    lacunes: competences
      .filter(
        (competence) =>
          competence.mention !== null && competence.mention !== 'Acquis',
      )
      .map((competence) => ({
        libelle: competence.libelle,
        mention: competence.mention,
        score: competence.score,
        axe: competence.recommendation_text,
      })),
  };
}
