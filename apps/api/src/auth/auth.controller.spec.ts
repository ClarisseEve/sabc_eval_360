import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';

describe('AuthController', () => {
  let controller: AuthController;
  let auditLog: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      me: jest.fn(),
    };

    const mockUsersService = {
      findByMatricule: jest.fn(),
      findByIdentifier: jest.fn(),
    };

    const mockPrismaService = {
      utilisateur: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      logAdministration: {
        create: jest.fn(),
      },
    };

    const mockAuditLogService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    auditLog = module.get(AuditLogService);
  });

  // ─── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('calls auditLog.log with action "logout", adresse_ip, and matricule_utilisateur from JWT sub', async () => {
      const req = {
        user: { sub: 'MAT01', matricule: 'MAT01' },
        ip: '127.0.0.1',
      };

      const result = await controller.logout(req);

      expect(auditLog.log).toHaveBeenCalledTimes(1);
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          matricule_utilisateur: 'MAT01',
          action: 'logout',
          entite: 'auth',
          adresse_ip: '127.0.0.1',
        }),
      );

      expect(result).toEqual({ message: 'Déconnexion réussie' });
    });

    it('uses req.user.sub as matricule_utilisateur when both sub and matricule are present', async () => {
      const req = {
        user: { sub: 'SUB_MAT', matricule: 'OTHER_MAT' },
        ip: '10.0.0.5',
      };

      await controller.logout(req);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          matricule_utilisateur: 'SUB_MAT',
          adresse_ip: '10.0.0.5',
        }),
      );
    });

    it('falls back to "unknown" adresse_ip when req.ip is falsy', async () => {
      const req = {
        user: { sub: 'MAT01' },
        ip: undefined,
      };

      await controller.logout(req);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          adresse_ip: 'unknown',
        }),
      );
    });
  });
});
