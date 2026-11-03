export type CompetencyCriterion = {
  id: string | number;
  libelle: string;
  note: number | null;
  niveauRequis: number;
};

export function summarizeCompetencies(criteria: CompetencyCriterion[]) {
  return criteria.reduce<{
    acquired: CompetencyCriterion[];
    needsWork: CompetencyCriterion[];
    notRated: CompetencyCriterion[];
  }>(
    (summary, criterion) => {
      if (criterion.note == null || !Number.isFinite(criterion.note)) {
        summary.notRated.push(criterion);
      } else if (criterion.note >= criterion.niveauRequis) {
        summary.acquired.push(criterion);
      } else {
        summary.needsWork.push(criterion);
      }

      return summary;
    },
    { acquired: [], needsWork: [], notRated: [] },
  );
}
