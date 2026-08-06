import { describe, expect, it } from 'vitest';

import { failedSources } from './settled-sources';

const ok = (data: unknown): PromiseSettledResult<any> => ({
  status: 'fulfilled',
  value: { data },
});
const ko = (reason = new Error('boom')): PromiseSettledResult<any> => ({
  status: 'rejected',
  reason,
});

describe('failedSources', () => {
  it('ne signale rien quand toutes les sources répondent', () => {
    expect(failedSources({ scores: ok([]), axes: ok([]) })).toEqual([]);
  });

  it('nomme les sources en échec', () => {
    expect(failedSources({ scores: ko(), axes: ok([]), regles: ko() })).toEqual([
      'scores',
      'regles',
    ]);
  });

  it('distingue une source vide d’une source en échec', () => {
    // Le cœur du problème: une réponse vide est une donnée légitime,
    // un rejet ne l'est pas. Les confondre affiche « 0 » comme une vérité.
    expect(failedSources({ scores: ok([]) })).toEqual([]);
    expect(failedSources({ scores: ko() })).toEqual(['scores']);
  });

  it('accepte un ensemble vide', () => {
    expect(failedSources({})).toEqual([]);
  });
});
