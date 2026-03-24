import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $queryRawUnsafe: jest.fn(),
    };
    service = new NotificationsService(mockPrisma);
  });

  describe('create', () => {
    it('should create a notification and return its id', async () => {
      const result = await service.create({
        destinataire_matricule: 'MAT001',
        titre: 'Test',
        message: 'Hello',
        type: 'info',
      });
      expect(result.id_notification).toBeDefined();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('countNonLues', () => {
    it('should return unread count', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(7) }]);
      const count = await service.countNonLues('MAT001');
      expect(count).toBe(7);
    });

    it('should return 0 when no results', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
      const count = await service.countNonLues('MAT002');
      expect(count).toBe(0);
    });
  });

  describe('marquerCommeLue', () => {
    it('should mark notification as read', async () => {
      const result = await service.marquerCommeLue('notif-uuid');
      expect(result.success).toBe(true);
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('est_lu = 1'),
        'notif-uuid',
      );
    });
  });

  describe('notifierNouvelleEvaluation', () => {
    it('should create evaluation notification', async () => {
      const result = await service.notifierNouvelleEvaluation('MAT002', 'MAT001');
      expect(result.id_notification).toBeDefined();
      const call = mockPrisma.$executeRawUnsafe.mock.calls[0];
      expect(call).toContain('MAT002'); // destinataire
      expect(call).toContain('MAT001'); // expediteur
    });
  });

  describe('notifierRappelEvaluation', () => {
    it('should create reminder notification', async () => {
      const result = await service.notifierRappelEvaluation('MAT003', 3);
      expect(result.id_notification).toBeDefined();
    });
  });
});
