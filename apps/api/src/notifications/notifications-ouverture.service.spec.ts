import { NotificationsOuvertureService } from './notifications-ouverture.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsOuvertureService', () => {
  let service: NotificationsOuvertureService;
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'utilisateur'>>;
  let mockNotifications: jest.Mocked<Pick<NotificationsService, 'create'>>;

  beforeEach(() => {
    mockPrisma = {
      utilisateur: {
        findMany: jest.fn(),
      } as any,
    };
    mockNotifications = {
      create: jest.fn().mockResolvedValue({ id_notification: 'uuid-test' }),
    };
    service = new NotificationsOuvertureService(
      mockPrisma as unknown as PrismaService,
      mockNotifications as unknown as NotificationsService,
    );
  });

  describe('notifierOuverturePeriode', () => {
    it('should send one notification per active non-ADMIN user', async () => {
      (mockPrisma.utilisateur.findMany as jest.Mock).mockResolvedValue([
        { matricule: 'MAT01' },
        { matricule: 'MAT02' },
        { matricule: 'MAT03' },
      ]);

      const count = await service.notifierOuverturePeriode('p1', 'P2026-S1', '2026-06-30');

      expect(mockNotifications.create).toHaveBeenCalledTimes(3);
      expect(count).toBe(3);
    });

    it('should query only active (statut=Actif, est_actif=true) non-ADMIN users', async () => {
      (mockPrisma.utilisateur.findMany as jest.Mock).mockResolvedValue([]);

      await service.notifierOuverturePeriode('p1', 'P2026-S1', '2026-06-30');

      expect(mockPrisma.utilisateur.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statut: 'Actif',
            est_actif: true,
            role: { not: 'ADMIN' },
          }),
        }),
      );
    });

    it('should return 0 and log a warning when no active users exist', async () => {
      (mockPrisma.utilisateur.findMany as jest.Mock).mockResolvedValue([]);

      const count = await service.notifierOuverturePeriode('p1', 'P2026-S1', '2026-06-30');

      expect(mockNotifications.create).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });

    it('should create notifications with correct type=info and lien=/evaluations', async () => {
      (mockPrisma.utilisateur.findMany as jest.Mock).mockResolvedValue([
        { matricule: 'MAT01' },
      ]);

      await service.notifierOuverturePeriode('p1', 'P2026-S1', '2026-06-30');

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          destinataire_matricule: 'MAT01',
          type: 'info',
          lien: '/evaluations',
          titre: "Nouvelle période d'évaluation ouverte",
        }),
      );
    });

    it('should include the period name in the notification message', async () => {
      (mockPrisma.utilisateur.findMany as jest.Mock).mockResolvedValue([
        { matricule: 'MAT01' },
      ]);

      await service.notifierOuverturePeriode('p1', 'P2026-S1', '2026-06-30');

      const call = mockNotifications.create.mock.calls[0][0];
      expect(call.message).toContain('P2026-S1');
    });

    it('should continue notifying other users if one create() fails (fire-and-forget)', async () => {
      (mockPrisma.utilisateur.findMany as jest.Mock).mockResolvedValue([
        { matricule: 'MAT01' },
        { matricule: 'MAT02' },
        { matricule: 'MAT03' },
      ]);
      mockNotifications.create
        .mockResolvedValueOnce({ id_notification: '00000000-0000-0000-0000-000000000001' })
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ id_notification: '00000000-0000-0000-0000-000000000003' });

      const count = await service.notifierOuverturePeriode('p1', 'P2026-S1', '2026-06-30');

      // 2 succeeded, 1 failed — count should be 2
      expect(count).toBe(2);
      expect(mockNotifications.create).toHaveBeenCalledTimes(3);
    });
  });
});
