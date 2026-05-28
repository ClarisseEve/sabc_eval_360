import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import * as bcrypt from 'bcryptjs';

describe('AuthController', () => {
  let controller: AuthController;
  let auditLog: jest.Mocked<AuditLogService>;
  let usersService: jest.Mocked<UsersService>;
  let prisma: {
    utilisateur: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

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
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    prisma = module.get(PrismaService) as any;
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

  // ─── updateProfile ──────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('nominal: updates nom/prenom/email, calls prisma.utilisateur.update, returns profile', async () => {
      const req = { user: { matricule: 'MAT001' } };
      const body = { nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@sabc.cm' };
      const updatedProfile = { matricule: 'MAT001', nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@sabc.cm' };

      prisma.utilisateur.findFirst.mockResolvedValue(null); // no duplicate
      prisma.utilisateur.update.mockResolvedValue(undefined);
      usersService.findByMatricule.mockResolvedValue(updatedProfile as any);

      const result = await controller.updateProfile(req, body as any);

      expect(prisma.utilisateur.findFirst).toHaveBeenCalledWith({
        where: { email: 'jean.dupont@sabc.cm', matricule: { not: 'MAT001' } },
      });
      expect(prisma.utilisateur.update).toHaveBeenCalledWith({
        where: { matricule: 'MAT001' },
        data: expect.objectContaining({ nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@sabc.cm' }),
      });
      expect(usersService.findByMatricule).toHaveBeenCalledWith('MAT001');
      expect(result).toEqual(updatedProfile);
    });

    it('duplicate email: throws BadRequestException("Cet email est déjà utilisé")', async () => {
      const req = { user: { matricule: 'MAT001' } };
      const body = { email: 'taken@sabc.cm' };

      prisma.utilisateur.findFirst.mockResolvedValue({ matricule: 'OTHER', email: 'taken@sabc.cm' });

      await expect(controller.updateProfile(req, body as any)).rejects.toThrow(
        new BadRequestException('Cet email est déjà utilisé'),
      );

      expect(prisma.utilisateur.update).not.toHaveBeenCalled();
    });
  });

  // ─── updatePassword ─────────────────────────────────────────────────────────

  describe('updatePassword', () => {
    it('nominal: correct current password + matching new password → updates and returns success message', async () => {
      const req = { user: { matricule: 'MAT001' } };
      const currentPassword = 'current-password';
      const hashedCurrent = bcrypt.hashSync(currentPassword, 10);
      const body = {
        current_password: currentPassword,
        password: 'newpassword',
        password_confirmation: 'newpassword',
      };

      prisma.utilisateur.findUnique.mockResolvedValue({ matricule: 'MAT001', password: hashedCurrent });
      prisma.utilisateur.update.mockResolvedValue(undefined);

      const result = await controller.updatePassword(req, body as any);

      expect(prisma.utilisateur.update).toHaveBeenCalledWith({
        where: { matricule: 'MAT001' },
        data: expect.objectContaining({ password: expect.any(String) }),
      });
      expect(result).toEqual({ message: 'Mot de passe mis à jour avec succès' });
    });

    it('incorrect current password → throws BadRequestException("Mot de passe actuel incorrect")', async () => {
      const req = { user: { matricule: 'MAT001' } };
      const body = {
        current_password: 'wrong-password',
        password: 'newpassword',
        password_confirmation: 'newpassword',
      };

      prisma.utilisateur.findUnique.mockResolvedValue({
        matricule: 'MAT001',
        password: bcrypt.hashSync('correct-password', 10),
      });

      await expect(controller.updatePassword(req, body as any)).rejects.toThrow(
        new BadRequestException('Mot de passe actuel incorrect'),
      );

      expect(prisma.utilisateur.update).not.toHaveBeenCalled();
    });

    it('mismatched new passwords → throws BadRequestException("Les mots de passe ne correspondent pas")', async () => {
      const req = { user: { matricule: 'MAT001' } };
      const body = {
        current_password: 'any',
        password: 'newpassword',
        password_confirmation: 'different',
      };

      await expect(controller.updatePassword(req, body as any)).rejects.toThrow(
        new BadRequestException('Les mots de passe ne correspondent pas'),
      );

      expect(prisma.utilisateur.findUnique).not.toHaveBeenCalled();
      expect(prisma.utilisateur.update).not.toHaveBeenCalled();
    });
  });
});
