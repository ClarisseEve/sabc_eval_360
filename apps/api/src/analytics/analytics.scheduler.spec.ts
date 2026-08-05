import { AnalyticsScheduler } from './analytics.scheduler';

describe('AnalyticsScheduler', () => {
  const analyticsService = {
    runAnomalyDetectionBatch: jest.fn(),
    runRecommandationsBatch: jest.fn(),
  };
  const config = { get: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('true');
    analyticsService.runAnomalyDetectionBatch.mockResolvedValue({
      total: 1,
      critical: 0,
      inserted: 1,
    });
    analyticsService.runRecommandationsBatch.mockResolvedValue({ inserted: 1 });
  });

  it('court-circuite les deux traitements quand le scheduler est désactivé', async () => {
    config.get.mockReturnValue('false');
    const scheduler = new AnalyticsScheduler(analyticsService as any, config as any);

    await scheduler.runAnomalyDetection();
    await scheduler.runRecommandationsGeneration();

    expect(analyticsService.runAnomalyDetectionBatch).not.toHaveBeenCalled();
    expect(analyticsService.runRecommandationsBatch).not.toHaveBeenCalled();
  });

  it('exécute les traitements quand le scheduler est activé', async () => {
    const scheduler = new AnalyticsScheduler(analyticsService as any, config as any);

    await scheduler.runAnomalyDetection();
    await scheduler.runRecommandationsGeneration();

    expect(analyticsService.runAnomalyDetectionBatch).toHaveBeenCalledTimes(1);
    expect(analyticsService.runRecommandationsBatch).toHaveBeenCalledTimes(1);
  });
});
