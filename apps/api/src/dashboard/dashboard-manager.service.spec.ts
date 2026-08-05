import { DashboardManagerService } from './dashboard-manager.service';

describe('DashboardManagerService', () => {
  const mockPg = { query: jest.fn(), queryOne: jest.fn() };
  const mockPrisma = { utilisateur: { findMany: jest.fn() } };
  const mockCache = {
    getOrCompute: jest.fn().mockImplementation((_key: string, _ttl: number, fn: () => unknown) => fn()),
  };
  const mockHierarchy = { getSubordonnesDirects: jest.fn() };

  let service: DashboardManagerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardManagerService(
      mockPg as any,
      mockPrisma as any,
      mockCache as any,
      mockHierarchy as any,
    );
  });

  // Test 1: manager sans subordonnés retourne zéros
  describe('getProgressionEquipe', () => {
    it('should return zeros when manager has no subordinates', async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([]);

      const result = await service.getProgressionEquipe('MGR001');

      expect(result.kpi.total).toBe(0);
      expect(result.kpi.completes).toBe(0);
      expect(result.kpi.en_attente).toBe(0);
      expect(result.kpi.restantes).toBe(0);
      expect(result.kpi.taux_completion).toBe(0);
      expect(result.subordonnes).toEqual([]);
      expect(result.historique).toEqual([]);
    });

    // Test 2: calcule KPI correctement (total/completes/taux)
    it('should compute KPI correctly from eval rows', async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([
        { matricule: 'EMP001' },
        { matricule: 'EMP002' },
      ]);

      // First pg.query call: eval stats grouped by evalue + statut
      mockPg.query
        .mockResolvedValueOnce([
          { evalue_matricule: 'EMP001', statut: 'valide', count: '3' },
          { evalue_matricule: 'EMP001', statut: 'brouillon', count: '1' },
          { evalue_matricule: 'EMP002', statut: 'soumis', count: '2' },
        ])
        // Second pg.query call: eval données (as evaluateur)
        .mockResolvedValueOnce([
          { evaluateur_matricule: 'EMP001', count: '2' },
        ])
        // Third pg.query call: historique
        .mockResolvedValueOnce([]);

      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'EMP001', nom: 'Dupont', prenom: 'Jean', role_nom: 'CSC' },
        { matricule: 'EMP002', nom: 'Martin', prenom: 'Paul', role_nom: 'CDS' },
      ]);

      const result = await service.getProgressionEquipe('MGR001');

      // total = 3 + 1 + 2 = 6
      expect(result.kpi.total).toBe(6);
      // completes = 3 (valide)
      expect(result.kpi.completes).toBe(3);
      // en_attente = 1 (brouillon) + 2 (soumis) = 3
      expect(result.kpi.en_attente).toBe(3);
      // restantes = 6 - 3 = 3
      expect(result.kpi.restantes).toBe(3);
      // taux_completion = 3/6*100 = 50
      expect(result.kpi.taux_completion).toBe(50);
      expect(String(mockPg.query.mock.calls[1][0])).toContain(
        "type_evaluation <> 'pairs'",
      );
    });

    // Test 3: couleur statut subordonné correcte (green/orange/red/grey)
    it('should assign correct statut_couleur to each subordinate', async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([
        { matricule: 'EMP001' }, // all valide → green
        { matricule: 'EMP002' }, // has soumis → orange
        { matricule: 'EMP003' }, // has brouillon → red
        { matricule: 'EMP004' }, // no evals → grey
      ]);

      mockPg.query
        .mockResolvedValueOnce([
          { evalue_matricule: 'EMP001', statut: 'valide', count: '2' },
          { evalue_matricule: 'EMP002', statut: 'valide', count: '1' },
          { evalue_matricule: 'EMP002', statut: 'soumis', count: '1' },
          { evalue_matricule: 'EMP003', statut: 'brouillon', count: '1' },
          // EMP004 has no rows → grey
        ])
        .mockResolvedValueOnce([]) // nb_donnees
        .mockResolvedValueOnce([]); // historique

      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'EMP001', nom: 'A', prenom: 'A', role_nom: 'DR' },
        { matricule: 'EMP002', nom: 'B', prenom: 'B', role_nom: 'DR' },
        { matricule: 'EMP003', nom: 'C', prenom: 'C', role_nom: 'DR' },
        { matricule: 'EMP004', nom: 'D', prenom: 'D', role_nom: 'DR' },
      ]);

      const result = await service.getProgressionEquipe('MGR001');

      const byMatricule = Object.fromEntries(result.subordonnes.map((s) => [s.matricule, s]));
      expect(byMatricule['EMP001'].statut_couleur).toBe('green');
      expect(byMatricule['EMP002'].statut_couleur).toBe('orange');
      expect(byMatricule['EMP003'].statut_couleur).toBe('red');
      expect(byMatricule['EMP004'].statut_couleur).toBe('grey');
    });

    // Test 4: filtre par id_periode si fourni
    it('should include id_periode in query when provided', async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([{ matricule: 'EMP001' }]);

      mockPg.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'EMP001', nom: 'A', prenom: 'A', role_nom: 'DR' },
      ]);

      await service.getProgressionEquipe('MGR001', 'PERIODE-123');

      // The first query call (eval stats) should include the periode param
      const firstQueryArgs = mockPg.query.mock.calls[0];
      const sql: string = firstQueryArgs[0];
      const params: string[] = firstQueryArgs[1];

      expect(sql).toContain('id_periode');
      expect(params).toContain('PERIODE-123');
    });
  });

  // Test 5: getValidationsAttente retourne data + meta avec pagination
  describe('getValidationsAttente', () => {
    it('should return data with meta pagination', async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([
        { matricule: 'EMP001' },
        { matricule: 'EMP002' },
      ]);

      // queryOne call: COUNT
      mockPg.queryOne.mockResolvedValue({ count: '2' });

      // query call: paginated rows
      mockPg.query.mockResolvedValue([
        {
          id_evaluation: 'eval-1',
          evaluateur_matricule: 'EVAL001',
          evalue_matricule: 'EMP001',
          date_soumission: '2025-05-01T10:00:00Z',
          jours_attente: 1.5,
          nom_periode: 'Periode 2025',
          id_periode: 'PERIODE-1',
        },
        {
          id_evaluation: 'eval-2',
          evaluateur_matricule: 'EVAL002',
          evalue_matricule: 'EMP002',
          date_soumission: '2025-04-28T10:00:00Z',
          jours_attente: 4.0,
          nom_periode: 'Periode 2025',
          id_periode: 'PERIODE-1',
        },
      ]);

      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'EVAL001', nom: 'Evaluateur', prenom: 'Un', role_nom: 'DR' },
        { matricule: 'EVAL002', nom: 'Evaluateur', prenom: 'Deux', role_nom: 'DR' },
        { matricule: 'EMP001', nom: 'Employe', prenom: 'Un', role_nom: 'CDS' },
        { matricule: 'EMP002', nom: 'Employe', prenom: 'Deux', role_nom: 'CDS' },
      ]);

      const result = await service.getValidationsAttente('MGR001', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.data[0].id_evaluation).toBe('eval-1');
      expect(result.data[1].id_evaluation).toBe('eval-2');
    });

    // Test 6: priorite 'urgente' si jours_attente >= 3
    it('should assign priorite urgente when jours_attente >= 3', async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([{ matricule: 'EMP001' }]);

      mockPg.queryOne.mockResolvedValue({ count: '2' });

      mockPg.query.mockResolvedValue([
        {
          id_evaluation: 'eval-normale',
          evaluateur_matricule: 'EVAL001',
          evalue_matricule: 'EMP001',
          date_soumission: '2025-05-27T10:00:00Z',
          jours_attente: 1.0,
          nom_periode: 'P2025',
          id_periode: 'P1',
        },
        {
          id_evaluation: 'eval-urgente',
          evaluateur_matricule: 'EVAL001',
          evalue_matricule: 'EMP001',
          date_soumission: '2025-05-20T10:00:00Z',
          jours_attente: 5.0,
          nom_periode: 'P2025',
          id_periode: 'P1',
        },
        {
          id_evaluation: 'eval-exactement-3',
          evaluateur_matricule: 'EVAL001',
          evalue_matricule: 'EMP001',
          date_soumission: '2025-05-25T10:00:00Z',
          jours_attente: 3.0,
          nom_periode: 'P2025',
          id_periode: 'P1',
        },
      ]);

      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'EVAL001', nom: 'Eval', prenom: 'One', role_nom: 'DR' },
        { matricule: 'EMP001', nom: 'Emp', prenom: 'One', role_nom: 'CDS' },
      ]);

      const result = await service.getValidationsAttente('MGR001', { page: 1, limit: 20 });

      const byId = Object.fromEntries(result.data.map((d) => [d.id_evaluation, d]));
      expect(byId['eval-normale'].priorite).toBe('normale');
      expect(byId['eval-urgente'].priorite).toBe('urgente');
      expect(byId['eval-exactement-3'].priorite).toBe('urgente');
    });

    it('should return empty result when manager has no subordinates', async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([]);

      const result = await service.getValidationsAttente('MGR001', { page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.page).toBe(1);
    });

    it("anonymise l'évaluateur pair avant l'enrichissement de la file", async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([{ matricule: 'EMP001' }]);
      mockPg.queryOne.mockResolvedValue({ count: '1' });
      mockPg.query.mockResolvedValue([
        {
          id_evaluation: 'eval-pairs',
          evaluateur_matricule: 'PAIR-SECRET',
          evalue_matricule: 'EMP001',
          type_evaluation: 'pairs',
          date_soumission: '2025-05-01T10:00:00Z',
          jours_attente: 2,
          nom_periode: 'P2025',
          id_periode: 'P1',
          __rule_envelope: {
            visibility_policy: { manager_n1: true, detail: 'detailed' },
          },
        },
      ]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'PAIR-SECRET', nom: 'Identité', prenom: 'Secrète', role_nom: 'CSC' },
        { matricule: 'EMP001', nom: 'Employé', prenom: 'Un', role_nom: 'CSC' },
      ]);

      const result = await service.getValidationsAttente('MGR001', { page: 1, limit: 20 });

      expect(result.data[0].evaluateur_matricule).toBeNull();
      expect(result.data[0].evaluateur_nom).toBe('Anonyme');
      expect(mockPrisma.utilisateur.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { matricule: { in: ['EMP001'] } } }),
      );
      for (const sql of [
        String(mockPg.queryOne.mock.calls[0][0]),
        String(mockPg.query.mock.calls[0][0]),
      ]) {
        expect(sql).toContain("'{visibility_policy,manager_n1}'");
      }
    });

    it("exclut les pairs d'un filtre par matricule pour éviter un oracle d'identité", async () => {
      mockHierarchy.getSubordonnesDirects.mockResolvedValue([{ matricule: 'EMP001' }]);
      mockPg.queryOne.mockResolvedValue({ count: '0' });
      mockPg.query.mockResolvedValue([]);

      await service.getValidationsAttente('MGR001', {
        evaluateur_matricule: 'PAIR-SECRET',
      });

      const countSql = String(mockPg.queryOne.mock.calls[0][0]);
      const rowsSql = String(mockPg.query.mock.calls[0][0]);
      for (const sql of [countSql, rowsSql]) {
        expect(sql).toContain("e.type_evaluation <> 'pairs'");
        expect(sql).toContain('e.evaluateur_matricule');
      }
    });
  });
});
