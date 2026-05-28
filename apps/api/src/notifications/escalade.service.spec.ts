import { EscaladeService } from './escalade.service';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('EscaladeService', () => {
  let service: EscaladeService;
  let mockPg: jest.Mocked<Pick<DatabasePgService, 'query'>>;
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'utilisateur'>>;
  let mockNotifications: jest.Mocked<Pick<NotificationsService, 'create'>>;

  beforeEach(() => {
    mockPg = { query: jest.fn() };
    mockPrisma = {
      utilisateur: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      } as any,
    };
    mockNotifications = {
      create: jest.fn().mockResolvedValue({ id_notification: 'uuid-test' }),
    };
    service = new EscaladeService(
      mockPg as unknown as DatabasePgService,
      mockPrisma as unknown as PrismaService,
      mockNotifications as unknown as NotificationsService,
    );
  });

  describe('traiterEscalade', () => {
    it('should return zero counts when no soumis evaluations exist', async () => {
      mockPg.query.mockResolvedValue([]);

      const result = await service.traiterEscalade();

      expect(result).toEqual({ l1: 0, l2: 0, l3: 0, l4: 0 });
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('should skip evaluations with less than 3 days', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date(), jours_attente: 1.5 },
      ]);

      const result = await service.traiterEscalade();

      expect(result).toEqual({ l1: 0, l2: 0, l3: 0, l4: 0 });
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('should trigger L1 only for evaluations between 3 and 6 days', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date(), jours_attente: 4.2 },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({ manager_matricule: null });

      const result = await service.traiterEscalade();

      expect(result.l1).toBe(1);
      expect(result.l2).toBe(0);
      expect(result.l3).toBe(0);
      expect(result.l4).toBe(0);
      expect(mockNotifications.create).toHaveBeenCalledTimes(1);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ destinataire_matricule: 'EMP01' }),
      );
    });

    it('should trigger L1 and L2 for evaluations between 7 and 9 days', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date(), jours_attente: 8 },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce({ manager_matricule: 'MGR01' }) // evalue → manager
        .mockResolvedValueOnce({ manager_matricule: null });   // manager → no N+2

      const result = await service.traiterEscalade();

      expect(result.l1).toBe(1);
      expect(result.l2).toBe(1);
      expect(result.l3).toBe(0);
      expect(result.l4).toBe(0);
    });

    it('should trigger L1, L2, L3 for evaluations between 10 and 14 days', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date(), jours_attente: 12 },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce({ manager_matricule: 'MGR01' }) // evalue → manager
        .mockResolvedValueOnce({ manager_matricule: 'DR001' }); // manager → DR

      const result = await service.traiterEscalade();

      expect(result.l1).toBe(1);
      expect(result.l2).toBe(1);
      expect(result.l3).toBe(1);
      expect(result.l4).toBe(0);
    });

    it('should trigger L1, L2, L3, L4 for evaluations >= 15 days', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date(), jours_attente: 17 },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce({ manager_matricule: 'MGR01' })
        .mockResolvedValueOnce({ manager_matricule: 'DR001' });
      (mockPrisma.utilisateur.findMany as jest.Mock).mockResolvedValue([
        { matricule: 'ADMIN1' },
        { matricule: 'ADMIN2' },
      ]);

      const result = await service.traiterEscalade();

      expect(result.l1).toBe(1);
      expect(result.l2).toBe(1);
      expect(result.l3).toBe(1);
      expect(result.l4).toBe(2); // 2 admins
    });

    it('should continue processing other evaluations if one fails', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date(), jours_attente: 4 },
        { id_evaluation: 'e2', evalue_matricule: 'EMP02', date_soumission: new Date(), jours_attente: 4 },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({ manager_matricule: null });
      mockNotifications.create
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ id_notification: '00000000-0000-0000-0000-000000000002' });

      // Should not throw
      const result = await service.traiterEscalade();
      expect(result.l1).toBe(1); // only second one succeeded
    });
  });
});
