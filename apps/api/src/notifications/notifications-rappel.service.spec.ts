import { NotificationsRappelService } from './notifications-rappel.service';
import { DatabasePgService } from '../database/database-pg.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsRappelService', () => {
  let service: NotificationsRappelService;
  let mockPg: jest.Mocked<Pick<DatabasePgService, 'query'>>;
  let mockNotifications: jest.Mocked<Pick<NotificationsService, 'notifierRappelEvaluation'>>;

  beforeEach(() => {
    mockPg = {
      query: jest.fn(),
    };
    mockNotifications = {
      notifierRappelEvaluation: jest.fn().mockResolvedValue({ id_notification: 'uuid-1' }),
    };
    service = new NotificationsRappelService(
      mockPg as unknown as DatabasePgService,
      mockNotifications as unknown as NotificationsService,
    );
  });

  describe('envoyerRappelsPeriode', () => {
    it('should send one reminder per distinct evaluateur in brouillon', async () => {
      mockPg.query.mockResolvedValue([
        { evaluateur_matricule: 'MAT001' },
        { evaluateur_matricule: 'MAT002' },
      ]);

      const count = await service.envoyerRappelsPeriode('p1', 'P2026-S1', '2026-06-30', 7);

      expect(mockNotifications.notifierRappelEvaluation).toHaveBeenCalledTimes(2);
      expect(count).toBe(2);
    });

    it('should pass the correct joursRestants to notifierRappelEvaluation', async () => {
      mockPg.query.mockResolvedValue([{ evaluateur_matricule: 'MAT003' }]);

      await service.envoyerRappelsPeriode('p1', 'P2026-S1', '2026-06-30', 3);

      expect(mockNotifications.notifierRappelEvaluation).toHaveBeenCalledWith('MAT003', 3);
    });

    it('should return 0 when there are no brouillon evaluations', async () => {
      mockPg.query.mockResolvedValue([]);

      const count = await service.envoyerRappelsPeriode('p1', 'P2026-S1', '2026-06-30', 7);

      expect(mockNotifications.notifierRappelEvaluation).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });

    it('should return the correct count matching the number of evaluateurs', async () => {
      mockPg.query.mockResolvedValue([
        { evaluateur_matricule: 'MAT001' },
        { evaluateur_matricule: 'MAT002' },
        { evaluateur_matricule: 'MAT003' },
      ]);

      const count = await service.envoyerRappelsPeriode('p1', 'P2026-S1', '2026-06-30', 1);

      expect(count).toBe(3);
    });

    it('should propagate a PostgreSQL error', async () => {
      mockPg.query.mockRejectedValue(new Error('PG connection error'));

      await expect(
        service.envoyerRappelsPeriode('p1', 'P2026-S1', '2026-06-30', 7),
      ).rejects.toThrow('PG connection error');
    });

    it('should query using the correct idPeriode', async () => {
      mockPg.query.mockResolvedValue([]);

      await service.envoyerRappelsPeriode('periode-abc-123', 'P2026-S1', '2026-06-30', 3);

      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('evaluations'),
        ['periode-abc-123'],
      );
      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'brouillon'"),
        expect.any(Array),
      );
    });
  });
});
