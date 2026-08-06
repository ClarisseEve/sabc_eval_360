import type { BenchmarkCritere } from '@/Services/api';

export type BenchmarkRow = {
  critere: string;
  sujet: number | null;
  region: number | null;
  top: number | null;
  /** Écart du sujet à la moyenne de sa région; null si l'un des deux manque. */
  ecart: number | null;
};

export type BenchmarkHighlight = {
  critere: string;
  ecart: number;
};

export type BenchmarkView = {
  rows: BenchmarkRow[];
  /** Critère où le sujet devance le plus sa région, s'il en existe un. */
  force: BenchmarkHighlight | null;
  /** Critère où le sujet est le plus en retrait, s'il en existe un. */
  opportunite: BenchmarkHighlight | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Prépare l'affichage des benchmarks: une ligne par critère et les deux
 * enseignements attendus par le cahier des charges (force marquante et
 * opportunité d'apprentissage).
 *
 * Un critère sans donnée comparable garde sa ligne mais n'entre pas dans les
 * enseignements: compter une absence de mesure comme un écart nul induirait
 * en erreur.
 */
export function buildBenchmarkView(criteres: BenchmarkCritere[]): BenchmarkView {
  const rows: BenchmarkRow[] = (criteres ?? []).map((critere) => ({
    critere: critere.critere_id,
    sujet: critere.sujet,
    region: critere.region,
    top: critere.top_performers,
    ecart:
      critere.sujet == null || critere.region == null
        ? null
        : round2(critere.sujet - critere.region),
  }));

  const comparables = rows.filter(
    (row): row is BenchmarkRow & { ecart: number } => row.ecart != null,
  );

  const meilleur = comparables.reduce<BenchmarkRow & { ecart: number } | null>(
    (best, row) => (best === null || row.ecart > best.ecart ? row : best),
    null,
  );
  const pire = comparables.reduce<BenchmarkRow & { ecart: number } | null>(
    (worst, row) => (worst === null || row.ecart < worst.ecart ? row : worst),
    null,
  );

  return {
    rows,
    force:
      meilleur && meilleur.ecart > 0
        ? { critere: meilleur.critere, ecart: meilleur.ecart }
        : null,
    opportunite:
      pire && pire.ecart < 0 ? { critere: pire.critere, ecart: pire.ecart } : null,
  };
}
