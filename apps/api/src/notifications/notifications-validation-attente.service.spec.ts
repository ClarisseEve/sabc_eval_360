import { NotificationsValidationAttenteService } from './notifications-validation-attente.service';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsValidationAttenteService', () => {
  let service: NotificationsValidationAttenteService;
  let mockPg: jest.Mocked<Pick<DatabasePgService, 'query'>>;
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'utilisateur'>>;
  let mockNotifications: jest.Mocked<Pick<NotificationsService, 'create'>>;

  beforeEach(() => {
    mockPg = { query: jest.fn() };
    mockPrisma = {
      utilisateur: {
        findUnique: jest.fn(),
      } as any,
    };
    mockNotifications = {
      create: jest.fn().mockResolvedValue({ id_notification: 'uuid-test' }),
    };
    service = new NotificationsValidationAttenteService(
      mockPg as unknown as DatabasePgService,
      mockPrisma as unknown as PrismaService,
      mockNotifications as unknown as NotificationsService,
    );
  });

  describe('notifierManagersAttente', () => {
    it('should return 0 when no evaluations are pending', async () => {
      mockPg.query.mockResolvedValue([]);

      const count = await service.notifierManagersAttente();

      expect(count).toBe(0);
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('should send one notification per unique manager', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date() },
        { id_evaluation: 'e2', evalue_matricule: 'EMP02', date_soumission: new Date() },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce({ manager_matricule: 'MGR01' })
        .mockResolvedValueOnce({ manager_matricule: 'MGR01' }); // same manager

      const count = await service.notifierManagersAttente();

      // Both employees share the same manager → only 1 notification
      expect(mockNotifications.create).toHaveBeenCalledTimes(1);
      expect(count).toBe(1);
    });

    it('should send separate notifications to different managers', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date() },
        { id_evaluation: 'e2', evalue_matricule: 'EMP02', date_soumission: new Date() },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce({ manager_matricule: 'MGR01' })
        .mockResolvedValueOnce({ manager_matricule: 'MGR02' });

      const count = await service.notifierManagersAttente();

      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
      expect(count).toBe(2);
    });

    it('should skip employees without a manager', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date() },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        manager_matricule: null,
      });

      const count = await service.notifierManagersAttente();

      expect(count).toBe(0);
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('should create notification with type=warning and count in message', async () => {
      mockPg.query.mockResolvedValue([
        { id_evaluation: 'e1', evalue_matricule: 'EMP01', date_soumission: new Date() },
        { id_evaluation: 'e2', evalue_matricule: 'EMP03', date_soumission: new Date() },
      ]);
      (mockPrisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        manager_matricule: 'MGR01',
      });

      await service.notifierManagersAttente();

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          destinataire_matricule: 'MGR01',
          type: 'warning',
          message: expect.stringContaining('2'),
        }),
      );
    });

    it('should query evaluations soumis older than 3 days on open periods', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.notifierManagersAttente();

      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'soumis'"),
      );
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('3 days'),
      );
    });
  });
});
