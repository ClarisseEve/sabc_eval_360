import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CacheService } from '../common/cache.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let auditLog: jest.Mocked<AuditLogService>;
  let cache: jest.Mocked<CacheService>;

  let hashedPassword: string;

  const mockUser = {
    matricule: 'MAT001',
    email: 'user@sabc.cm',
    password: '', // will be set in beforeAll
    role: 'AGENT',
    role_nom: 'Agent',
    est_actif: true,
    est_admin: false,
    nom: 'Dupont',
    prenom: 'Jean',
    photo_url: null,
    id_region: 1,
    id_branche: 1,
    created_at: new Date(),
    updated_at: new Date(),
    manager_matricule: null,
  };

  beforeAll(async () => {
    hashedPassword = bcrypt.hashSync('correct-password', 10);
  });

  beforeEach(async () => {
    const mockUsersService = {
      findByIdentifier: jest.fn(),
      findByMatricule: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockAuditLogService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    auditLog = module.get(AuditLogService);
    cache = module.get(CacheService);

    // Set hashed password on the mock user
    mockUser.password = hashedPassword;
  });

  // ─── validateUser ───────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('valid credentials → returns user without password, logs login_success, resets counter', async () => {
      cache.get.mockResolvedValue(null); // no prior attempts
      usersService.findByIdentifier.mockResolvedValue({ ...mockUser });

      const result = await service.validateUser('MAT001', 'correct-password', '127.0.0.1');

      // No password in result
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({
        matricule: 'MAT001',
        email: 'user@sabc.cm',
        role: 'AGENT',
      });

      // Counter reset: set(key, 0, 1)
      expect(cache.set).toHaveBeenCalledWith('login_attempts:MAT001', 0, 1);

      // Login success logged
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_success',
          matricule_utilisateur: 'MAT001',
          entite: 'auth',
          adresse_ip: '127.0.0.1',
        }),
      );
    });

    it('wrong password → throws UnauthorizedException, logs login_failed, increments counter', async () => {
      cache.get.mockResolvedValue(2); // 2 prior attempts
      usersService.findByIdentifier.mockResolvedValue({ ...mockUser });

      await expect(
        service.validateUser('MAT001', 'wrong-password', '10.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      // Counter incremented to 3
      expect(cache.set).toHaveBeenCalledWith('login_attempts:MAT001', 3, 900);

      // login_failed logged with reason invalid_password
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          matricule_utilisateur: 'MAT001',
          entite: 'auth',
          adresse_ip: '10.0.0.1',
          details_json: expect.objectContaining({ reason: 'invalid_password', attempts: 3 }),
        }),
      );
    });

    it('unknown user → throws UnauthorizedException, logs login_failed with reason unknown_user', async () => {
      cache.get.mockResolvedValue(null);
      usersService.findByIdentifier.mockResolvedValue(null);

      await expect(
        service.validateUser('unknown@sabc.cm', 'any-password', '192.168.1.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          matricule_utilisateur: null,
          entite: 'auth',
          adresse_ip: '192.168.1.1',
          details_json: expect.objectContaining({ reason: 'unknown_user' }),
        }),
      );
    });

    it('locked account (5 attempts in cache) → throws with lockout message, never calls findByIdentifier', async () => {
      cache.get.mockResolvedValue(5); // at limit

      await expect(
        service.validateUser('MAT001', 'any-password', '10.0.0.2'),
      ).rejects.toThrow('Compte temporairement verrouillé (15 minutes)');

      // Must NOT reach DB lookup
      expect(usersService.findByIdentifier).not.toHaveBeenCalled();

      // login_blocked logged
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_blocked',
          matricule_utilisateur: null,
          entite: 'auth',
          adresse_ip: '10.0.0.2',
          details_json: expect.objectContaining({ reason: 'account_locked' }),
        }),
      );
    });

    it('inactive user (est_actif = false) → throws UnauthorizedException, logs login_failed with reason inactive_user', async () => {
      cache.get.mockResolvedValue(null);
      usersService.findByIdentifier.mockResolvedValue({ ...mockUser, est_actif: false });

      await expect(
        service.validateUser('MAT001', 'correct-password', '10.0.0.3'),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          matricule_utilisateur: 'MAT001',
          entite: 'auth',
          adresse_ip: '10.0.0.3',
          details_json: expect.objectContaining({ reason: 'inactive_user' }),
        }),
      );

      // Counter must NOT be incremented for inactive users
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns access_token and user object with expected fields', async () => {
      const inputUser = {
        matricule: 'MAT001',
        email: 'user@sabc.cm',
        role: 'AGENT',
        est_admin: false,
      };

      const result = await service.login(inputUser);

      expect(result).toMatchObject({
        access_token: expect.any(String),
        user: {
          matricule: 'MAT001',
          email: 'user@sabc.cm',
          role: 'AGENT',
          is_admin: false,
        },
      });

      // JWT signed with correct payload
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'MAT001',
        email: 'user@sabc.cm',
        role: 'AGENT',
        is_admin: false,
      });
    });
  });

  // ─── me ─────────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('delegates to usersService.findByMatricule with the given matricule', async () => {
      const profile = { matricule: 'MAT001', nom: 'Dupont', prenom: 'Jean', email: 'user@sabc.cm', role: 'AGENT' };
      usersService.findByMatricule.mockResolvedValue(profile as any);

      const result = await service.me('MAT001');

      expect(usersService.findByMatricule).toHaveBeenCalledWith('MAT001');
      expect(result).toEqual(profile);
    });
  });
});
