import { ForbiddenException } from '@nestjs/common';
import { EvaluationPermissionService } from './evaluation-permission.service';

describe('EvaluationPermissionService', () => {
  let service: EvaluationPermissionService;
  let mockEligibility: any;
  let mockAuditLog: any;

  beforeEach(() => {
    mockEligibility = { canEvaluate: jest.fn() };
    mockAuditLog = { log: jest.fn().mockResolvedValue(undefined) };
    service = new EvaluationPermissionService(mockEligibility, mockAuditLog);
  });

  it('logs success and resolves when authorized', async () => {
    mockEligibility.canEvaluate.mockResolvedValue({ autorise: true });
    await service.validateAndLog('EV01', 'TG01', 'subordonnes', '127.0.0.1');
    expect(mockAuditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tentative_evaluation', details_json: expect.objectContaining({ resultat: 'succes' }) }),
    );
  });

  it('logs failure and throws ForbiddenException when denied', async () => {
    mockEligibility.canEvaluate.mockResolvedValue({ autorise: false, raison: 'Rôle DR interdit' });
    await expect(service.validateAndLog('DR01', 'DR01', 'auto', '127.0.0.1')).rejects.toThrow(ForbiddenException);
    expect(mockAuditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tentative_evaluation_bloquee', details_json: expect.objectContaining({ resultat: 'erreur' }) }),
    );
  });

  it('includes EVALUATION_PERMISSION_DENIED code in ForbiddenException', async () => {
    mockEligibility.canEvaluate.mockResolvedValue({ autorise: false, raison: 'Région différente' });
    try {
      await service.validateAndLog('EV01', 'TG01', 'pairs', '10.0.0.1');
    } catch (e: any) {
      expect(e).toBeInstanceOf(ForbiddenException);
      expect(e.getResponse().code).toBe('EVALUATION_PERMISSION_DENIED');
    }
  });

  it('passes correct arguments to eligibility service', async () => {
    mockEligibility.canEvaluate.mockResolvedValue({ autorise: true });
    await service.validateAndLog('EV01', 'TG01', 'pairs', '127.0.0.1');
    expect(mockEligibility.canEvaluate).toHaveBeenCalledWith('EV01', 'TG01', 'pairs');
  });

  it('logs IP address in audit entry', async () => {
    mockEligibility.canEvaluate.mockResolvedValue({ autorise: true });
    await service.validateAndLog('EV01', 'TG01', 'subordonnes', '192.168.1.50');
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ adresse_ip: '192.168.1.50' }));
  });
});
