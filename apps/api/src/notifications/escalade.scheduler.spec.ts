import { EscaladeScheduler } from './escalade.scheduler';

describe('EscaladeScheduler', () => {
  const escaladeService = {
    traiterEscalade: jest.fn(),
  };
  const config = { get: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('true');
    escaladeService.traiterEscalade.mockResolvedValue({ l1: 0, l2: 0, l3: 0, l4: 0 });
  });

  it('ne traite aucune escalade quand le scheduler est désactivé', async () => {
    config.get.mockReturnValue('false');
    const scheduler = new EscaladeScheduler(escaladeService as any, config as any);

    await scheduler.traiterEscalade();

    expect(escaladeService.traiterEscalade).not.toHaveBeenCalled();
  });

  it('traite les escalades quand le scheduler est activé', async () => {
    const scheduler = new EscaladeScheduler(escaladeService as any, config as any);

    await scheduler.traiterEscalade();

    expect(escaladeService.traiterEscalade).toHaveBeenCalledTimes(1);
  });
});
