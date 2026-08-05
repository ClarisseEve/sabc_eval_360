import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  const dashboardService = {
    getRoleTitle: jest.fn((role: string) => `Dashboard ${role}`),
    getAdminStats: jest.fn().mockResolvedValue({ admin: true }),
    getStats: jest.fn().mockResolvedValue({ admin: false }),
  };
  const managerService = {};
  const collaborateurService = {};
  let controller: DashboardController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DashboardController(
      dashboardService as any,
      managerService as any,
      collaborateurService as any,
    );
  });

  it('ne traite pas un utilisateur sans rôle comme administrateur', async () => {
    const result = await controller.getMyDashboard({
      user: { matricule: 'MAT001', is_admin: false },
    } as any);

    expect(result.role).toBe('collaborateur');
    expect(dashboardService.getStats).toHaveBeenCalledWith('MAT001');
    expect(dashboardService.getAdminStats).not.toHaveBeenCalled();
  });

  it('conserve le dashboard admin si le marqueur admin explicite est présent', async () => {
    const result = await controller.getMyDashboard({
      user: { matricule: 'ADM001', is_admin: true },
    } as any);

    expect(result.role).toBe('admin');
    expect(dashboardService.getAdminStats).toHaveBeenCalledWith('ADM001');
    expect(dashboardService.getStats).not.toHaveBeenCalled();
  });
});
