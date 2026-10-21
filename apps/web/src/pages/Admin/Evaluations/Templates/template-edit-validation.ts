import { areCompetenceLevelsComplete } from './template-levels';
import type { CompetenceLevelDescription } from './template-levels';

interface TemplateEditCompetence {
  libelle: string;
  poids: string;
  niveaux: CompetenceLevelDescription[];
}

interface TemplateEditSection {
  titre: string;
  competences: TemplateEditCompetence[];
}

export function getTemplateEditValidationError(
  titre: string,
  sections: TemplateEditSection[],
): string | null {
  if (!titre.trim()) {
    return 'Le titre du template est requis.';
  }

  if (sections.length === 0) {
    return 'Ajoutez au moins une section au template.';
  }

  let totalPoids = 0;

  for (const [sectionIndex, section] of sections.entries()) {
    const nomSection = section.titre.trim() || `section ${sectionIndex + 1}`;

    if (!section.titre.trim()) {
      return `Le nom de la section ${sectionIndex + 1} est manquant.`;
    }

    if (section.competences.length === 0) {
      return `Ajoutez au moins une compétence à la section « ${nomSection} ».`;
    }

    for (const [competenceIndex, competence] of section.competences.entries()) {
      const nomCompetence = competence.libelle.trim() || `compétence ${competenceIndex + 1}`;
      const position = `« ${nomCompetence} » dans la section « ${nomSection} »`;

      if (!competence.libelle.trim()) {
        return `Le libellé de la compétence ${competenceIndex + 1} de la section « ${nomSection} » est manquant.`;
      }

      if (!areCompetenceLevelsComplete(competence.niveaux)) {
        return `Renseignez les cinq descriptions de niveau pour ${position}.`;
      }

      const poids = Number(competence.poids.replace(',', '.'));
      if (!Number.isFinite(poids) || poids <= 0) {
        return `Le poids de ${position} doit être supérieur à 0 %.`;
      }

      totalPoids += poids;
    }
  }

  if (Math.abs(totalPoids - 100) > 0.01) {
    return `La somme des poids doit être égale à 100 %. Total actuel : ${totalPoids.toFixed(2)} %.`;
  }

  return null;
}
