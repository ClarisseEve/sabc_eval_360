import { RatingSheetsService } from './rating-sheets.service';

describe('RatingSheetsService', () => {
  it('allows saving an updated configuration after an earlier save', async () => {
    const pg = {
      query: jest.fn(),
      queryOne: jest
        .fn()
        .mockResolvedValueOnce({
          id_periode: 'period-1',
          nom_periode: 'Période 1',
          code_periode: 'P1',
          date_debut: '2026-01-01',
          date_fin: '2026-12-31',
          statut: 'cloturee',
          est_ouverte: false,
          est_cloturee: true,
        })
        .mockResolvedValueOnce({
          role_evalue: 'MANAGER',
          methode_calcul: 'ponderee',
          categories_json: [
            { type: 'auto', poids: 70 },
            { type: 'pairs', poids: 30 },
          ],
        })
        .mockResolvedValueOnce({
          id_periode: 'period-1',
          nom_periode: 'Période 1',
          code_periode: 'P1',
          date_debut: '2026-01-01',
          date_fin: '2026-12-31',
          statut: 'cloturee',
          est_ouverte: false,
          est_cloturee: true,
        })
        .mockResolvedValueOnce({
          role_evalue: 'MANAGER',
          methode_calcul: 'ponderee',
          categories_json: [
            { type: 'auto', poids: 60 },
            { type: 'pairs', poids: 40 },
          ],
        }),
      execute: jest.fn(),
    };
    const prisma = {
      role: { findFirst: jest.fn().mockResolvedValue({ nom_role: 'MANAGER' }) },
    };
    const service = new RatingSheetsService(
      pg as never,
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const configuration = {
      methode_calcul: 'ponderee' as const,
      categories: [
        { type: 'auto' as const, poids: 70 },
        { type: 'pairs' as const, poids: 30 },
      ],
    };

    await service.saveConfiguration('period-1', 'MANAGER', configuration, 'A0001');
    const updatedConfiguration = await service.saveConfiguration(
      'period-1',
      'MANAGER',
      {
        methode_calcul: 'ponderee',
        categories: [
          { type: 'auto', poids: 60 },
          { type: 'pairs', poids: 40 },
        ],
      },
      'A0001',
    );

    expect(updatedConfiguration.categories).toEqual([
      { type: 'auto', poids: 60 },
      { type: 'pairs', poids: 40 },
    ]);
    expect(pg.queryOne).toHaveBeenCalledTimes(4);
    expect(pg.queryOne.mock.calls[1][0]).toContain('ON CONFLICT');
    expect(pg.queryOne.mock.calls[3][0]).toContain('ON CONFLICT');
    expect(pg.query).not.toHaveBeenCalled();
  });
});
