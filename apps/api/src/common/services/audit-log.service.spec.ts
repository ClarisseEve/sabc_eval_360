import { AuditLogService, AuditLogEntry } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      logAdministration: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    service = new AuditLogService(mockPrisma);
  });

  it('should log a successful action with required fields', async () => {
    const entry: AuditLogEntry = {
      matricule_utilisateur: 'ADM01',
      action: 'LOGIN',
      entite: 'auth',
      adresse_ip: '192.168.1.1',
    };

    await service.log(entry);

    expect(mockPrisma.logAdministration.create).toHaveBeenCalledTimes(1);
    const call = mockPrisma.logAdministration.create.mock.calls[0][0];
    expect(call.data.matricule_utilisateur).toBe('ADM01');
    expect(call.data.action).toBe('LOGIN');
    expect(call.data.entite).toBe('auth');
    expect(call.data.adresse_ip).toBe('192.168.1.1');
    expect(call.data.created_at).toBeInstanceOf(Date);
    expect(call.data.updated_at).toBeInstanceOf(Date);
    expect(call.data.id_log).toBeDefined();
    expect(typeof call.data.id_log).toBe('string');
    expect(call.data.id_log.length).toBeLessThanOrEqual(5);
  });

  it('should log an action with details_json and id_entite', async () => {
    const details = { motif: 'echec authentification', tentatives: 3 };
    const entry: AuditLogEntry = {
      matricule_utilisateur: 'USR02',
      action: 'LOGIN_FAILED',
      entite: 'auth',
      adresse_ip: '10.0.0.5',
      id_entite: 'USR02',
      details_json: details,
    };

    await service.log(entry);

    const call = mockPrisma.logAdministration.create.mock.calls[0][0];
    expect(call.data.details_json).toEqual(details);
    expect(call.data.id_entite).toBe('USR02');
  });

  it('should log with user_agent when provided', async () => {
    const entry: AuditLogEntry = {
      matricule_utilisateur: null,
      action: 'ROLE_UPDATE',
      entite: 'role',
      adresse_ip: '172.16.0.1',
      id_entite: 'DR',
      user_agent: 'Mozilla/5.0',
      details_json: { ancien_nom: 'DR', nouveau_nom: 'Directeur' },
    };

    await service.log(entry);

    const call = mockPrisma.logAdministration.create.mock.calls[0][0];
    expect(call.data.matricule_utilisateur).toBeNull();
    expect(call.data.user_agent).toBe('Mozilla/5.0');
    expect(call.data.details_json).toEqual({ ancien_nom: 'DR', nouveau_nom: 'Directeur' });
  });

  it('should NOT throw on database failure (fire-and-forget)', async () => {
    mockPrisma.logAdministration.create.mockRejectedValue(
      new Error('DB connection lost'),
    );

    const entry: AuditLogEntry = {
      matricule_utilisateur: 'ADM01',
      action: 'DELETE_USER',
      entite: 'utilisateur',
      adresse_ip: '192.168.1.1',
    };

    // Should resolve without throwing
    await expect(service.log(entry)).resolves.toBeUndefined();
  });

  it('should default optional fields to null', async () => {
    const entry: AuditLogEntry = {
      matricule_utilisateur: 'ADM01',
      action: 'VIEW',
      entite: 'dashboard',
      adresse_ip: '127.0.0.1',
    };

    await service.log(entry);

    const call = mockPrisma.logAdministration.create.mock.calls[0][0];
    expect(call.data.id_entite).toBeNull();
    expect(call.data.details_json).toBeNull();
    expect(call.data.user_agent).toBeNull();
  });
});
