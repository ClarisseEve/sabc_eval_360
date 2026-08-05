import { PeriodesSchedulerService } from './periodes-scheduler.service';
import { getDoualaDate } from './douala-date';

describe('PeriodesSchedulerService', () => {
  let scheduler: PeriodesSchedulerService;
  let mockPg: any;
  let mockPeriodesService: any;
  let mockNotificationsRappelService: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPg = { query: jest.fn() };
    mockPeriodesService = {
      ouvrir: jest.fn().mockResolvedValue({}),
      fermer: jest.fn().mockResolvedValue({}),
      calculateStatistiques: jest.fn().mockResolvedValue({ taux_completion: 80 }),
    };
    mockNotificationsRappelService = {
      envoyerRappelsPeriode: jest.fn().mockResolvedValue(1),
    };
    const mockNotificationsOuvertureService = {
      notifierOuverturePeriode: jest.fn().mockResolvedValue(0),
    };
    mockConfig = {
      get: jest.fn().mockReturnValue('true'),
    };
    scheduler = new PeriodesSchedulerService(
      mockPg as any,
      mockPeriodesService,
      mockNotificationsRappelService,
      mockNotificationsOuvertureService as any,
      mockConfig,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('court-circuite toutes les tâches quand SCHEDULER_ENABLED=false', async () => {
    mockConfig.get.mockReturnValue('false');

    await expect(scheduler.ouvrirPeriodes()).resolves.toEqual({ opened: 0 });
    await expect(scheduler.envoyerRappels()).resolves.toEqual({ sent: 0 });
    await expect(scheduler.fermerPeriodes()).resolves.toEqual({ closed: 0 });

    expect(mockPg.query).not.toHaveBeenCalled();
    expect(mockPeriodesService.ouvrir).not.toHaveBeenCalled();
    expect(mockPeriodesService.fermer).not.toHaveBeenCalled();
    expect(mockNotificationsRappelService.envoyerRappelsPeriode).not.toHaveBeenCalled();
  });

  describe('ouvrirPeriodes', () => {
    it('opens matching planned periods', async () => {
      mockPg.query.mockResolvedValue([{ id_periode: 'p1', nom_periode: 'P2026-S1' }]);
      const result = await scheduler.ouvrirPeriodes();
      expect(mockPeriodesService.ouvrir).toHaveBeenCalledWith('p1');
      expect(result.opened).toBe(1);
      const querySql = String(mockPg.query.mock.calls[0][0]);
      expect(querySql).toContain("statut = 'planifiee'");
      expect(querySql).toContain('est_ouverte = false');
      expect(querySql).toContain('est_cloturee = false');
      expect(querySql).toContain('$1::date BETWEEN date_debut AND date_fin');
      expect(querySql).toContain('NOT EXISTS');
    });

    it('utilise la date civile de Douala même quand le jour UTC diffère', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-05T23:30:00.000Z'));
      mockPg.query.mockResolvedValue([]);

      await scheduler.ouvrirPeriodes();

      expect(mockPg.query).toHaveBeenCalledWith(expect.any(String), ['2026-08-06']);
    });

    it('returns 0 when no periods match today', async () => {
      mockPg.query.mockResolvedValue([]);
      const result = await scheduler.ouvrirPeriodes();
      expect(result.opened).toBe(0);
    });

    it('continues processing if one period fails', async () => {
      mockPg.query.mockResolvedValue([
        { id_periode: 'p1', nom_periode: 'P1' },
        { id_periode: 'p2', nom_periode: 'P2' },
      ]);
      mockPeriodesService.ouvrir.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({});
      const result = await scheduler.ouvrirPeriodes();
      expect(result.opened).toBe(1);
    });
  });

  describe('envoyerRappels', () => {
    it('counts reminders for matching dates', async () => {
      const today = getDoualaDate();
      mockPg.query.mockResolvedValue([
        { id_periode: 'p1', nom_periode: 'P1', date_fin: '2027-01-01', dates_rappels_json: [today] },
      ]);
      const result = await scheduler.envoyerRappels();
      expect(result.sent).toBe(1);
    });

    it('skips periods without matching rappel dates', async () => {
      mockPg.query.mockResolvedValue([
        { id_periode: 'p1', nom_periode: 'P1', date_fin: '2027-01-01', dates_rappels_json: ['2025-01-01'] },
      ]);
      const result = await scheduler.envoyerRappels();
      expect(result.sent).toBe(0);
    });
  });

  describe('fermerPeriodes', () => {
    it('closes matching open periods via fermer() which handles stats internally', async () => {
      mockPg.query.mockResolvedValue([{ id_periode: 'p1', nom_periode: 'P1' }]);
      const result = await scheduler.fermerPeriodes();
      expect(mockPeriodesService.fermer).toHaveBeenCalledWith('p1');
      expect(result.closed).toBe(1);
      const querySql = String(mockPg.query.mock.calls[0][0]);
      expect(querySql).toContain("statut = 'ouverte'");
      expect(querySql).toContain('date_fin <= $1::date');
    });

    it('returns 0 when no periods to close', async () => {
      mockPg.query.mockResolvedValue([]);
      const result = await scheduler.fermerPeriodes();
      expect(result.closed).toBe(0);
    });

    it('continues if one period fails', async () => {
      mockPg.query.mockResolvedValue([
        { id_periode: 'p1', nom_periode: 'P1' },
        { id_periode: 'p2', nom_periode: 'P2' },
      ]);
      mockPeriodesService.fermer.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({});
      const result = await scheduler.fermerPeriodes();
      expect(result.closed).toBe(1);
    });
  });
});
