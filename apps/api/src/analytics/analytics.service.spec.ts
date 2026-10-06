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
      replacement_temporaire: {
        count: jest.fn().mockResolvedValue(0),
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
      expect(String(mockPg.query.mock.calls[0][0])).toContain("'{visibility_policy,admin}'");
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
      expect(String(mockPg.query.mock.calls[0][0])).toContain("'{visibility_policy,admin}'");
    });
  });

  describe('getEvaluationGaps', () => {
    it('compares the latest validated score per evaluation type and retains attempt counts', async () => {
      mockPg.query
        .mockResolvedValueOnce([
          { matricule: 'U001', type_evaluation: 'auto', score: '4.50', nb_evaluations: 2, nb_evaluateurs: 1 },
          { matricule: 'U001', type_evaluation: 'descendante', score: '3.00', nb_evaluations: 3, nb_evaluateurs: 1 },
        ])
        .mockResolvedValueOnce([
          { matricule: 'U001', type_evaluation: 'auto', critere_id: 'leadership', score: '4.50', niveau_requis: '3', nb_notes: 1 },
          { matricule: 'U001', type_evaluation: 'descendante', critere_id: 'leadership', score: '3.00', niveau_requis: '3', nb_notes: 1 },
        ]);

      const result = await service.getEvaluationGaps('U001');

      expect(result.profils[0].types.auto).toEqual(expect.objectContaining({ score: 4.5, nb_evaluations: 2 }));
      expect(result.profils[0].types.descendante).toEqual(expect.objectContaining({ score: 3, nb_evaluations: 3 }));
      for (const [sql] of mockPg.query.mock.calls) {
        expect(sql).toContain('ROW_NUMBER() OVER');
        expect(sql).toContain('PARTITION BY e.evalue_matricule, e.type_evaluation');
        expect(sql).toContain('recency_rank = 1');
        expect(sql).toContain('COALESCE(e.date_soumission, e.updated_at, e.created_at) DESC');
      }
    });
  });

  describe('exportEvaluations', () => {
    it('produit un CSV tabulaire avec les colonnes métier et les niveaux de compétence', async () => {
      mockPg.query.mockResolvedValue([
        {
          date_evaluation: '2026-09-14',
          statut: 'valide',
          evalue_nom: 'Dupont, Jean',
          evalue_matricule: 'U001',
          poste: 'TMO',
          branche: 'B01',
          region: 'Littoral',
          evaluateur_nom: 'Admin, SABC',
          type_evaluation: 'auto',
          competence: 'Communication; relation client',
          score: '4',
        },
        { date_evaluation: '2026-09-13', statut: 'soumis', evalue_nom: 'A', evalue_matricule: 'U002', poste: 'CDS', branche: 'B01', region: 'Centre', evaluateur_nom: 'B', type_evaluation: 'pairs', competence: 'Leadership', score: '3' },
        { date_evaluation: '2026-09-12', statut: 'rejete', evalue_nom: 'C', evalue_matricule: 'U003', poste: 'DR', branche: 'B02', region: 'Nord', evaluateur_nom: 'D', type_evaluation: 'descendante', competence: 'Pilotage', score: '2' },
      ]);

      const result = await service.exportEvaluations('csv', { start_date: '2026-01-01', end_date: '2026-12-31' });
      const csv = result.buffer.toString('utf8').replace(/^\uFEFF/, '');

      expect(result.filename).toMatch(/\.csv$/);
      expect(csv.split('\r\n')[0]).toBe(
        "Date d'évaluation;Statut de l'évaluation;Noms et prénoms de l'évalué;Matricule de l'évalué;Poste de l'évalué;Branche;Région de l'évalué;Nom de l'évaluateur;Type d'évaluation;Compétence;Note ou score de la compétence;Description",
      );
      expect(csv).toContain('Validée');
      expect(csv).toContain('Soumise');
      expect(csv).toContain('Rejetée');
      expect(csv).toContain('Auto-évaluation');
      expect(csv).toContain('Acquis');
      expect(csv).toContain("En cours d'acquisition");
      expect(csv).toContain('Non acquis');
      expect(csv).toContain('"Communication; relation client"');
      expect(mockPg.query).toHaveBeenCalledWith(expect.stringContaining('jsonb_array_elements'), ['2026-01-01', '2026-12-31']);
    });

    it('conserve un lot dense dans le fichier Excel', async () => {
      mockPg.query.mockResolvedValue(Array.from({ length: 1000 }, (_, index) => ({
        date_evaluation: '2026-09-14', evalue_nom: `Agent ${index}`, evalue_matricule: `U${index}`, poste: 'TMO',
        statut: 'brouillon',
        branche: 'B01', region: 'Littoral', evaluateur_nom: 'Admin', type_evaluation: 'manager', competence: 'Compétence', score: '4',
      })));

      const result = await service.exportEvaluations('xlsx');

      expect(result.filename).toMatch(/\.xlsx$/);
      expect(result.contentType).toContain('spreadsheetml');
      expect(result.buffer.subarray(0, 2).toString()).toBe('PK');
      expect(mockPg.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRegionAnalytics', () => {
    it('should query by region', async () => {
      mockPg.query.mockResolvedValue([{ total_evaluations: '15', validees: '10', score_moyen: 3.8 }]);
      const result = await service.getRegionAnalytics('R1');
      expect(result).toHaveLength(1);
      expect(mockPg.query).toHaveBeenCalledWith(expect.stringContaining('id_region'), ['R1']);
      expect(String(mockPg.query.mock.calls[0][0])).toContain("'{visibility_policy,evaluated}'");
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
      expect(String(mockPg.queryOne.mock.calls[0][0])).toContain("'{visibility_policy,admin}'");
      expect(mockPg.query.mock.calls.every((call: any[]) =>
        String(call[0]).includes("'{visibility_policy,admin}'"),
      )).toBe(true);
    });
  });

  describe('visibilité des analyses personnalisées', () => {
    it("ne lit les axes détaillés que si l'évalué et le détail y sont autorisés", async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getAxesAmelioration('M001');

      const sql = String(mockPg.query.mock.calls[0][0]);
      expect(sql).toContain("'{visibility_policy,evaluated}'");
      expect(sql).toContain("'{visibility_policy,detail}'");
      expect(sql).toContain("= 'detailed'");
    });

    it('utilise policy.admin, avec détail obligatoire, pour les axes administrateur', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getAxesAmelioration('M001', 'admin');

      const sql = String(mockPg.query.mock.calls[0][0]);
      expect(sql).toContain("'{visibility_policy,admin}'");
      expect(sql).toContain("'{visibility_policy,detail}'");
      expect(sql).not.toContain("'{visibility_policy,evaluated}'");
    });

    it('filtre toutes les composantes du score avec policy.evaluated', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      mockPg.query.mockResolvedValue([]);

      await service.getScoresUtilisateur('M001');

      const scoreSql = [
        ...mockPg.queryOne.mock.calls.map((call: any[]) => String(call[0])),
        ...mockPg.query.mock.calls.map((call: any[]) => String(call[0])),
      ];
      expect(scoreSql).toHaveLength(3);
      expect(scoreSql.every((sql) => sql.includes("'{visibility_policy,evaluated}'"))).toBe(true);
    });

    it('propage la bonne audience aux recommandations et au matching mentor', async () => {
      jest.spyOn(service, 'getAxesAmelioration').mockResolvedValue({ axes_amelioration: [] } as any);
      jest.spyOn(service, 'getScoresUtilisateur').mockResolvedValue({
        score_global: 2.5,
        progression: 0,
      } as any);
      mockPrisma.utilisateur.findUnique.mockResolvedValue({
        matricule: 'M001',
        id_region: 'R1',
        niveau_hierarchique: 2,
      });
      mockPg.query.mockResolvedValue([]);

      await service.getRecommandations('M001');

      expect(service.getAxesAmelioration).toHaveBeenCalledWith('M001', 'evaluated');
      expect(service.getScoresUtilisateur).toHaveBeenCalledWith('M001', 'evaluated');
      expect(String(mockPg.query.mock.calls[0][0])).toContain(
        "'{visibility_policy,evaluated}'",
      );
    });

    const improvementUser = {
      matricule: 'M001',
      nom: 'Nom',
      prenom: 'Prénom',
      role: 'CSC',
      role_nom: 'CSC',
      region_nom: 'Région',
      id_region: 'R1',
      niveau_hierarchique: 3,
    };

    it('utilise policy.admin pour les plans d’amélioration administrateur', async () => {
      mockPrisma.utilisateur.findMany.mockResolvedValue([improvementUser]);
      // Liste des utilisateurs ayant au moins une évaluation validée.
      mockPg.query.mockResolvedValue([{ matricule: 'M001' }]);
      jest.spyOn(service, 'getAxesAmelioration').mockResolvedValue({ axes_amelioration: [] } as any);
      jest.spyOn(service, 'getRecommandations').mockResolvedValue({ recommandations: [] } as any);

      await service.getImprovementPlans();

      expect(service.getAxesAmelioration).toHaveBeenCalledWith('M001', 'admin');
      // L'utilisateur déjà chargé est transmis pour éviter une requête MySQL
      // supplémentaire par utilisateur analysé.
      expect(service.getRecommandations).toHaveBeenCalledWith(
        'M001',
        'admin',
        expect.objectContaining({ matricule: 'M001', id_region: 'R1' }),
      );
    });

    it('n’analyse pas les utilisateurs sans évaluation validée', async () => {
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        improvementUser,
        { ...improvementUser, matricule: 'M002' },
      ]);
      // Seul M001 a une évaluation validée.
      mockPg.query.mockResolvedValue([{ matricule: 'M001' }]);
      jest.spyOn(service, 'getAxesAmelioration').mockResolvedValue({ axes_amelioration: [] } as any);
      jest.spyOn(service, 'getRecommandations').mockResolvedValue({ recommandations: [] } as any);

      const result = await service.getImprovementPlans();

      expect(service.getAxesAmelioration).toHaveBeenCalledTimes(1);
      expect(service.getAxesAmelioration).toHaveBeenCalledWith('M001', 'admin');
      expect(result.totals.users_filtered).toBe(2);
      expect(result.totals.users_evaluable).toBe(1);
      expect(result.totals.users_analyzed).toBe(1);
      expect(result.totals.users_truncated).toBe(0);
    });

    it('filtre le classement selon son audience', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getClassementRegional('R1');
      await service.getClassementRegional('R1', 'admin');

      expect(String(mockPg.query.mock.calls[0][0])).toContain(
        "'{visibility_policy,evaluated}'",
      );
      expect(String(mockPg.query.mock.calls[1][0])).toContain(
        "'{visibility_policy,admin}'",
      );
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
      expect(String(mockPg.query.mock.calls[0][0])).toContain(
        "'{visibility_policy,admin}'",
      );
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

  describe('detecterAnomalies', () => {
    it('exclut les pairs des anomalies nominatives évaluateur', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.detecterAnomalies();

      const uniformitySql = String(mockPg.query.mock.calls[2][0]);
      const evaluatorBiasSql = String(mockPg.query.mock.calls[3][0]);
      expect(uniformitySql).toContain("type_evaluation NOT IN ('auto', 'pairs')");
      expect(evaluatorBiasSql).toContain("type_evaluation NOT IN ('auto', 'pairs')");
      expect((evaluatorBiasSql.match(/NOT IN \('auto', 'pairs'\)/g) ?? [])).toHaveLength(2);
      expect(uniformitySql).toContain("'{visibility_policy,admin}'");
      expect((evaluatorBiasSql.match(/\{visibility_policy,admin\}/g) ?? [])).toHaveLength(2);
    });
  });

  describe('runRecommandationsBatch', () => {
    it('ne sélectionne que les évaluations visibles à l’administrateur', async () => {
      mockPg.query.mockResolvedValue([]);

      const result = await service.runRecommandationsBatch();

      expect(result.inserted).toBe(0);
      expect(String(mockPg.query.mock.calls[0][0])).toContain(
        "'{visibility_policy,admin}'",
      );
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
        [100],
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
      const [sql, params] = mockPg.query.mock.calls[0];
      expect(sql).toContain('LIMIT $1');
      expect(params).toEqual([500]);
    });

    it('ignore une limite non numérique au lieu de produire LIMIT NaN', async () => {
      mockPg.query.mockResolvedValueOnce([]);
      await service.getAnomaliesHistory({ limit: 'abc' as any });
      const [, params] = mockPg.query.mock.calls[0];
      expect(params).toEqual([100]);
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

  describe('paramétrage SQL des filtres de dates admin', () => {
    const startDate = "2026-01-01' OR 1=1 --";
    const endDate = '2026-06-30';

    it('paramètre la requête de synthèse des statuts', async () => {
      jest.spyOn(service, 'getDashboard').mockResolvedValue({ kpis: {} } as any);
      jest.spyOn(service, 'getAdminRegionsOverview').mockResolvedValue({ regions: [] } as any);
      jest.spyOn(service, 'getAdminRoleAnalytics').mockResolvedValue({ roles: [] } as any);
      mockPg.queryOne.mockImplementation((sql: string) => {
        return Promise.resolve({
          total_evaluations: '0',
          validated_evaluations: '0',
          submitted_evaluations: '0',
          draft_evaluations: '0',
        });
      });

      await (service as any)._getAdminOverview({ start_date: startDate, end_date: endDate });

      const [sql, params] = mockPg.queryOne.mock.calls.find((call: any[]) =>
        String(call[0]).includes('validated_evaluations'),
      );
      expect(sql).toContain('BETWEEN $1 AND $2');
      expect(sql).not.toContain(startDate);
      expect(params).toEqual([startDate, endDate]);
      expect(sql).toContain("'{visibility_policy,admin}'");
      expect(mockPrisma.replacement_temporaire.count).toHaveBeenCalledWith({
        where: {
          est_actif: true,
          date_debut: { lte: expect.any(Date) },
          OR: [
            { date_fin: null },
            { date_fin: { gte: expect.any(Date) } },
          ],
        },
      });
      expect(mockPg.queryOne).not.toHaveBeenCalledWith(
        expect.stringContaining('remplacements_temporaires'),
      );
    });

    it('paramètre la jointure des agrégats régionaux', async () => {
      mockPg.query.mockResolvedValue([]);

      await (service as any).getAdminRegionAggregates({
        start_date: startDate,
        end_date: endDate,
      });

      const [sql, params] = mockPg.query.mock.calls[0];
      expect(sql).toContain('BETWEEN $1 AND $2');
      expect(sql).not.toContain(startDate);
      expect(params).toEqual([startDate, endDate]);
      expect(sql).toContain("'{visibility_policy,admin}'");
    });

    it('paramètre la jointure des agrégats par rôle', async () => {
      mockPg.query.mockResolvedValue([]);

      await (service as any).getAdminRolePerformance({
        start_date: startDate,
        end_date: endDate,
      });

      const [sql, params] = mockPg.query.mock.calls[0];
      expect(sql).toContain('BETWEEN $1 AND $2');
      expect(sql).not.toContain(startDate);
      expect(params).toEqual([startDate, endDate]);
      expect(sql).toContain("'{visibility_policy,admin}'");
    });
  });

  describe('getEvolutionCriteres', () => {
    // Courbes d'évolution temporelle du cahier des charges: suivre la
    // progression d'un agent période après période, critère par critère.
    it('assemble les périodes en ordre chronologique avec une série par critère', async () => {
      mockPg.query.mockResolvedValue([
        { code_periode: 'P2025-S1', nom_periode: 'Semestre 1', date_debut: '2025-01-01', critere_id: 'leadership', moyenne: '3.00' },
        { code_periode: 'P2025-S1', nom_periode: 'Semestre 1', date_debut: '2025-01-01', critere_id: 'execution', moyenne: '4.00' },
        { code_periode: 'P2025-S2', nom_periode: 'Semestre 2', date_debut: '2025-07-01', critere_id: 'leadership', moyenne: '4.00' },
      ]);

      const result = await service.getEvolutionCriteres('M001');

      expect(result.criteres).toEqual(['execution', 'leadership']);
      expect(result.periodes).toEqual([
        {
          code_periode: 'P2025-S1',
          nom_periode: 'Semestre 1',
          date_debut: '2025-01-01',
          notes: { execution: 4, leadership: 3 },
        },
        {
          code_periode: 'P2025-S2',
          nom_periode: 'Semestre 2',
          date_debut: '2025-07-01',
          notes: { execution: null, leadership: 4 },
        },
      ]);
    });

    it('agrège en une seule requête et borne le nombre de périodes', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getEvolutionCriteres('M001');

      expect(mockPg.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockPg.query.mock.calls[0];
      expect(sql).toContain('jsonb_array_elements');
      expect(sql).toContain('GROUP BY');
      expect(sql).toContain('LIMIT');
      expect(params).toContain('M001');
    });

    it('respecte la visibilité de l’audience demandée', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getEvolutionCriteres('M001', 'admin');

      expect(String(mockPg.query.mock.calls[0][0])).toContain("'{visibility_policy,admin}'");
    });

    it('retourne une évolution vide sans évaluation validée', async () => {
      mockPg.query.mockResolvedValue([]);

      const result = await service.getEvolutionCriteres('M001');

      expect(result.periodes).toEqual([]);
      expect(result.criteres).toEqual([]);
    });
  });

  describe('getTeamHeatmap', () => {
    // Matrice collaborateurs × critères attendue par le cahier des charges,
    // pour repérer d'un coup d'œil les forces collectives et les relais de
    // compétence au sein d'une équipe.
    it('construit la matrice membre × critère à partir des moyennes', async () => {
      mockPg.query.mockResolvedValue([
        { matricule: 'M002', critere_id: 'execution', moyenne: '4.00' },
        { matricule: 'M002', critere_id: 'leadership', moyenne: '2.50' },
        { matricule: 'M003', critere_id: 'execution', moyenne: '3.00' },
      ]);

      const result = await service.getTeamHeatmap(['M002', 'M003']);

      expect(result.criteres).toEqual(['execution', 'leadership']);
      expect(result.membres).toEqual([
        { matricule: 'M002', notes: { execution: 4, leadership: 2.5 } },
        { matricule: 'M003', notes: { execution: 3, leadership: null } },
      ]);
    });

    it('agrège en une seule requête quel que soit le nombre de membres', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getTeamHeatmap(['M002', 'M003', 'M004']);

      expect(mockPg.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockPg.query.mock.calls[0];
      expect(sql).toContain('jsonb_array_elements');
      expect(sql).toContain('GROUP BY');
      expect(params[0]).toEqual(['M002', 'M003', 'M004']);
    });

    it('ne requête pas la base pour une équipe vide', async () => {
      const result = await service.getTeamHeatmap([]);

      expect(mockPg.query).not.toHaveBeenCalled();
      expect(result.membres).toEqual([]);
      expect(result.criteres).toEqual([]);
    });

    it('dédoublonne les matricules pour ne pas gonfler la requête', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getTeamHeatmap(['M002', 'M002', 'M003']);

      expect(mockPg.query.mock.calls[0][1][0]).toEqual(['M002', 'M003']);
    });
  });

  describe('getBenchmarks', () => {
    // Le cahier des charges attend une comparaison par critère entre le sujet,
    // la moyenne de sa région et les meilleurs profils. Les critères varient
    // selon le métier (commercial, marketing, sponsoring, trade): ils sont donc
    // lus depuis les notes réellement saisies, pas depuis une liste figée.
    it('retourne, par critère, le sujet, sa région et les top performers', async () => {
      mockPg.query.mockResolvedValue([
        { critere_id: 'leadership', sujet: '3.50', region: '3.00', top_performers: '4.20' },
        { critere_id: 'execution', sujet: '2.80', region: '3.40', top_performers: '4.50' },
      ]);

      const result = await service.getBenchmarks('M001');

      expect(result.criteres).toEqual([
        { critere_id: 'leadership', sujet: 3.5, region: 3, top_performers: 4.2 },
        { critere_id: 'execution', sujet: 2.8, region: 3.4, top_performers: 4.5 },
      ]);
    });

    it('agrège en une seule requête, sans boucle par critère ni par utilisateur', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getBenchmarks('M001');

      expect(mockPg.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockPg.query.mock.calls[0];
      // L'explosion du JSONB et le regroupement se font côté PostgreSQL.
      expect(sql).toContain('jsonb_array_elements');
      expect(sql).toContain('GROUP BY');
      expect(params).toContain('M001');
    });

    it('respecte la visibilité de l’audience demandée', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getBenchmarks('M001', 'admin');

      expect(String(mockPg.query.mock.calls[0][0])).toContain("'{visibility_policy,admin}'");
    });

    it('renvoie une liste vide quand aucune évaluation validée n’existe', async () => {
      mockPg.query.mockResolvedValue([]);

      const result = await service.getBenchmarks('M001');

      expect(result.criteres).toEqual([]);
    });

    it('convertit une moyenne absente en null plutôt qu’en zéro', async () => {
      mockPg.query.mockResolvedValue([
        { critere_id: 'leadership', sujet: '3.50', region: null, top_performers: null },
      ]);

      const result = await service.getBenchmarks('M001');

      expect(result.criteres[0]).toEqual({
        critere_id: 'leadership',
        sujet: 3.5,
        region: null,
        top_performers: null,
      });
    });
  });
});
