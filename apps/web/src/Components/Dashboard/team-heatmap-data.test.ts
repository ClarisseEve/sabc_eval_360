import { describe, expect, it } from 'vitest';

import { buildTeamHeatmapView } from './team-heatmap-data';

const reponse = (
  criteres: string[],
  membres: Array<{ matricule: string; notes: Record<string, number | null> }>,
) => ({ criteres, membres });

describe('buildTeamHeatmapView', () => {
  it('produit une cellule par couple membre × critère', () => {
    const view = buildTeamHeatmapView(
      reponse(
        ['execution', 'leadership'],
        [{ matricule: 'M002', notes: { execution: 4, leadership: 2 } }],
      ),
    );

    expect(view.xLabels).toEqual(['execution', 'leadership']);
    expect(view.yLabels).toEqual(['M002']);
    expect(view.cells).toEqual([
      { x: 'execution', y: 'M002', value: 4 },
      { x: 'leadership', y: 'M002', value: 2 },
    ]);
  });

  it('omet les cellules non évaluées au lieu de les afficher à zéro', () => {
    const view = buildTeamHeatmapView(
      reponse(
        ['execution', 'leadership'],
        [{ matricule: 'M002', notes: { execution: 4, leadership: null } }],
      ),
    );

    expect(view.cells).toEqual([{ x: 'execution', y: 'M002', value: 4 }]);
  });

  it('identifie la force collective de l’équipe', () => {
    const view = buildTeamHeatmapView(
      reponse(
        ['execution', 'leadership'],
        [
          { matricule: 'M002', notes: { execution: 4, leadership: 2 } },
          { matricule: 'M003', notes: { execution: 5, leadership: 3 } },
        ],
      ),
    );

    expect(view.forceCollective).toEqual({ critere: 'execution', moyenne: 4.5 });
  });

  it('identifie l’axe à développer et la part de l’équipe en dessous du seuil de compétence', () => {
    const view = buildTeamHeatmapView(
      reponse(
        ['execution', 'leadership'],
        [
          { matricule: 'M002', notes: { execution: 4, leadership: 2 } },
          { matricule: 'M003', notes: { execution: 5, leadership: 2 } },
        ],
      ),
    );

    expect(view.axeADevelopper).toEqual({
      critere: 'leadership',
      moyenne: 2,
      partSousLeSeuil: 100,
    });
  });

  it('propose comme relais le membre le plus fort sur l’axe faible', () => {
    const view = buildTeamHeatmapView(
      reponse(
        ['leadership'],
        [
          { matricule: 'M002', notes: { leadership: 2 } },
          { matricule: 'M003', notes: { leadership: 4 } },
        ],
      ),
    );

    expect(view.relais).toEqual({ matricule: 'M003', critere: 'leadership', note: 4 });
  });

  it('ne propose aucun relais si personne n’atteint le niveau expert sur l’axe faible', () => {
    const view = buildTeamHeatmapView(
      reponse(
        ['leadership'],
        [
          { matricule: 'M002', notes: { leadership: 2 } },
          { matricule: 'M003', notes: { leadership: 3 } },
        ],
      ),
    );

    expect(view.relais).toBeNull();
  });

  it('retourne une vue vide pour une équipe sans donnée', () => {
    const view = buildTeamHeatmapView(reponse([], []));

    expect(view.cells).toEqual([]);
    expect(view.forceCollective).toBeNull();
    expect(view.axeADevelopper).toBeNull();
    expect(view.relais).toBeNull();
  });
});
