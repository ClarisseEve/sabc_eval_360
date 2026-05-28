import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockPg: { query: jest.Mock; queryOne: jest.Mock };

  const mockRapport = {
    id_rapport: 'uuid-1',
    titre: 'Test Rapport',
    createur_matricule: 'MAT001',
    sections_json: [],
    statut: 'brouillon',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockPg = { query: jest.fn(), queryOne: jest.fn() };
    service = new ReportsService(mockPg as any, {} as any);
  });

  describe('createRapport', () => {
    it('should insert and return the rapport with empty sections', async () => {
      mockPg.queryOne.mockResolvedValue({ ...mockRapport, sections_json: [] });

      const result = await service.createRapport('Test Rapport', 'MAT001');

      expect(result.titre).toBe('Test Rapport');
      expect(result.createur_matricule).toBe('MAT001');
      expect(result.sections_json).toEqual([]);
      expect(mockPg.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rapports'),
        ['Test Rapport', 'MAT001'],
      );
    });

    it('should handle null sections_json from DB and return empty array', async () => {
      mockPg.queryOne.mockResolvedValue({ ...mockRapport, sections_json: null });

      const result = await service.createRapport('Test', 'MAT001');

      expect(result.sections_json).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return paginated list with total count', async () => {
      const rows = [mockRapport, { ...mockRapport, id_rapport: 'uuid-2', titre: 'Rapport 2' }];
      mockPg.query.mockResolvedValue(rows);
      mockPg.queryOne.mockResolvedValue({ count: '2' });

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should apply correct offset for pagination', async () => {
      mockPg.query.mockResolvedValue([]);
      mockPg.queryOne.mockResolvedValue({ count: '0' });

      await service.findAll(2, 10);

      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET $2'),
        [10, 10],
      );
    });
  });

  describe('findOne', () => {
    it('should return an existing rapport', async () => {
      mockPg.queryOne.mockResolvedValue(mockRapport);

      const result = await service.findOne('uuid-1');

      expect(result.id_rapport).toBe('uuid-1');
      expect(result.titre).toBe('Test Rapport');
    });

    it('should throw NotFoundException if rapport is absent', async () => {
      mockPg.queryOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRapport', () => {
    it('should update titre and/or statut', async () => {
      const updated = { ...mockRapport, titre: 'Nouveau Titre', statut: 'finalise' };
      mockPg.queryOne.mockResolvedValue(updated);

      const result = await service.updateRapport('uuid-1', { titre: 'Nouveau Titre', statut: 'finalise' });

      expect(result.titre).toBe('Nouveau Titre');
      expect(result.statut).toBe('finalise');
      expect(mockPg.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rapports SET'),
        expect.arrayContaining(['Nouveau Titre', 'finalise', 'uuid-1']),
      );
    });

    it('should throw NotFoundException if rapport not found during update', async () => {
      mockPg.queryOne.mockResolvedValue(null);

      await expect(service.updateRapport('bad-id', { titre: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should update statut to supprime', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.softDelete('uuid-1');

      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'supprime'"),
        ['uuid-1'],
      );
    });
  });

  describe('addSection', () => {
    it('should add a section with uuid and auto-incremented order', async () => {
      const rapportWithSections = {
        ...mockRapport,
        sections_json: [
          { id: 'existing-sec', type: 'kpis', titre: 'KPIs', contenu: {}, ordre: 1 },
        ],
      };
      // findOne call
      mockPg.queryOne.mockResolvedValueOnce(rapportWithSections);
      // saveSections call
      const savedRapport = {
        ...rapportWithSections,
        sections_json: [
          ...rapportWithSections.sections_json,
          { id: expect.any(String), type: 'texte_libre', titre: 'Texte', contenu: {}, ordre: 2 },
        ],
      };
      mockPg.queryOne.mockResolvedValueOnce(savedRapport);

      const result = await service.addSection('uuid-1', 'texte_libre', 'Texte');

      expect(mockPg.queryOne).toHaveBeenCalledTimes(2);
      // Verify saveSections was called with JSON that includes the new section at order 2
      const saveCall = mockPg.queryOne.mock.calls[1];
      const sectionsArg = JSON.parse(saveCall[1][0]);
      expect(sectionsArg).toHaveLength(2);
      expect(sectionsArg[1].type).toBe('texte_libre');
      expect(sectionsArg[1].ordre).toBe(2);
      expect(sectionsArg[1].id).toBeTruthy();
    });
  });

  describe('reorderSections', () => {
    it('should reorder sections according to orderedIds', async () => {
      const sections = [
        { id: 'sec-a', type: 'kpis' as const, titre: 'KPIs', contenu: {}, ordre: 1 },
        { id: 'sec-b', type: 'texte_libre' as const, titre: 'Texte', contenu: {}, ordre: 2 },
        { id: 'sec-c', type: 'tendances' as const, titre: 'Tendances', contenu: {}, ordre: 3 },
      ];
      mockPg.queryOne.mockResolvedValueOnce({ ...mockRapport, sections_json: sections });
      mockPg.queryOne.mockResolvedValueOnce({ ...mockRapport, sections_json: [] });

      await service.reorderSections('uuid-1', ['sec-c', 'sec-a', 'sec-b']);

      const saveCall = mockPg.queryOne.mock.calls[1];
      const reordered = JSON.parse(saveCall[1][0]);
      expect(reordered[0].id).toBe('sec-c');
      expect(reordered[0].ordre).toBe(1);
      expect(reordered[1].id).toBe('sec-a');
      expect(reordered[1].ordre).toBe(2);
      expect(reordered[2].id).toBe('sec-b');
      expect(reordered[2].ordre).toBe(3);
    });
  });

  describe('removeSection', () => {
    it('should remove the section and recalculate orders', async () => {
      const sections = [
        { id: 'sec-a', type: 'kpis' as const, titre: 'KPIs', contenu: {}, ordre: 1 },
        { id: 'sec-b', type: 'texte_libre' as const, titre: 'Texte', contenu: {}, ordre: 2 },
        { id: 'sec-c', type: 'tendances' as const, titre: 'Tendances', contenu: {}, ordre: 3 },
      ];
      mockPg.queryOne.mockResolvedValueOnce({ ...mockRapport, sections_json: sections });
      mockPg.queryOne.mockResolvedValueOnce({ ...mockRapport, sections_json: [] });

      await service.removeSection('uuid-1', 'sec-b');

      const saveCall = mockPg.queryOne.mock.calls[1];
      const remaining = JSON.parse(saveCall[1][0]);
      expect(remaining).toHaveLength(2);
      expect(remaining.find((s: any) => s.id === 'sec-b')).toBeUndefined();
      expect(remaining[0].ordre).toBe(1);
      expect(remaining[1].ordre).toBe(2);
    });
  });
});
