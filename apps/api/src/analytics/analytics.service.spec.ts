import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPg: any;
  let mockConfig: any;
  let mockCache: any;
  let mockPrisma: any;
  let mockNotifications: any;

  beforeEach(() => {
    mockPg = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };
    mockConfig = {
      get: jest.fn((key: string, defaultVal: string) => defaultVal),
    };
    mockCache = {
      getOrCompute: jest.fn((_key: string, _ttl: number, fn: () => any) => fn()),
    };
    mockNotifications = {
      create: jest.fn().mockResolvedValue({ id_notification: 'notif-1' }),
    };
    mockPrisma = {
      utilisateur: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;
    service = new AnalyticsService(mockConfig, mockPg, mockCache, mockPrisma, mockNotifications);
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

  describe('getTendancesMultiPeriodes', () => {
    const makeRow = (id: string, code: string, score: string | null, completion: string, nb: string, nbValides: string) => ({
      id_periode: id,
      code_periode: code,
      nom_periode: `Période ${code}`,
      date_debut: '2025-01-01',
      date_fin: '2025-03-31',
      score_moyen: score,
      taux_completion: completion,
      nb_evaluations: nb,
      nb_valides: nbValides,
    });

    it('should return tendances in chronological order (ASC by date_debut)', async () => {
      const rows = [
        makeRow('p1', 'P2024-S1', '3.5', '80', '10', '8'),
        makeRow('p2', 'P2024-S2', '4.0', '90', '20', '18'),
      ];
      // First call returns rows (closed periods found), second call not needed
      mockPg.query.mockResolvedValueOnce(rows);
      const result = await service.getTendancesMultiPeriodes({});
      expect(result.tendances[0].code_periode).toBe('P2024-S1');
      expect(result.tendances[1].code_periode).toBe('P2024-S2');
    });

    it('should calculate delta_score correctly between consecutive periods', async () => {
      const rows = [
        makeRow('p1', 'P1', '3.00', '70', '10', '7'),
        makeRow('p2', 'P2', '3.50', '80', '10', '8'),
        makeRow('p3', 'P3', '3.20', '75', '10', '7'),
      ];
      mockPg.query.mockResolvedValueOnce(rows);
      const result = await service.getTendancesMultiPeriodes({});
      const t = result.tendances;
      expect(t[0].delta_score).toBeNull();
      expect(t[1].delta_score).toBe(0.5);
      expect(t[2].delta_score).toBe(-0.3);
    });

    it('should pass id_region filter parameter to SQL query', async () => {
      mockPg.query.mockResolvedValueOnce([makeRow('p1', 'P1', '3.5', '80', '10', '8')]);
      await service.getTendancesMultiPeriodes({ id_region: 'R-NORD' });
      const sqlCall = mockPg.query.mock.calls[0][0] as string;
      expect(sqlCall).toContain('id_region');
      const paramsCall = mockPg.query.mock.calls[0][1] as any[];
      expect(paramsCall).toContain('R-NORD');
    });

    it('should pass role filter parameter to SQL query', async () => {
      mockPg.query.mockResolvedValueOnce([makeRow('p1', 'P1', '3.5', '80', '10', '8')]);
      await service.getTendancesMultiPeriodes({ role: 'SUPERVISEUR' });
      const sqlCall = mockPg.query.mock.calls[0][0] as string;
      expect(sqlCall).toContain('role');
      const paramsCall = mockPg.query.mock.calls[0][1] as any[];
      expect(paramsCall).toContain('SUPERVISEUR');
    });

    it('should fallback to all periods when no closed periods are found', async () => {
      // First call (closed periods only) returns empty
      mockPg.query.mockResolvedValueOnce([]);
      // Second call (all periods) returns data
      mockPg.query.mockResolvedValueOnce([makeRow('p1', 'P1', '3.5', '80', '10', '8')]);
      const result = await service.getTendancesMultiPeriodes({});
      expect(result.tendances).toHaveLength(1);
      expect(mockPg.query).toHaveBeenCalledTimes(2);
    });

    it('should use cache with key based on filters', async () => {
      mockPg.query.mockResolvedValue([]);
      await service.getTendancesMultiPeriodes({ id_region: 'R1', role: 'ADMIN', limit: 3 });
      expect(mockCache.getOrCompute).toHaveBeenCalledWith(
        'analytics:tendances:R1:ADMIN:3',
        300,
        expect.any(Function),
      );
    });

    it('should set delta_score to null when previous period score is null', async () => {
      const rows = [
        makeRow('p1', 'P1', null, '70', '10', '7'),
        makeRow('p2', 'P2', '3.50', '80', '10', '8'),
      ];
      mockPg.query.mockResolvedValueOnce(rows);
      const result = await service.getTendancesMultiPeriodes({});
      // Previous period has null score_moyen, so delta_score should be null
      expect(result.tendances[1].delta_score).toBeNull();
    });

    it('should include generated_at in the response', async () => {
      mockPg.query.mockResolvedValueOnce([]);
      mockPg.query.mockResolvedValueOnce([]);
      const result = await service.getTendancesMultiPeriodes({});
      expect(result).toHaveProperty('generated_at');
      expect(typeof result.generated_at).toBe('string');
    });
  });

  describe('runAnomalyDetectionBatch', () => {
    it('insère les anomalies détectées dans logs_anomalies', async () => {
      // _detecterAnomalies calls pg.query 4 times (one per anomaly category), each returning 1 row
      const anomalyRow = {
        matricule: 'M001',
        score_auto: '3.0',
        score_autres: '4.8',
        divergence: '1.8',
      };
      // 4 pg.query calls from _detecterAnomalies + 1 INSERT per anomaly
      mockPg.query
        .mockResolvedValueOnce([anomalyRow])  // divergences
        .mockResolvedValueOnce([])             // baisses
        .mockResolvedValueOnce([])             // uniformites
        .mockResolvedValueOnce([])             // biais
        .mockResolvedValueOnce(undefined);     // INSERT

      const result = await service.runAnomalyDetectionBatch();
      expect(result.inserted).toBe(1);
      expect(result.total).toBe(1);
      // Verify INSERT was called
      const insertCall = mockPg.query.mock.calls.find((call: any[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO logs_anomalies'),
      );
      expect(insertCall).toBeDefined();
    });

    it('appelle notifierAdminsCritical si anomalies critiques détectées', async () => {
      const criticalRow = {
        matricule: 'M002',
        score_auto: '2.0',
        score_autres: '5.0',
        divergence: '3.0',
      };
      mockPg.query
        .mockResolvedValueOnce([criticalRow])  // divergences (>2.5 = critical)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(undefined);    // INSERT

      mockPrisma.utilisateur.findMany.mockResolvedValueOnce([{ matricule: 'ADMIN001' }]);

      const result = await service.runAnomalyDetectionBatch();
      expect(result.critical).toBe(1);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          destinataire_matricule: 'ADMIN001',
          type: 'warning',
        }),
      );
    });

    it('retourne { total, critical, inserted }', async () => {
      mockPg.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.runAnomalyDetectionBatch();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('critical');
      expect(result).toHaveProperty('inserted');
      expect(result.total).toBe(0);
      expect(result.inserted).toBe(0);
    });

    it('ne notifie pas les admins si aucune anomalie critique', async () => {
      // warning row (divergence <= 2.5)
      const warningRow = {
        matricule: 'M003',
        score_auto: '3.0',
        score_autres: '4.5',
        divergence: '1.6',
      };
      mockPg.query
        .mockResolvedValueOnce([warningRow])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(undefined);

      await service.runAnomalyDetectionBatch();
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });
  });

  describe('acknowledgeAnomalie', () => {
    it('exécute UPDATE SET resolue=true pour un id donné', async () => {
      mockPg.query.mockResolvedValueOnce(undefined);
      await service.acknowledgeAnomalie('uuid-1234');
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE logs_anomalies'),
        ['uuid-1234'],
      );
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('resolue = true'),
        expect.any(Array),
      );
    });

    it('retourne { success: true, resolue: true, id, date_resolution }', async () => {
      mockPg.query.mockResolvedValueOnce(undefined);
      const result = await service.acknowledgeAnomalie('uuid-5678');
      expect(result.success).toBe(true);
      expect(result.resolue).toBe(true);
      expect(result.id).toBe('uuid-5678');
      expect(typeof result.date_resolution).toBe('string');
    });
  });

  describe('getAnomaliesHistory', () => {
    it('retourne les anomalies sans filtre', async () => {
      const rows = [
        { id: 'a1', type: 'biais_evaluateur', severite: 'warning', resolue: false },
        { id: 'a2', type: 'baisse_performance', severite: 'critical', resolue: false },
      ];
      mockPg.query.mockResolvedValueOnce(rows);
      const result = await service.getAnomaliesHistory({});
      expect(result.anomalies).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM logs_anomalies'),
        [],
      );
    });

    it('filtre par severite', async () => {
      mockPg.query.mockResolvedValueOnce([{ id: 'a1', severite: 'critical' }]);
      const result = await service.getAnomaliesHistory({ severite: 'critical' });
      expect(result.total).toBe(1);
      const queryCall = mockPg.query.mock.calls[0];
      expect(queryCall[0]).toContain('severite = $1');
      expect(queryCall[1]).toContain('critical');
    });

    it('filtre par resolue=false', async () => {
      mockPg.query.mockResolvedValueOnce([]);
      await service.getAnomaliesHistory({ resolue: 'false' });
      const queryCall = mockPg.query.mock.calls[0];
      expect(queryCall[0]).toContain('resolue = $');
      expect(queryCall[1]).toContain(false);
    });

    it('respecte la limite maximale de 500', async () => {
      mockPg.query.mockResolvedValueOnce([]);
      await service.getAnomaliesHistory({ limit: 1000 });
      const sql = mockPg.query.mock.calls[0][0] as string;
      expect(sql).toContain('LIMIT 500');
    });
  });

  describe('validateRecommandation', () => {
    it('exécute UPDATE SET statut=validee', async () => {
      mockPg.query.mockResolvedValueOnce(undefined);
      const result = await service.validateRecommandation('reco-1', 'ADMIN001');
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining("statut='validee'"),
        ['ADMIN001', 'reco-1'],
      );
      expect(result.statut).toBe('validee');
      expect(result.success).toBe(true);
    });
  });

  describe('rejectRecommandation', () => {
    it('exécute UPDATE SET statut=rejetee avec motif', async () => {
      mockPg.query.mockResolvedValueOnce(undefined);
      const result = await service.rejectRecommandation('reco-2', 'ADMIN001', 'Pas prioritaire');
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining("statut='rejetee'"),
        ['ADMIN001', 'Pas prioritaire', 'reco-2'],
      );
      expect(result.statut).toBe('rejetee');
      expect(result.success).toBe(true);
    });
  });
});
