import { COMPETENCE_LEVELS, type CompetenceLevelDescription } from '../../../../utils/competence-levels';

export {
  COMPETENCE_LEVELS,
  createEmptyCompetenceLevels,
  normalizeCompetenceLevels,
  type CompetenceLevelDescription,
} from '../../../../utils/competence-levels';

export function areCompetenceLevelsComplete(levels: CompetenceLevelDescription[]): boolean {
  return COMPETENCE_LEVELS.every((niveau) =>
    levels.some((level) => level.niveau === niveau && level.description.trim().length > 0),
  );
}
