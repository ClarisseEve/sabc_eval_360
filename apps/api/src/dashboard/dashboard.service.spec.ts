import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPg: any;
  let mockPrisma: any;

  let mockCache: any;

  beforeEach(() => {
    mockPg = {
      query: jest.fn(),
      queryOne: jest.fn(),
      execute: jest.fn(),
    };
    mockPrisma = {
      utilisateur: {
        count: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      region: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      replacement_temporaire: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    mockCache = {
      getOrCompute: jest.fn((_key: string, _ttl: number, fn: () => any) => fn()),
    };
    service = new DashboardService(mockPg, mockPrisma, mockCache);
  });

  describe('getStats', () => {
    it('should return dashboard stats for a user', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({ count: '3' })   // en attente
        .mockResolvedValueOnce({ count: '10' })   // total
        .mockResolvedValueOnce({ note_globale: 4.25 }) // score
        .mockResolvedValueOnce({ id_periode: 'p1', nom_periode: 'S1 2027', date_fin: '2027-06-30' });

      const result = await service.getStats('MAT001');

      expect(result.evaluations_en_attente).toBe(3);
      expect(result.evaluations_total).toBe(10);
      expect(result.score_personnel).toBe(4.3);
      expect(result.periode_active).toEqual({
        id: 'p1',
        nom: 'S1 2027',
        fin: '2027-06-30',
      });
      expect(String(mockPg.queryOne.mock.calls[2][0])).toContain(
        "'{visibility_policy,evaluated}'",
      );
    });

    it('should return null score when no validated evaluation exists', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({ count: '0' })
        .mockResolvedValueOnce({ count: '0' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.getStats('MAT002');

      expect(result.score_personnel).toBeNull();
      expect(result.periode_active).toBeNull();
    });
  });

  describe('getAdminStats', () => {
    it('should return extended admin stats', async () => {
      // Base stats mocks
      mockPg.queryOne
        .mockResolvedValueOnce({ count: '1' })   // en attente
        .mockResolvedValueOnce({ count: '5' })    // total
        .mockResolvedValueOnce(null)              // score
        .mockResolvedValueOnce(null)              // periode
        .mockResolvedValueOnce({ total: '100', en_cours: '20', validees: '60' }); // eval stats

      mockPrisma.utilisateur.count
        .mockResolvedValueOnce(50)                // total users
        .mockResolvedValueOnce(45);               // active users
      mockPrisma.replacement_temporaire.count.mockResolvedValueOnce(3);

      const result = await service.getAdminStats('ADMIN01');

      expect(result.total_utilisateurs).toBe(50);
      expect(result.utilisateurs_actifs).toBe(45);
      expect(result.total_evaluations).toBe(100);
      expect(result.evaluations_en_cours).toBe(20);
      expect(result.evaluations_validees).toBe(60);
      expect(result.taux_completion).toBe(60);
      expect(result.remplacements_actifs).toBe(3);
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
  });

  describe('getRoleTitle', () => {
    it('should return correct title for known roles', () => {
      expect(service.getRoleTitle('DR')).toBe('Tableau de Bord Directeur Régional');
      expect(service.getRoleTitle('admin')).toBe('Tableau de Bord Administrateur');
      expect(service.getRoleTitle('CDS')).toBe('Tableau de Bord Chef de Secteur');
    });

    it('should default to collaborateur for unknown roles', () => {
      expect(service.getRoleTitle('unknown')).toBe('Tableau de Bord Collaborateur');
    });
  });

  describe('getValidRoles', () => {
    it('should return all valid role keys', () => {
      const roles = service.getValidRoles();
      expect(roles).toContain('admin');
      expect(roles).toContain('dr');
      expect(roles).toContain('cdtt');
      expect(roles).toContain('collaborateur');
      expect(roles.length).toBe(12);
    });
  });
});
