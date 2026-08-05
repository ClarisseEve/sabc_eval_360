import { RemplacementsScheduler } from './remplacements.scheduler';

describe('RemplacementsScheduler', () => {
  const remplacements = {
    synchronizeScheduledReplacements: jest.fn(),
  };
  const config = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('true');
    remplacements.synchronizeScheduledReplacements.mockResolvedValue({
      activated: 2,
      closed: 1,
    });
  });

  it('synchronise les remplacements quand le scheduler est activé', async () => {
    const scheduler = new RemplacementsScheduler(
      remplacements as any,
      config as any,
    );

    await expect(scheduler.synchronize()).resolves.toEqual({
      activated: 2,
      closed: 1,
    });
    expect(
      remplacements.synchronizeScheduledReplacements,
    ).toHaveBeenCalledTimes(1);
  });

  it('ne touche pas aux données quand SCHEDULER_ENABLED=false', async () => {
    config.get.mockReturnValue('false');
    const scheduler = new RemplacementsScheduler(
      remplacements as any,
      config as any,
    );

    await expect(scheduler.synchronize()).resolves.toEqual({
      activated: 0,
      closed: 0,
    });
    expect(
      remplacements.synchronizeScheduledReplacements,
    ).not.toHaveBeenCalled();
  });
});
