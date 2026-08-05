import { EvaluationsController } from './evaluations.controller';

describe('EvaluationsController historique', () => {
  const service = {
    getHistorique: jest.fn().mockResolvedValue({ data: [], meta: {} }),
  };
  let controller: EvaluationsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new EvaluationsController(service as any);
  });

  it('transmet pagination et filtres au service', async () => {
    const req = { user: { matricule: 'MAT01' } };
    const periodeId = '11111111-1111-4111-8111-111111111111';

    await controller.historique(
      req,
      '2',
      '30',
      'valide',
      'pairs',
      periodeId,
    );

    expect(service.getHistorique).toHaveBeenCalledWith('MAT01', {
      page: 2,
      limit: 30,
      statut: 'valide',
      type_evaluation: 'pairs',
      id_periode: periodeId,
    });
  });

  it('ne transforme pas silencieusement une pagination mal formée', async () => {
    await controller.historique(
      { user: { matricule: 'MAT01' } },
      '2abc',
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(service.getHistorique).toHaveBeenCalledWith(
      'MAT01',
      expect.objectContaining({ page: Number.NaN }),
    );
  });
});
