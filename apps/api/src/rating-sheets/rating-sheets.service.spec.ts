import { RatingSheetsService } from './rating-sheets.service';
import type { RatingSheetSnapshot } from './rating-sheet-calculation';

describe('RatingSheetsService', () => {
  it('keeps a fiche published when email delivery fails', async () => {
    const pg = {
      query: jest.fn().mockResolvedValue([]),
      queryOne: jest
        .fn()
        .mockResolvedValueOnce({
          role_evalue: 'CDS',
          methode_calcul: 'moyenne',
          categories_json: [{ type: 'auto', poids: 100 }],
        })
        .mockResolvedValueOnce({
          id_periode: 'period-1',
          nom_periode: 'Période 1',
          code_periode: 'P1',
          date_debut: '2026-01-01',
          date_fin: '2026-06-30',
          statut: 'cloturee',
          est_ouverte: false,
          est_cloturee: true,
        })
        .mockResolvedValueOnce({ id_fiche: 'sheet-1' }),
      execute: jest.fn().mockResolvedValue(1),
    };
    const prisma = {
      utilisateur: {
        findMany: jest.fn().mockResolvedValue([
          {
            matricule: 'U0001',
            nom: 'Doe',
            prenom: 'Jane',
            email: 'jane@example.com',
            role_nom: 'CDS',
            region_nom: 'Centre',
            id_service: null,
            id_branche: null,
            serviceCommerciale: {
              nom_service: 'Service Centre',
              region: { nom_region: 'Centre' },
            },
            district: { nom_district: 'District Yaoundé' },
          },
        ]),
      },
    };
    const notifications = { create: jest.fn().mockResolvedValue(undefined) };
    const pdf = {
      create: jest.fn((snapshot: RatingSheetSnapshot) =>
        Promise.resolve(Buffer.from(snapshot.personne.matricule)),
      ),
    };
    const email = {
      send: jest.fn().mockRejectedValue(new Error('SMTP non configuré')),
    };
    const service = new RatingSheetsService(
      pg as never,
      prisma as never,
      notifications as never,
      pdf,
      email as never,
    );

    const result = await service.publishForRole(
      'period-1',
      'CDS',
      undefined,
      'A0001',
    );

    expect(pg.execute).toHaveBeenCalledWith(
      expect.stringContaining("$3::varchar = 'envoye'"),
      ['envoye', null, 'echec', 'E-mail : SMTP non configuré', 'sheet-1'],
    );
    expect(result).toMatchObject({
      total: 1,
      fiches_publiees: 1,
      notifications_echouees: 0,
      emails_echoues: 1,
      resultats: [
        {
          matricule: 'U0001',
          fiche_publiee: true,
          notification_statut: 'envoye',
          email_statut: 'echec',
        },
      ],
    });
    const publishedSnapshot = pdf.create.mock.calls[0]?.[0];
    expect(publishedSnapshot?.personne).toMatchObject({
      service: 'Service Centre',
      district: 'District Yaoundé',
      region: 'Centre',
    });
  });

  it('adds current employee location when rendering an older published snapshot', async () => {
    const snapshot: RatingSheetSnapshot = {
      personne: {
        matricule: 'U0001',
        nom: 'Doe',
        prenom: 'Jane',
        role: 'CDS',
        service: 'SRV1',
        branche: null,
      },
      periode: {
        id_periode: 'period-1',
        nom: 'Cycle 2026 - Semestre 2',
        code: 'P2602',
        date_debut: '2026-09-07',
        date_fin: '2026-12-06',
      },
      emise_le: '2026-11-09T00:00:00.000Z',
      methode_calcul: 'moyenne',
      statut: 'partielle',
      categories: [],
      note_generale_sur_20: null,
      competences: [],
      forces: [],
      lacunes: [],
    };
    const pg = {
      queryOne: jest.fn().mockResolvedValue({
        id_fiche: 'sheet-1',
        matricule: 'U0001',
        contenu_json: snapshot,
      }),
    };
    const prisma = {
      utilisateur: {
        findUnique: jest.fn().mockResolvedValue({
          id_service: 'SRV1',
          region_nom: 'Centre',
          serviceCommerciale: {
            nom_service: 'Service Centre',
            region: { nom_region: 'Centre' },
          },
          district: { nom_district: 'District Yaoundé' },
        }),
      },
    };
    const pdf = {
      create: jest.fn((renderedSnapshot: RatingSheetSnapshot) =>
        Promise.resolve(Buffer.from(renderedSnapshot.personne.matricule)),
      ),
    };
    const service = new RatingSheetsService(
      pg as never,
      prisma as never,
      {} as never,
      pdf,
      {} as never,
    );

    await service.getPdf('sheet-1', 'U0001', false);

    const renderedSnapshot = pdf.create.mock.calls[0]?.[0];
    expect(renderedSnapshot?.personne).toMatchObject({
      service: 'Service Centre',
      district: 'District Yaoundé',
      region: 'Centre',
    });
  });

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

    await service.saveConfiguration(
      'period-1',
      'MANAGER',
      configuration,
      'A0001',
    );
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
    expect(pg.queryOne).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ON CONFLICT'),
      expect.any(Array),
    );
    expect(pg.queryOne).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('ON CONFLICT'),
      expect.any(Array),
    );
    expect(pg.query).not.toHaveBeenCalled();
  });
});
