import { EvaluationsService } from './evaluations.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('EvaluationsService', () => {
  let service: EvaluationsService;
  let mockPg: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockPg = {
      query: jest.fn(),
      queryOne: jest.fn(),
      execute: jest.fn(),
    };
    mockPrisma = {
      utilisateur: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new EvaluationsService(mockPg, mockPrisma);
  });

  describe('findById', () => {
    it('should return evaluation when found', async () => {
      const eval_ = { id_evaluation: 'uuid-1', statut: 'brouillon' };
      mockPg.queryOne.mockResolvedValue(eval_);
      const result = await service.findById('uuid-1');
      expect(result).toEqual(eval_);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNotes', () => {
    it('should update notes for brouillon', async () => {
      mockPg.queryOne.mockResolvedValue({ id_evaluation: 'uuid-1', statut: 'brouillon' });
      mockPg.execute.mockResolvedValue(1);
      const result = await service.updateNotes('uuid-1', [{ note: 4, poids: 1 }]);
      expect(result).toBe(true);
      expect(mockPg.execute).toHaveBeenCalled();
    });

    it('should reject update for non-brouillon', async () => {
      mockPg.queryOne.mockResolvedValue({ id_evaluation: 'uuid-1', statut: 'soumis' });
      await expect(service.updateNotes('uuid-1', [])).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit', () => {
    it('should submit brouillon with notes', async () => {
      mockPg.queryOne.mockResolvedValue({
        id_evaluation: 'uuid-1',
        statut: 'brouillon',
        notations_json: JSON.stringify([{ note: 4 }]),
      });
      mockPg.execute.mockResolvedValue(1);
      const result = await service.submit('uuid-1');
      expect(result.success).toBe(true);
    });

    it('should reject empty evaluation', async () => {
      mockPg.queryOne.mockResolvedValue({
        id_evaluation: 'uuid-1',
        statut: 'brouillon',
        notations_json: '[]',
      });
      const result = await service.submit('uuid-1');
      expect(result.success).toBe(false);
    });

    it('should reject non-brouillon', async () => {
      mockPg.queryOne.mockResolvedValue({ id_evaluation: 'uuid-1', statut: 'valide' });
      const result = await service.submit('uuid-1');
      expect(result.success).toBe(false);
    });
  });

  describe('getEnAttente', () => {
    it('should return pending evaluations', async () => {
      const evals = [{ id_evaluation: '1' }, { id_evaluation: '2' }];
      mockPg.query.mockResolvedValue(evals);
      const result = await service.getEnAttente('MAT01');
      expect(result).toEqual(evals);
    });
  });

  describe('getAValider', () => {
    it('should return empty for manager with no subordonnes', async () => {
      mockPrisma.utilisateur.findMany.mockResolvedValue([]);
      const result = await service.getAValider('MGR01');
      expect(result).toEqual([]);
    });

    it('should query by subordonnes matricules', async () => {
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'SUB1' },
        { matricule: 'SUB2' },
      ]);
      mockPg.query.mockResolvedValue([{ id_evaluation: 'e1' }]);
      const result = await service.getAValider('MGR01');
      expect(result).toHaveLength(1);
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('soumis'),
        ['SUB1', 'SUB2'],
      );
    });
  });
});
