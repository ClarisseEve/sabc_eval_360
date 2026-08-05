import { describe, expect, it } from 'vitest';

import {
  ADMIN_HISTORY_PAGE_SIZE,
  buildAdminHistoryParams,
} from './history-query';

describe('buildAdminHistoryParams', () => {
  it('omet le filtre lorsque tous les statuts sont demandés', () => {
    expect(buildAdminHistoryParams(2, 'all')).toEqual({
      page: 2,
      limit: ADMIN_HISTORY_PAGE_SIZE,
      statut: undefined,
    });
  });

  it('envoie la valeur canonique du statut au serveur', () => {
    expect(buildAdminHistoryParams(3, 'rejete')).toEqual({
      page: 3,
      limit: ADMIN_HISTORY_PAGE_SIZE,
      statut: 'rejete',
    });
  });
});
