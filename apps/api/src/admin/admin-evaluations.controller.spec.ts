import { AdminEvaluationsController } from './admin-evaluations.controller';

describe('AdminEvaluationsController history', () => {
  const service = {
    getHistoriqueGlobal: jest.fn().mockResolvedValue({ data: [], meta: {} }),
  };
  let controller: AdminEvaluationsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminEvaluationsController(service as any);
  });

  it('transmet pagination et filtres au service', async () => {
    const periodeId = '11111111-1111-4111-8111-111111111111';

    await controller.history('3', '25', 'rejete', 'auto', periodeId);

    expect(service.getHistoriqueGlobal).toHaveBeenCalledWith({
      page: 3,
      limit: 25,
      statut: 'rejete',
      type_evaluation: 'auto',
      id_periode: periodeId,
    });
  });
});
