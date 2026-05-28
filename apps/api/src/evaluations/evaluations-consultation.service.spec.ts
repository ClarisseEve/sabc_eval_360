import { BadRequestException } from '@nestjs/common';
import { EvaluationsConsultationService } from './evaluations-consultation.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvaluation(overrides: Record<string, any> = {}): any {
  return {
    id_evaluation: 'eval-1',
    evaluateur_matricule: 'MAT001',
    evalue_matricule: 'MAT002',
    id_periode: 'periode-1',
    statut: 'soumis',
    type_evaluation: 'descendante',
    note_globale: null,
    commentaire_validation: null,
    date_creation: new Date().toISOString(),
    ...overrides,
  };
}

function makeUser(matricule: string, overrides: Record<string, any> = {}): any {
  return {
    matricule,
    nom: `Nom-${matricule}`,
    prenom: `Prenom-${matricule}`,
    role: 'AGENT',
    role_nom: 'Agent Commercial',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeMockPg() {
  return {
    query: jest.fn().mockResolvedValue([]),
    queryOne: jest.fn().mockResolvedValue(null),
    execute: jest.fn().mockResolvedValue(0),
  };
}

function makeMockPrisma() {
  return {
    utilisateur: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('EvaluationsConsultationService', () => {
  let service: EvaluationsConsultationService;
  let mockPg: ReturnType<typeof makeMockPg>;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(() => {
    mockPg = makeMockPg();
    mockPrisma = makeMockPrisma();
    service = new EvaluationsConsultationService(mockPg as any, mockPrisma as any);
  });

  // =========================================================================
  // getRecues
  // =========================================================================

  describe('getRecues', () => {
    it('throws BadRequestException when statut=brouillon is requested', async () => {
      await expect(
        service.getRecues('MAT001', { statut: 'brouillon' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when statut=rejete is requested', async () => {
      await expect(
        service.getRecues('MAT001', { statut: 'rejete' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns only soumis/valide evaluations in normal flow', async () => {
      const eval1 = makeEvaluation({ statut: 'soumis', evalue_matricule: 'MAT001' });
      const eval2 = makeEvaluation({ id_evaluation: 'eval-2', statut: 'valide', evalue_matricule: 'MAT001' });

      mockPg.queryOne.mockResolvedValue({ total: '2' });
      mockPg.query.mockResolvedValue([eval1, eval2]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        makeUser('MAT001'),
        makeUser('MAT002'),
      ]);

      const result = await service.getRecues('MAT001');

      expect(result.meta.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('SQL WHERE clause contains soumis and valide filter', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0' });
      mockPg.query.mockResolvedValue([]);

      await service.getRecues('MAT001');

      // Both the COUNT query and the data query should include the base statut filter
      const countSql: string = mockPg.queryOne.mock.calls[0][0];
      expect(countSql).toContain("statut IN ('soumis', 'valide')");
    });

    it('anonymizes evaluateur for pairs type evaluations', async () => {
      const pairsEval = makeEvaluation({
        type_evaluation: 'pairs',
        evaluateur_matricule: 'MAT003',
        evalue_matricule: 'MAT001',
      });

      mockPg.queryOne.mockResolvedValue({ total: '1' });
      mockPg.query.mockResolvedValue([pairsEval]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        makeUser('MAT001'),
        makeUser('MAT003'),
      ]);

      const result = await service.getRecues('MAT001');
      const item = result.data[0];

      expect(item.evaluateur_nom).toBe('Anonyme');
      expect(item.evaluateur_matricule).toBeNull();
    });

    it('does NOT anonymize evaluateur for non-pairs evaluations', async () => {
      const descEval = makeEvaluation({
        type_evaluation: 'descendante',
        evaluateur_matricule: 'MAT003',
        evalue_matricule: 'MAT001',
      });

      mockPg.queryOne.mockResolvedValue({ total: '1' });
      mockPg.query.mockResolvedValue([descEval]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        makeUser('MAT001'),
        makeUser('MAT003'),
      ]);

      const result = await service.getRecues('MAT001');
      const item = result.data[0];

      expect(item.evaluateur_nom).toBe('Nom-MAT003');
      expect(item.evaluateur_matricule).toBe('MAT003');
    });

    it('appends id_periode filter to query params', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0' });
      mockPg.query.mockResolvedValue([]);

      await service.getRecues('MAT001', { id_periode: 'PERIODE-X' });

      const countParams: any[] = mockPg.queryOne.mock.calls[0][1];
      expect(countParams).toContain('PERIODE-X');
    });

    it('appends type_evaluation filter to query params', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0' });
      mockPg.query.mockResolvedValue([]);

      await service.getRecues('MAT001', { type_evaluation: 'auto' });

      const countParams: any[] = mockPg.queryOne.mock.calls[0][1];
      expect(countParams).toContain('auto');
    });

    it('accepts statut=soumis as a valid filter', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0' });
      mockPg.query.mockResolvedValue([]);

      await expect(service.getRecues('MAT001', { statut: 'soumis' })).resolves.not.toThrow();

      const countParams: any[] = mockPg.queryOne.mock.calls[0][1];
      expect(countParams).toContain('soumis');
    });

    it('accepts statut=valide as a valid filter', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0' });
      mockPg.query.mockResolvedValue([]);

      await expect(service.getRecues('MAT001', { statut: 'valide' })).resolves.not.toThrow();

      const countParams: any[] = mockPg.queryOne.mock.calls[0][1];
      expect(countParams).toContain('valide');
    });

    it('applies default pagination (page=1, limit=20)', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '50' });
      mockPg.query.mockResolvedValue([]);

      const result = await service.getRecues('MAT001');

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('caps limit at 100', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '50' });
      mockPg.query.mockResolvedValue([]);

      const result = await service.getRecues('MAT001', { limit: 999 });

      expect(result.meta.limit).toBe(100);
      const dataParams: any[] = mockPg.query.mock.calls[0][1];
      // limit is the second-to-last param, offset is last
      expect(dataParams[dataParams.length - 2]).toBe(100);
    });
  });

  // =========================================================================
  // getDonnees
  // =========================================================================

  describe('getDonnees', () => {
    it('returns evaluations for all statuses (including brouillon and rejete)', async () => {
      const evals = [
        makeEvaluation({ statut: 'brouillon', evaluateur_matricule: 'MAT001' }),
        makeEvaluation({ id_evaluation: 'e2', statut: 'rejete', evaluateur_matricule: 'MAT001', commentaire_validation: 'Incomplet' }),
      ];

      mockPg.queryOne.mockResolvedValue({ total: '2' });
      mockPg.query.mockResolvedValue(evals);
      mockPrisma.utilisateur.findMany.mockResolvedValue([makeUser('MAT001'), makeUser('MAT002')]);

      const result = await service.getDonnees('MAT001');

      expect(result.meta.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('maps brouillon statut to action=reprendre', async () => {
      const ev = makeEvaluation({ statut: 'brouillon', evaluateur_matricule: 'MAT001' });
      mockPg.queryOne.mockResolvedValue({ total: '1' });
      mockPg.query.mockResolvedValue([ev]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([makeUser('MAT001'), makeUser('MAT002')]);

      const result = await service.getDonnees('MAT001');
      expect(result.data[0].action).toBe('reprendre');
    });

    it('maps soumis statut to action=consulter', async () => {
      const ev = makeEvaluation({ statut: 'soumis', evaluateur_matricule: 'MAT001' });
      mockPg.queryOne.mockResolvedValue({ total: '1' });
      mockPg.query.mockResolvedValue([ev]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([makeUser('MAT001'), makeUser('MAT002')]);

      const result = await service.getDonnees('MAT001');
      expect(result.data[0].action).toBe('consulter');
    });

    it('maps valide statut to action=consulter', async () => {
      const ev = makeEvaluation({ statut: 'valide', evaluateur_matricule: 'MAT001' });
      mockPg.queryOne.mockResolvedValue({ total: '1' });
      mockPg.query.mockResolvedValue([ev]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([makeUser('MAT001'), makeUser('MAT002')]);

      const result = await service.getDonnees('MAT001');
      expect(result.data[0].action).toBe('consulter');
    });

    it('maps rejete statut to action=corriger', async () => {
      const ev = makeEvaluation({ statut: 'rejete', evaluateur_matricule: 'MAT001', commentaire_validation: 'Manque de détails' });
      mockPg.queryOne.mockResolvedValue({ total: '1' });
      mockPg.query.mockResolvedValue([ev]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([makeUser('MAT001'), makeUser('MAT002')]);

      const result = await service.getDonnees('MAT001');
      expect(result.data[0].action).toBe('corriger');
    });

    it('includes commentaire_validation only for rejete evaluations', async () => {
      const evals = [
        makeEvaluation({ id_evaluation: 'e1', statut: 'rejete', commentaire_validation: 'Motif rejet', evaluateur_matricule: 'MAT001' }),
        makeEvaluation({ id_evaluation: 'e2', statut: 'valide', commentaire_validation: 'Some comment', evaluateur_matricule: 'MAT001' }),
        makeEvaluation({ id_evaluation: 'e3', statut: 'soumis', commentaire_validation: 'Another comment', evaluateur_matricule: 'MAT001' }),
      ];
      mockPg.queryOne.mockResolvedValue({ total: '3' });
      mockPg.query.mockResolvedValue(evals);
      mockPrisma.utilisateur.findMany.mockResolvedValue([makeUser('MAT001'), makeUser('MAT002')]);

      const result = await service.getDonnees('MAT001');

      const rejete = result.data.find((d: any) => d.statut === 'rejete');
      const valide = result.data.find((d: any) => d.statut === 'valide');
      const soumis = result.data.find((d: any) => d.statut === 'soumis');

      expect(rejete?.commentaire_validation).toBe('Motif rejet');
      expect(valide?.commentaire_validation).toBeNull();
      expect(soumis?.commentaire_validation).toBeNull();
    });

    it('SQL WHERE clause uses evaluateur_matricule', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0' });
      mockPg.query.mockResolvedValue([]);

      await service.getDonnees('MAT001');

      const countSql: string = mockPg.queryOne.mock.calls[0][0];
      expect(countSql).toContain('evaluateur_matricule');
      expect(countSql).not.toContain('evalue_matricule');
    });
  });

  // =========================================================================
  // getStatsRecues
  // =========================================================================

  describe('getStatsRecues', () => {
    it('returns correct total and valide counts', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '7', valide: '3', note_moyenne: null });

      const stats = await service.getStatsRecues('MAT001');

      expect(stats.total).toBe(7);
      expect(stats.valide).toBe(3);
    });

    it('returns note_moyenne as a float when provided', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '5', valide: '5', note_moyenne: '3.75' });

      const stats = await service.getStatsRecues('MAT001');

      expect(stats.note_moyenne).toBe(3.75);
    });

    it('returns note_moyenne as null when no valide evaluations have a note', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '2', valide: '0', note_moyenne: null });

      const stats = await service.getStatsRecues('MAT001');

      expect(stats.note_moyenne).toBeNull();
    });

    it('returns zeros when no evaluations found', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0', valide: '0', note_moyenne: null });

      const stats = await service.getStatsRecues('MAT001');

      expect(stats.total).toBe(0);
      expect(stats.valide).toBe(0);
      expect(stats.note_moyenne).toBeNull();
    });

    it('SQL query filters on evalue_matricule and correct statuts', async () => {
      mockPg.queryOne.mockResolvedValue({ total: '0', valide: '0', note_moyenne: null });

      await service.getStatsRecues('MAT001');

      const sql: string = mockPg.queryOne.mock.calls[0][0];
      expect(sql).toContain('evalue_matricule');
      expect(sql).toContain("statut IN ('soumis', 'valide')");
    });
  });

  // =========================================================================
  // getStatsDonnees
  // =========================================================================

  describe('getStatsDonnees', () => {
    it('returns per-status counts correctly', async () => {
      mockPg.query.mockResolvedValue([
        { statut: 'brouillon', count: '4' },
        { statut: 'soumis', count: '2' },
        { statut: 'valide', count: '6' },
        { statut: 'rejete', count: '1' },
      ]);

      const stats = await service.getStatsDonnees('MAT001');

      expect(stats.brouillon).toBe(4);
      expect(stats.soumis).toBe(2);
      expect(stats.valide).toBe(6);
      expect(stats.rejete).toBe(1);
      expect(stats.total).toBe(13);
    });

    it('defaults missing statuses to 0', async () => {
      // Only soumis returned from DB — all others must default to 0
      mockPg.query.mockResolvedValue([
        { statut: 'soumis', count: '3' },
      ]);

      const stats = await service.getStatsDonnees('MAT001');

      expect(stats.brouillon).toBe(0);
      expect(stats.valide).toBe(0);
      expect(stats.rejete).toBe(0);
      expect(stats.soumis).toBe(3);
    });

    it('returns all zeros when no evaluations exist', async () => {
      mockPg.query.mockResolvedValue([]);

      const stats = await service.getStatsDonnees('MAT001');

      expect(stats.total).toBe(0);
      expect(stats.brouillon).toBe(0);
      expect(stats.soumis).toBe(0);
      expect(stats.valide).toBe(0);
      expect(stats.rejete).toBe(0);
    });

    it('total equals sum of all status counts', async () => {
      mockPg.query.mockResolvedValue([
        { statut: 'brouillon', count: '2' },
        { statut: 'valide', count: '5' },
      ]);

      const stats = await service.getStatsDonnees('MAT001');

      expect(stats.total).toBe(stats.brouillon + stats.soumis + stats.valide + stats.rejete);
    });

    it('SQL query uses evaluateur_matricule and groups by statut', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getStatsDonnees('MAT001');

      const sql: string = mockPg.query.mock.calls[0][0];
      expect(sql).toContain('evaluateur_matricule');
      expect(sql).toContain('GROUP BY statut');
    });
  });
});
