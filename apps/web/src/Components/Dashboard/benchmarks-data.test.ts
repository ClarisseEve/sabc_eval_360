import { describe, expect, it } from 'vitest';

import { buildBenchmarkView } from './benchmarks-data';

const critere = (
  critere_id: string,
  sujet: number | null,
  region: number | null,
  top_performers: number | null = null,
) => ({ critere_id, sujet, region, top_performers });

describe('buildBenchmarkView', () => {
  it('expose une ligne par critère avec les trois séries', () => {
    const view = buildBenchmarkView([critere('leadership', 3.5, 3, 4.2)]);

    expect(view.rows).toEqual([
      { critere: 'leadership', sujet: 3.5, region: 3, top: 4.2, ecart: 0.5 },
    ]);
  });

  it('identifie le critère où le sujet devance le plus sa région', () => {
    const view = buildBenchmarkView([
      critere('leadership', 4, 3),
      critere('execution', 3.2, 3),
    ]);

    expect(view.force).toEqual({ critere: 'leadership', ecart: 1 });
  });

  it('identifie le critère où le sujet est le plus en retrait', () => {
    const view = buildBenchmarkView([
      critere('leadership', 4, 3),
      critere('execution', 2.5, 3.4),
    ]);

    expect(view.opportunite).toEqual({ critere: 'execution', ecart: -0.9 });
  });

  it('ne signale aucune force quand le sujet est partout en retrait', () => {
    const view = buildBenchmarkView([critere('execution', 2.5, 3.4)]);

    expect(view.force).toBeNull();
  });

  it('ignore les critères sans donnée comparable plutôt que de les compter à zéro', () => {
    const view = buildBenchmarkView([
      critere('leadership', null, 3),
      critere('execution', 3.2, null),
    ]);

    expect(view.force).toBeNull();
    expect(view.opportunite).toBeNull();
    // Les lignes restent affichées: l'absence de donnée est une information.
    expect(view.rows).toHaveLength(2);
    expect(view.rows[0].ecart).toBeNull();
    expect(view.rows[1].ecart).toBeNull();
  });

  it('arrondit les écarts au centième pour éviter les artefacts flottants', () => {
    const view = buildBenchmarkView([critere('execution', 3.3, 3.1)]);

    expect(view.rows[0].ecart).toBe(0.2);
  });

  it('retourne une vue vide sans critère', () => {
    const view = buildBenchmarkView([]);

    expect(view.rows).toEqual([]);
    expect(view.force).toBeNull();
    expect(view.opportunite).toBeNull();
  });
});
