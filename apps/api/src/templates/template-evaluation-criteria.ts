type TemplateMeta = {
  sections?: Array<{
    id?: string | number;
    titre?: string;
    description?: string;
    ordre?: number;
    competences?: Array<{
      id?: string | number;
      libelle?: string;
      description?: string;
      poids?: number | string;
      niveau_requis?: number | string;
      niveaux?: Array<{
        niveau?: number | string;
        description?: string;
      }>;
      improvement_axis_code?: string | null;
      recommendation_tags?: string[];
      recommendation_text?: string | null;
      commentaire_requis_si_note_lt?: number | null;
      echelle?: { min?: number; max?: number };
    }>;
  }>;
};

export function buildTemplateEvaluationCriteria(rawMeta: unknown) {
  let meta: unknown = rawMeta;
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta) as unknown;
    } catch {
      return null;
    }
  }
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;

  const sections = (meta as TemplateMeta).sections;
  if (!Array.isArray(sections)) return null;

  const criteres = sections.flatMap((section, sectionIndex) =>
    (Array.isArray(section.competences) ? section.competences : []).map(
      (competence, competenceIndex) => {
        const id = String(
          competence.id ??
            `section-${sectionIndex + 1}-critere-${competenceIndex + 1}`,
        );
        const niveauSection = Number(section.ordre);
        return {
          id,
          libelle: String(
            competence.libelle ?? `Compétence ${competenceIndex + 1}`,
          ),
          description: String(competence.description ?? ''),
          poids: Number(competence.poids ?? 0),
          section_label: String(section.titre ?? 'Compétences'),
          section_order:
            Number.isFinite(niveauSection) && niveauSection > 0
              ? niveauSection
              : sectionIndex + 1,
          niveau_requis: Number(competence.niveau_requis ?? 3),
          niveaux: [1, 2, 3, 4, 5].map((niveau) => {
            const level = competence.niveaux?.find(
              (item) => Number(item.niveau) === niveau,
            );
            return {
              niveau,
              description: String(level?.description ?? ''),
            };
          }),
          improvement_axis_code: competence.improvement_axis_code ?? null,
          recommendation_tags: competence.recommendation_tags ?? [],
          recommendation_text: competence.recommendation_text ?? null,
          commentaire_requis_si_note_lt:
            competence.commentaire_requis_si_note_lt ?? 3,
          echelle: {
            min: competence.echelle?.min ?? 1,
            max: competence.echelle?.max ?? 5,
          },
        };
      },
    ),
  );

  if (!criteres.length) return null;
  return {
    version: 1,
    sections: sections.map((section, index) => ({
      id: String(section.id ?? `section-${index + 1}`),
      titre: String(section.titre ?? `Section ${index + 1}`),
      description: String(section.description ?? ''),
      ordre: Number(section.ordre ?? index + 1),
      competences: (section.competences ?? []).map(
        (competence, competenceIndex) => ({
          id: String(
            competence.id ??
              `section-${index + 1}-critere-${competenceIndex + 1}`,
          ),
          libelle: String(
            competence.libelle ?? `Compétence ${competenceIndex + 1}`,
          ),
          description: String(competence.description ?? ''),
          niveau_requis: Number(competence.niveau_requis ?? 3),
          ordre: competenceIndex + 1,
        }),
      ),
    })),
    criteres,
  };
}
