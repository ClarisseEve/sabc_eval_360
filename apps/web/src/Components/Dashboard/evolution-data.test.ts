import { describe, expect, it } from 'vitest';

import { buildEvolutionView } from './evolution-data';

const reponse = (
  criteres: string[],
  periodes: Array<{ code_periode: string; nom_periode: string; notes: Record<string, number | null> }>,
) => ({
  criteres,
  periodes: periodes.map((periode) => ({ ...periode, date_debut: '2025-01-01' })),
});

describe('buildEvolutionView', () => {
  it('produit un point par période avec une valeur par critère', () => {
    const view = buildEvolutionView(
      reponse(
        ['execution', 'leadership'],
        [
          { code_periode: 'P1', nom_periode: 'Semestre 1', notes: { execution: 4, leadership: 3 } },
          { code_periode: 'P2', nom_periode: 'Semestre 2', notes: { execution: 4.5, leadership: 4 } },
        ],
      ),
    );

    expect(view.series).toEqual(['execution', 'leadership']);
    expect(view.points).toEqual([
      { periode: 'Semestre 1', execution: 4, leadership: 3 },
      { periode: 'Semestre 2', execution: 4.5, leadership: 4 },
    ]);
  });

  it('signale une progression sur le critère qui gagne le plus entre la première et la dernière période', () => {
    const view = buildEvolutionView(
      reponse(
        ['execution', 'leadership'],
        [
          { code_periode: 'P1', nom_periode: 'S1', notes: { execution: 4, leadership: 2 } },
          { code_periode: 'P2', nom_periode: 'S2', notes: { execution: 4.2, leadership: 4 } },
        ],
      ),
    );

    expect(view.progression).toEqual({ critere: 'leadership', delta: 2 });
  });

  it('signale un point d’attention sur le critère qui recule le plus', () => {
    const view = buildEvolutionView(
      reponse(
        ['execution', 'leadership'],
        [
          { code_periode: 'P1', nom_periode: 'S1', notes: { execution: 4, leadership: 3 } },
          { code_periode: 'P2', nom_periode: 'S2', notes: { execution: 2.5, leadership: 3 } },
        ],
      ),
    );

    expect(view.pointDAttention).toEqual({ critere: 'execution', delta: -1.5 });
  });

  it('n’infère aucune tendance à partir d’une seule période', () => {
    const view = buildEvolutionView(
      reponse(['execution'], [{ code_periode: 'P1', nom_periode: 'S1', notes: { execution: 4 } }]),
    );

    expect(view.progression).toBeNull();
    expect(view.pointDAttention).toBeNull();
  });

  it('ignore un critère non mesuré à l’une des deux bornes', () => {
    const view = buildEvolutionView(
      reponse(
        ['execution'],
        [
          { code_periode: 'P1', nom_periode: 'S1', notes: { execution: null } },
          { code_periode: 'P2', nom_periode: 'S2', notes: { execution: 4 } },
        ],
      ),
    );

    expect(view.progression).toBeNull();
  });

  it('retourne une vue vide sans période', () => {
    const view = buildEvolutionView(reponse([], []));

    expect(view.points).toEqual([]);
    expect(view.series).toEqual([]);
    expect(view.progression).toBeNull();
  });
});
