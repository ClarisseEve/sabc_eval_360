import { describe, expect, it } from 'vitest';

import {
  buildCommonHistoryParams,
  COMMON_HISTORY_PAGE_SIZE,
} from './history-query';

describe('buildCommonHistoryParams', () => {
  it('conserve la pagination tout en omettant les filtres Tous', () => {
    expect(
      buildCommonHistoryParams({
        page: 4,
        statut: 'tous',
        periode: 'tous',
        type: 'tous',
      }),
    ).toEqual({
      page: 4,
      limit: COMMON_HISTORY_PAGE_SIZE,
      statut: undefined,
      id_periode: undefined,
      type_evaluation: undefined,
    });
  });

  it('convertit chaque filtre d écran en paramètre serveur', () => {
    expect(
      buildCommonHistoryParams({
        page: 2,
        statut: 'soumis',
        periode: '11111111-1111-4111-8111-111111111111',
        type: 'descendante',
      }),
    ).toEqual({
      page: 2,
      limit: COMMON_HISTORY_PAGE_SIZE,
      statut: 'soumis',
      id_periode: '11111111-1111-4111-8111-111111111111',
      type_evaluation: 'descendante',
    });
  });
});
