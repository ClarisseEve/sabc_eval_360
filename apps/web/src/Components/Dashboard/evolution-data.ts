export type EvolutionPeriode = {
  code_periode: string;
  nom_periode: string;
  date_debut: string;
  notes: Record<string, number | null>;
};

export type EvolutionResponse = {
  criteres: string[];
  periodes: EvolutionPeriode[];
};

/** Un point de courbe: le libellé de période, puis une clé par critère. */
export type EvolutionPoint = Record<string, string | number | null>;

export type EvolutionTendance = {
  critere: string;
  delta: number;
};

export type EvolutionView = {
  points: EvolutionPoint[];
  series: string[];
  /** Critère ayant le plus progressé entre la première et la dernière période. */
  progression: EvolutionTendance | null;
  /** Critère ayant le plus reculé sur la même fenêtre. */
  pointDAttention: EvolutionTendance | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Prépare les courbes d'évolution et les deux enseignements attendus par le
 * cahier des charges: la progression marquante et le point d'attention.
 *
 * Les tendances comparent la première et la dernière période mesurées. Un
 * critère non mesuré à l'une des deux bornes est écarté: on ne peut pas
 * qualifier une progression sans point de départ ni point d'arrivée.
 */
export function buildEvolutionView(reponse: EvolutionResponse): EvolutionView {
  const series = reponse?.criteres ?? [];
  const periodes = reponse?.periodes ?? [];

  const points: EvolutionPoint[] = periodes.map((periode) => {
    const point: EvolutionPoint = { periode: periode.nom_periode || periode.code_periode };
    for (const critere of series) {
      point[critere] = periode.notes?.[critere] ?? null;
    }
    return point;
  });

  if (periodes.length < 2) {
    return { points, series, progression: null, pointDAttention: null };
  }

  const premiere = periodes[0];
  const derniere = periodes[periodes.length - 1];

  const deltas = series
    .map((critere) => {
      const depart = premiere.notes?.[critere];
      const arrivee = derniere.notes?.[critere];
      if (typeof depart !== 'number' || typeof arrivee !== 'number') return null;
      return { critere, delta: round2(arrivee - depart) };
    })
    .filter((entree): entree is EvolutionTendance => entree !== null);

  const meilleure = deltas.reduce<EvolutionTendance | null>(
    (best, entree) => (best === null || entree.delta > best.delta ? entree : best),
    null,
  );
  const pire = deltas.reduce<EvolutionTendance | null>(
    (worst, entree) => (worst === null || entree.delta < worst.delta ? entree : worst),
    null,
  );

  return {
    points,
    series,
    progression: meilleure && meilleure.delta > 0 ? meilleure : null,
    pointDAttention: pire && pire.delta < 0 ? pire : null,
  };
}
