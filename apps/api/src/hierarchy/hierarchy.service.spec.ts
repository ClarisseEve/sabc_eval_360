import { HierarchyService } from './hierarchy.service';

describe('HierarchyService', () => {
  let service: HierarchyService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      region: { findUnique: jest.fn() },
      utilisateur: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new HierarchyService(mockPrisma);
  });

  describe('getHierarchieRegion', () => {
    it('should return empty object for unknown region', async () => {
      mockPrisma.region.findUnique.mockResolvedValue(null);
      const result = await service.getHierarchieRegion('UNKNOWN');
      expect(result).toEqual({});
    });

    it('should return 5-level structure for taniere', async () => {
      mockPrisma.region.findUnique.mockResolvedValue({
        id_region: 'R1', nom_region: 'Douala', est_taniere: true,
      });
      mockPrisma.utilisateur.findMany.mockResolvedValue([]);
      const result = await service.getHierarchieRegion('R1');
      expect(result.structure).toHaveProperty('niveau_5');
    });

    it('should return 3-level structure for non-taniere', async () => {
      mockPrisma.region.findUnique.mockResolvedValue({
        id_region: 'R2', nom_region: 'Bertoua', est_taniere: false,
      });
      mockPrisma.utilisateur.findMany.mockResolvedValue([]);
      const result = await service.getHierarchieRegion('R2');
      expect(result.structure).not.toHaveProperty('niveau_4');
      expect(result.structure).toHaveProperty('niveau_3');
    });
  });

  describe('getSubordonnesDirects', () => {
    it('should query by manager_matricule', async () => {
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'SUB1', nom: 'Test', prenom: 'User' },
      ]);
      const result = await service.getSubordonnesDirects('MGR01');
      expect(result).toHaveLength(1);
      expect(mockPrisma.utilisateur.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { manager_matricule: 'MGR01', est_actif: true } }),
      );
    });
  });

  describe('peutSuperviser', () => {
    it('should reject different regions', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 1, id_branche: 'B1', role: 'DR' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R2', niveau_hierarchique: 3, id_branche: 'B1', role: 'CDS' });
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(false);
    });

    it('should reject same or lower level', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B1', role: 'CSC' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B1', role: 'CDS' });
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(false);
    });

    it('should allow higher level same region', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 1, id_branche: 'B1', role: 'DR' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B1', role: 'CDS' });
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(true);
    });

    it('should allow DR cross-branch', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 1, id_branche: 'B1', role: 'DR' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B2', role: 'CDS' });
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(true);
    });

    it('should reject non-DR cross-branch', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 2, id_branche: 'B1', role: 'CSC' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B2', role: 'CDS' });
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(false);
    });
  });

  describe('getRegionStats', () => {
    it('should return total and par_role', async () => {
      mockPrisma.utilisateur.count.mockResolvedValue(10);
      mockPrisma.utilisateur.groupBy.mockResolvedValue([
        { role: 'DR', _count: 1 },
        { role: 'CDS', _count: 9 },
      ]);
      const result = await service.getRegionStats('R1');
      expect(result.total).toBe(10);
      expect(result.par_role).toHaveLength(2);
    });
  });
});
