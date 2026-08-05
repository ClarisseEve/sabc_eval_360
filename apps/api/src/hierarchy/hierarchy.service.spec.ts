import { HierarchyService } from './hierarchy.service';

describe('HierarchyService', () => {
  let service: HierarchyService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      region: { findUnique: jest.fn() },
      role: { findUnique: jest.fn() },
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

    it('should allow cross-branch when role.peut_cross_branch = true', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 1, id_branche: 'B1', role: 'DR' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B2', role: 'CDS' });
      mockPrisma.role.findUnique.mockResolvedValue({ id_role: 'DR', peut_cross_branch: true });
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(true);
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({ where: { nom_role: 'DR' } });
    });

    it('should reject cross-branch when role.peut_cross_branch = false', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 2, id_branche: 'B1', role: 'CSC' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B2', role: 'CDS' });
      mockPrisma.role.findUnique.mockResolvedValue({ id_role: 'CSC', peut_cross_branch: false });
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(false);
    });

    it('should reject cross-branch when role not found in DB', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'S1', id_region: 'R1', niveau_hierarchique: 2, id_branche: 'B1', role: 'UNKNOWN' })
        .mockResolvedValueOnce({ matricule: 'S2', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B2', role: 'CDS' });
      mockPrisma.role.findUnique.mockResolvedValue(null);
      const result = await service.peutSuperviser('S1', 'S2');
      expect(result).toBe(false);
    });
  });

  describe('validerAssignationManager', () => {
    it('should return valid when same region, higher level, same branch', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'U1', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B1' })
        .mockResolvedValueOnce({ matricule: 'MGR1', id_region: 'R1', niveau_hierarchique: 1, id_branche: 'B1' })
        // getChaineHierarchique calls findUnique too — no cycle, chain: MGR1 has no manager
        .mockResolvedValueOnce({ matricule: 'MGR1', nom: '', prenom: '', role: 'DR', role_nom: 'DR', manager_matricule: null, niveau_hierarchique: 1 })
        .mockResolvedValueOnce(null); // end of chain
      const result = await service.validerAssignationManager('U1', 'MGR1');
      expect(result.valide).toBe(true);
      expect(result.erreurs).toHaveLength(0);
    });

    it('should return invalid when manager in different region', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'U1', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B1' })
        .mockResolvedValueOnce({ matricule: 'MGR1', id_region: 'R2', niveau_hierarchique: 1, id_branche: 'B1' })
        .mockResolvedValueOnce({ matricule: 'MGR1', nom: '', prenom: '', role: 'DR', role_nom: 'DR', manager_matricule: null, niveau_hierarchique: 1 })
        .mockResolvedValueOnce(null);
      const result = await service.validerAssignationManager('U1', 'MGR1');
      expect(result.valide).toBe(false);
      expect(result.erreurs).toContain('Le manager doit être dans la même région');
    });

    it('should return invalid when manager level is not higher', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'U1', id_region: 'R1', niveau_hierarchique: 2, id_branche: 'B1' })
        .mockResolvedValueOnce({ matricule: 'MGR1', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B1' })
        .mockResolvedValueOnce({ matricule: 'MGR1', nom: '', prenom: '', role: 'CDS', role_nom: 'CDS', manager_matricule: null, niveau_hierarchique: 3 })
        .mockResolvedValueOnce(null);
      const result = await service.validerAssignationManager('U1', 'MGR1');
      expect(result.valide).toBe(false);
      expect(result.erreurs).toContain('Le manager doit être à un niveau supérieur');
    });

    it('should allow cross-branch when manager role has peut_cross_branch=true', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'U1', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B2' })
        .mockResolvedValueOnce({ matricule: 'DR1', id_region: 'R1', niveau_hierarchique: 1, id_branche: 'B1', role: 'DR' })
        .mockResolvedValueOnce({ matricule: 'DR1', nom: '', prenom: '', role: 'DR', role_nom: 'DR', manager_matricule: null, niveau_hierarchique: 1 })
        .mockResolvedValueOnce(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id_role: 'DR', peut_cross_branch: true });
      const result = await service.validerAssignationManager('U1', 'DR1');
      expect(result.valide).toBe(true);
    });

    it('should reject cross-branch when manager role has peut_cross_branch=false', async () => {
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'U1', id_region: 'R1', niveau_hierarchique: 3, id_branche: 'B2' })
        .mockResolvedValueOnce({ matricule: 'CSC1', id_region: 'R1', niveau_hierarchique: 2, id_branche: 'B1', role: 'CSC' })
        .mockResolvedValueOnce({ matricule: 'CSC1', nom: '', prenom: '', role: 'CSC', role_nom: 'CSC', manager_matricule: null, niveau_hierarchique: 2 })
        .mockResolvedValueOnce(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id_role: 'CSC', peut_cross_branch: false });
      const result = await service.validerAssignationManager('U1', 'CSC1');
      expect(result.valide).toBe(false);
      expect(result.erreurs).toContain("Seuls les rôles autorisés (peut_cross_branch) peuvent superviser des utilisateurs d'autres branches");
    });

    it('should detect hierarchy cycle', async () => {
      // U1 tries to set MGR1 as manager, but MGR1 is already a subordinate of U1
      mockPrisma.utilisateur.findUnique
        .mockResolvedValueOnce({ matricule: 'U1', id_region: 'R1', niveau_hierarchique: 2, id_branche: 'B1' })
        .mockResolvedValueOnce({ matricule: 'MGR1', id_region: 'R1', niveau_hierarchique: 1, id_branche: 'B1' })
        // getChaineHierarchique for MGR1: MGR1 -> U1 (cycle!)
        .mockResolvedValueOnce({ matricule: 'MGR1', nom: '', prenom: '', role: 'DR', role_nom: 'DR', manager_matricule: 'U1', niveau_hierarchique: 1 })
        .mockResolvedValueOnce({ matricule: 'U1', nom: '', prenom: '', role: 'CSC', role_nom: 'CSC', manager_matricule: null, niveau_hierarchique: 2 })
        .mockResolvedValueOnce(null);
      const result = await service.validerAssignationManager('U1', 'MGR1');
      expect(result.valide).toBe(false);
      expect(result.erreurs).toContain('Cette assignation créerait un cycle dans la hiérarchie');
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
