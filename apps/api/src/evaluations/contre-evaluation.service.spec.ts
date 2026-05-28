import { ForbiddenException } from '@nestjs/common';
import { ContreEvaluationService } from './contre-evaluation.service';

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
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };
}

function makeEvaluation(overrides: Record<string, any> = {}): any {
  return {
    id_evaluation: 'eval-uuid-1',
    evaluateur_matricule: 'MAT001',
    evalue_matricule: 'MAT002',
    validateur_matricule: 'MGR001',
    id_periode: 'periode-uuid-1',
    id_regle: 'regle-uuid-1',
    periode_code: '2025-S1',
    statut: 'valide',
    notations_json: '[]',
    type_evaluation: 'descendante',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ContreEvaluationService', () => {
  let service: ContreEvaluationService;
  let mockPg: ReturnType<typeof makeMockPg>;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(() => {
    mockPg = makeMockPg();
    mockPrisma = makeMockPrisma();
    service = new ContreEvaluationService(mockPg as any, mockPrisma as any);
  });

  // -------------------------------------------------------------------------
  // canCreateContreEvaluation
  // -------------------------------------------------------------------------

  describe('canCreateContreEvaluation', () => {
    it('returns false when evaluation not found', async () => {
      mockPg.queryOne.mockResolvedValue(null);

      const result = await service.canCreateContreEvaluation('MGR001', 'nonexistent-id');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Évaluation introuvable');
    });

    it('returns false when evaluation statut is brouillon', async () => {
      mockPg.queryOne.mockResolvedValue(makeEvaluation({ statut: 'brouillon' }));

      const result = await service.canCreateContreEvaluation('MGR001', 'eval-uuid-1');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toMatch(/validées/);
    });

    it('returns false when evaluation statut is soumis', async () => {
      mockPg.queryOne.mockResolvedValue(makeEvaluation({ statut: 'soumis' }));

      const result = await service.canCreateContreEvaluation('MGR001', 'eval-uuid-1');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toMatch(/validées/);
    });

    it('returns true when manager is the validateur_matricule', async () => {
      // First call: fetch evaluation; second call: check for existing contre-evaluation
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation({ validateur_matricule: 'MGR001' }))
        .mockResolvedValueOnce(null); // no existing contre-evaluation

      const result = await service.canCreateContreEvaluation('MGR001', 'eval-uuid-1');

      expect(result.canCreate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('returns true when manager is the direct MySQL manager of the evaluated', async () => {
      // First queryOne: evaluation (validateur is someone else); second: no existing contre-eval
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation({ validateur_matricule: 'OTHER_MGR' }))
        .mockResolvedValueOnce(null);
      // Prisma returns evalue with manager_matricule matching managerMatricule
      mockPrisma.utilisateur.findUnique.mockResolvedValue({
        matricule: 'MAT002',
        manager_matricule: 'MGR001',
      });

      const result = await service.canCreateContreEvaluation('MGR001', 'eval-uuid-1');

      expect(result.canCreate).toBe(true);
    });

    it('returns false when user is unrelated (not validateur, not direct manager)', async () => {
      mockPg.queryOne.mockResolvedValueOnce(makeEvaluation({ validateur_matricule: 'OTHER_MGR' }));
      mockPrisma.utilisateur.findUnique.mockResolvedValue({
        matricule: 'MAT002',
        manager_matricule: 'ANOTHER_MGR',
      });

      const result = await service.canCreateContreEvaluation('UNRELATED', 'eval-uuid-1');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Non autorisé à créer une contre-évaluation');
    });

    it('returns false when a contre-evaluation already exists', async () => {
      // Evaluation is valid and manager is the validateur
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation({ validateur_matricule: 'MGR001' }))
        .mockResolvedValueOnce({ id_evaluation: 'contre-eval-existing' }); // existing contre-eval

      const result = await service.canCreateContreEvaluation('MGR001', 'eval-uuid-1');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Une contre-évaluation existe déjà pour cette évaluation');
    });
  });

  // -------------------------------------------------------------------------
  // createContreEvaluation
  // -------------------------------------------------------------------------

  describe('createContreEvaluation', () => {
    it('throws ForbiddenException when manager is not authorized', async () => {
      // Not found → canCreate = false
      mockPg.queryOne.mockResolvedValue(null);

      await expect(service.createContreEvaluation('UNRELATED', 'eval-uuid-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('creates evaluation with correct fields (type=descendante, statut=brouillon, evaluation_parent_id set)', async () => {
      const original = makeEvaluation({ validateur_matricule: 'MGR001' });
      const newContreEval = {
        ...original,
        id_evaluation: 'new-contre-eval-uuid',
        evaluateur_matricule: 'MGR001',
        statut: 'brouillon',
        type_evaluation: 'descendante',
        evaluation_parent_id: 'eval-uuid-1',
        notations_json: '[]',
      };

      // canCreateContreEvaluation: fetch evaluation, check existing contre-eval
      mockPg.queryOne
        .mockResolvedValueOnce(original) // canCreate: fetch evaluation
        .mockResolvedValueOnce(null)     // canCreate: no existing contre-eval
        .mockResolvedValueOnce(original) // createContreEvaluation: re-fetch original
        .mockResolvedValueOnce(newContreEval); // INSERT ... RETURNING *

      const result = await service.createContreEvaluation('MGR001', 'eval-uuid-1');

      expect(result.statut).toBe('brouillon');
      expect(result.type_evaluation).toBe('descendante');
      expect(result.evaluation_parent_id).toBe('eval-uuid-1');
      expect(result.evaluateur_matricule).toBe('MGR001');
      expect(result.evalue_matricule).toBe(original.evalue_matricule);
    });

    it('returns the created evaluation object', async () => {
      const original = makeEvaluation({ validateur_matricule: 'MGR001' });
      const created = { id_evaluation: 'created-id', statut: 'brouillon', evaluation_parent_id: 'eval-uuid-1' };

      mockPg.queryOne
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(created);

      const result = await service.createContreEvaluation('MGR001', 'eval-uuid-1');

      expect(result).toEqual(created);
    });
  });

  // -------------------------------------------------------------------------
  // getContreEvaluations
  // -------------------------------------------------------------------------

  describe('getContreEvaluations', () => {
    it('returns empty array when no contre-evaluations exist', async () => {
      mockPg.query.mockResolvedValue([]);

      const result = await service.getContreEvaluations('eval-uuid-1');

      expect(result).toEqual([]);
    });

    it('returns list when contre-evaluations exist', async () => {
      const contreEvals = [
        { id_evaluation: 'ce-1', evaluation_parent_id: 'eval-uuid-1', statut: 'brouillon' },
        { id_evaluation: 'ce-2', evaluation_parent_id: 'eval-uuid-1', statut: 'soumis' },
      ];
      mockPg.query.mockResolvedValue(contreEvals);

      const result = await service.getContreEvaluations('eval-uuid-1');

      expect(result).toHaveLength(2);
      expect(result[0].id_evaluation).toBe('ce-1');
      expect(result[1].id_evaluation).toBe('ce-2');
    });

    it('queries by evaluation_parent_id with correct parameter', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.getContreEvaluations('eval-uuid-1');

      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('evaluation_parent_id'),
        ['eval-uuid-1'],
      );
    });
  });
});
