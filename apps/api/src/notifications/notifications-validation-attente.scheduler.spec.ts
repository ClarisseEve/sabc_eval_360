import { NotificationsValidationAttenteScheduler } from './notifications-validation-attente.scheduler';

describe('NotificationsValidationAttenteScheduler', () => {
  const notificationsService = {
    notifierManagersAttente: jest.fn(),
  };
  const config = { get: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('true');
    notificationsService.notifierManagersAttente.mockResolvedValue(0);
  });

  it('ne notifie personne quand le scheduler est désactivé', async () => {
    config.get.mockReturnValue('false');
    const scheduler = new NotificationsValidationAttenteScheduler(
      notificationsService as any,
      config as any,
    );

    await scheduler.notifierManagersEnAttente();

    expect(notificationsService.notifierManagersAttente).not.toHaveBeenCalled();
  });

  it('notifie les managers quand le scheduler est activé', async () => {
    const scheduler = new NotificationsValidationAttenteScheduler(
      notificationsService as any,
      config as any,
    );

    await scheduler.notifierManagersEnAttente();

    expect(notificationsService.notifierManagersAttente).toHaveBeenCalledTimes(1);
  });
});
