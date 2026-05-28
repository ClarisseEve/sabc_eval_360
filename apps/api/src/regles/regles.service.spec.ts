import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReglesService } from './regles.service';

describe('ReglesService', () => {
  let service: ReglesService;
  let mockPg: any;

  beforeEach(() => {
    mockPg = { query: jest.fn(), queryOne: jest.fn(), execute: jest.fn() };
    service = new ReglesService(mockPg);
  });

  const validCritere = (override = {}) => ({
    nom: 'Critère test',
    description: 'Description test',
    ponderation: 20,
    echelle: { min: 1, max: 5 },
    categorie: 'Performance',
    ...override,
  });

  describe('validateCriteres', () => {
    it('should validate correct criteres', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 20 }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(true);
      expect(result.erreurs).toHaveLength(0);
    });

    it('should reject fewer than 5 criteres', () => {
      const criteres = [validCritere({ ponderation: 100 })];
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('Minimum 5'))).toBe(true);
    });

    it('should reject ponderation != 100', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 10 }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('100%'))).toBe(true);
    });

    it('should reject invalid echelle', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 20, echelle: { min: 0, max: 10 } }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('échelle'))).toBe(true);
    });

    it('should reject invalid categorie', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 20, categorie: 'INVALID' }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('catégorie'))).toBe(true);
    });
  });

  describe('getConstraints', () => {
    it('should return constraints', () => {
      const c = service.getConstraints();
      expect(c.min_criteres).toBe(5);
      expect(c.total_ponderation).toBe(100);
      expect(c.echelle_min).toBe(1);
      expect(c.echelle_max).toBe(5);
      expect(c.categories_valides.length).toBe(8);
    });
  });

  describe('getCategoriesValides', () => {
    it('should return 8 categories', () => {
      expect(service.getCategoriesValides()).toHaveLength(8);
    });
  });

  const validDto = () => ({
    nom_regle: 'Règle test',
    criteres: Array.from({ length: 5 }, (_, i) => ({
      nom: `Critère ${i + 1}`,
      description: 'Desc',
      ponderation: 20,
      echelle: { min: 1, max: 5 },
      categorie: 'Performance',
    })),
  });

  describe('create', () => {
    it('creates rule with valid 5 criteres summing to 100%', async () => {
      mockPg.execute.mockResolvedValue(undefined);
      mockPg.queryOne.mockResolvedValue({
        id_regle: 'uuid-1', nom_regle: 'Règle test', est_active: true,
        criteres_evaluation_json: { criteres: [] }, created_at: new Date(), updated_at: new Date(),
      });
      const result = await service.create(validDto() as any);
      expect(mockPg.execute).toHaveBeenCalledWith(expect.stringContaining('INSERT'), expect.any(Array));
      expect(result).toBeDefined();
    });

    it('rejects create with < 5 criteres', async () => {
      const dto = { ...validDto(), criteres: validDto().criteres.slice(0, 3) };
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('rejects create with ponderation != 100', async () => {
      const dto = { ...validDto(), criteres: validDto().criteres.map(c => ({ ...c, ponderation: 10 })) };
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const existingRow = {
      id_regle: 'uuid-1', nom_regle: 'Ancienne règle', est_active: true,
      criteres_evaluation_json: { criteres: [] }, role_evaluateur: null,
      role_evalue: null, type_evaluation: null, description: null, created_at: new Date(), updated_at: new Date(),
    };

    it('updates nom_regle only', async () => {
      mockPg.queryOne.mockResolvedValue(existingRow);
      mockPg.execute.mockResolvedValue(undefined);
      await service.update('uuid-1', { nom_regle: 'Nouveau nom' });
      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE regles_evaluation'),
        expect.arrayContaining(['Nouveau nom', 'uuid-1']),
      );
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      await expect(service.update('unknown', { nom_regle: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('flips est_active flag', async () => {
      mockPg.queryOne.mockResolvedValue({
        id_regle: 'uuid-1', est_active: true,
        criteres_evaluation_json: { criteres: [] }, created_at: new Date(), updated_at: new Date(),
      });
      mockPg.execute.mockResolvedValue(undefined);
      await service.toggleActive('uuid-1');
      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('NOT est_active'), ['uuid-1'],
      );
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      await expect(service.toggleActive('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    const existingRow = {
      id_regle: 'uuid-1', est_active: true,
      criteres_evaluation_json: { criteres: [] }, created_at: new Date(), updated_at: new Date(),
    };

    it('hard-deletes when no evaluations reference the rule', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(existingRow) // findById
        .mockResolvedValueOnce({ count: '0' }); // reference check
      mockPg.execute.mockResolvedValue(undefined);
      const result = await service.delete('uuid-1');
      expect(result).toEqual({ deleted: true, deactivated: false });
      expect(mockPg.execute).toHaveBeenCalledWith(expect.stringContaining('DELETE'), ['uuid-1']);
    });

    it('soft-deletes (deactivates) when evaluations reference the rule', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(existingRow)
        .mockResolvedValueOnce({ count: '3' });
      mockPg.execute.mockResolvedValue(undefined);
      const result = await service.delete('uuid-1');
      expect(result).toEqual({ deleted: false, deactivated: true });
      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('est_active = false'), ['uuid-1'],
      );
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAll', () => {
    it('returns all rules including inactive', async () => {
      mockPg.query.mockResolvedValue([
        { id_regle: '1', est_active: true, criteres_evaluation_json: { criteres: [] }, created_at: new Date(), updated_at: new Date() },
        { id_regle: '2', est_active: false, criteres_evaluation_json: { criteres: [] }, created_at: new Date(), updated_at: new Date() },
      ]);
      const result = await service.listAll();
      expect(result).toHaveLength(2);
      expect(mockPg.query).toHaveBeenCalledWith(expect.not.stringContaining('WHERE est_active'));
    });
  });
});
