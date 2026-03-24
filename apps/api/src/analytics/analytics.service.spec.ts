import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPg: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPg = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };
    mockConfig = {
      get: jest.fn((key: string, defaultVal: string) => defaultVal),
    };
    service = new AnalyticsService(mockConfig, mockPg);
  });

  describe('getEvaluationsStats', () => {
    it('should query evaluations by date range', async () => {
      mockPg.query.mockResolvedValue([
        { statut: 'brouillon', count: '5' },
        { statut: 'valide', count: '10' },
      ]);
      const result = await service.getEvaluationsStats({ start_date: '2026-01-01', end_date: '2026-06-01' });
      expect(result).toHaveLength(2);
      expect(mockPg.query).toHaveBeenCalledWith(expect.stringContaining('statut'), ['2026-01-01', '2026-06-01']);
    });
  });

  describe('getPerformances', () => {
    it('should group by type_evaluation', async () => {
      mockPg.query.mockResolvedValue([
        { channel: 'auto', average_score: 3.5, count: '20' },
        { channel: 'pairs', average_score: 4.0, count: '40' },
      ]);
      const result = await service.getPerformances();
      expect(result).toHaveLength(2);
    });
  });

  describe('getRegionAnalytics', () => {
    it('should query by region', async () => {
      mockPg.query.mockResolvedValue([{ total_evaluations: '15', validees: '10', score_moyen: 3.8 }]);
      const result = await service.getRegionAnalytics('R1');
      expect(result).toHaveLength(1);
      expect(mockPg.query).toHaveBeenCalledWith(expect.stringContaining('id_region'), ['R1']);
    });
  });

  describe('getDashboard', () => {
    it('should use fallback when microservice disabled', async () => {
      mockPg.queryOne.mockResolvedValue({ total_evaluations: '100', unique_users: '50', average_score: '3.5' });
      mockPg.query.mockResolvedValue([]);
      const result = await service.getDashboard();
      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('channel_distribution');
      expect(result).toHaveProperty('performance_trend');
    });
  });
});
