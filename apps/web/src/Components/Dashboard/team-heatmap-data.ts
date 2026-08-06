/**
 * Seuils de l'échelle d'évaluation 1-5, alignés sur la légende du cahier des
 * charges: 1-2 à développer, 3 compétent, 4-5 expert.
 */
export const SEUIL_COMPETENT = 3;
export const SEUIL_EXPERT = 4;

export type TeamHeatmapMembre = {
  matricule: string;
  notes: Record<string, number | null>;
};

export type TeamHeatmapResponse = {
  criteres: string[];
  membres: TeamHeatmapMembre[];
};

export type TeamHeatmapCell = {
  x: string;
  y: string;
  value: number;
};

export type TeamHeatmapView = {
  cells: TeamHeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  /** Critère où l'équipe est collectivement la plus forte. */
  forceCollective: { critere: string; moyenne: number } | null;
  /** Critère le plus faible, avec la part de l'équipe sous le seuil de compétence. */
  axeADevelopper: { critere: string; moyenne: number; partSousLeSeuil: number } | null;
  /** Membre de niveau expert sur l'axe faible, capable de servir de relais. */
  relais: { matricule: string; critere: string; note: number } | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const moyenne = (valeurs: number[]) =>
  valeurs.length === 0 ? null : round2(valeurs.reduce((a, b) => a + b, 0) / valeurs.length);

/**
 * Prépare la matrice collaborateurs × critères et les enseignements d'équipe.
 *
 * Une case non évaluée est omise plutôt que ramenée à zéro: sur une échelle
 * 1-5, un zéro se lirait comme une contre-performance alors qu'il s'agit d'une
 * absence de mesure.
 */
export function buildTeamHeatmapView(reponse: TeamHeatmapResponse): TeamHeatmapView {
  const criteres = reponse?.criteres ?? [];
  const membres = reponse?.membres ?? [];

  const cells: TeamHeatmapCell[] = [];
  for (const membre of membres) {
    for (const critere of criteres) {
      const note = membre.notes?.[critere];
      if (typeof note === 'number') {
        cells.push({ x: critere, y: membre.matricule, value: note });
      }
    }
  }

  const moyennesParCritere = criteres
    .map((critere) => {
      const notes = membres
        .map((membre) => membre.notes?.[critere])
        .filter((note): note is number => typeof note === 'number');
      return { critere, moyenne: moyenne(notes), notes };
    })
    .filter((entree): entree is { critere: string; moyenne: number; notes: number[] } =>
      entree.moyenne !== null,
    );

  const forte = moyennesParCritere.reduce<(typeof moyennesParCritere)[number] | null>(
    (best, entree) => (best === null || entree.moyenne > best.moyenne ? entree : best),
    null,
  );
  const faible = moyennesParCritere.reduce<(typeof moyennesParCritere)[number] | null>(
    (worst, entree) => (worst === null || entree.moyenne < worst.moyenne ? entree : worst),
    null,
  );

  let relais: TeamHeatmapView['relais'] = null;
  if (faible) {
    // Le relais doit être un pair de niveau expert: proposer le « moins faible »
    // d'une équipe globalement en difficulté n'aiderait personne.
    const meilleur = membres
      .map((membre) => ({ matricule: membre.matricule, note: membre.notes?.[faible.critere] }))
      .filter((entree): entree is { matricule: string; note: number } =>
        typeof entree.note === 'number' && entree.note >= SEUIL_EXPERT,
      )
      .reduce<{ matricule: string; note: number } | null>(
        (best, entree) => (best === null || entree.note > best.note ? entree : best),
        null,
      );

    if (meilleur) {
      relais = { matricule: meilleur.matricule, critere: faible.critere, note: meilleur.note };
    }
  }

  return {
    cells,
    xLabels: criteres,
    yLabels: membres.map((membre) => membre.matricule),
    forceCollective: forte ? { critere: forte.critere, moyenne: forte.moyenne } : null,
    axeADevelopper: faible
      ? {
          critere: faible.critere,
          moyenne: faible.moyenne,
          partSousLeSeuil: Math.round(
            (faible.notes.filter((note) => note < SEUIL_COMPETENT).length / faible.notes.length) * 100,
          ),
        }
      : null,
    relais,
  };
}
