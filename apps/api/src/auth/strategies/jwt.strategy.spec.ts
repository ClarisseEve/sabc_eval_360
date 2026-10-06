import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../common/cache.service';
import { UsersService } from '../../users/users.service';
import { createPasswordFingerprint, jwtBlacklistKey } from '../auth-security';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const jwtSecret = 'test-jwt-secret';
  const passwordHash = '$2b$10$current-password-hash';
  const payload = {
    sub: 'MAT01',
    email: 'stale@sabc.cm',
    role: 'STALE_ROLE',
    is_admin: false,
    password_fingerprint: createPasswordFingerprint(passwordHash, jwtSecret),
    jti: 'session-id',
    exp: 1_900_000_000,
  };
  const request = { method: 'GET', path: '/api/analytics/dashboard' } as any;

  let users: { findAuthByMatricule: jest.Mock };
  let cache: { get: jest.Mock };
  let strategy: JwtStrategy;

  beforeEach(() => {
    users = {
      findAuthByMatricule: jest.fn().mockResolvedValue({
        matricule: 'MAT01',
        email: 'current@sabc.cm',
        role: 'MANAGER',
        est_admin: true,
        est_actif: true,
        statut: 'Actif',
        password: passwordHash,
        password_change_required: false,
      }),
    };
    cache = { get: jest.fn().mockResolvedValue(null) };
    const config = { get: jest.fn().mockReturnValue(jwtSecret) };
    strategy = new JwtStrategy(
      config as unknown as ConfigService,
      users as unknown as UsersService,
      cache as unknown as CacheService,
    );
  });

  it('reloads and returns the current email, role, and admin flag', async () => {
    await expect(strategy.validate(request, payload)).resolves.toEqual({
      matricule: 'MAT01',
      email: 'current@sabc.cm',
      role: 'MANAGER',
      is_admin: true,
      password_change_required: false,
      jti: 'session-id',
      exp: 1_900_000_000,
    });
    expect(users.findAuthByMatricule).toHaveBeenCalledWith('MAT01');
  });

  it('rejects a blacklisted logout token before querying the user', async () => {
    cache.get.mockResolvedValue(true);

    await expect(strategy.validate(request, payload)).rejects.toThrow(
      'Session révoquée',
    );

    expect(cache.get).toHaveBeenCalledWith(jwtBlacklistKey('session-id'));
    expect(users.findAuthByMatricule).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', null],
    [
      'inactive',
      {
        matricule: 'MAT01',
        email: 'user@sabc.cm',
        role: 'AGENT',
        est_admin: false,
        est_actif: false,
        statut: 'Inactif',
        password: passwordHash,
      },
    ],
    [
      'suspended',
      {
        matricule: 'MAT01',
        email: 'user@sabc.cm',
        role: 'AGENT',
        est_admin: false,
        est_actif: true,
        statut: 'Suspendu',
        password: passwordHash,
      },
    ],
  ])('rejects a %s current account', async (_label, currentUser) => {
    users.findAuthByMatricule.mockResolvedValue(currentUser);

    await expect(strategy.validate(request, payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects the old JWT immediately after the password hash changes', async () => {
    users.findAuthByMatricule.mockResolvedValue({
      matricule: 'MAT01',
      email: 'current@sabc.cm',
      role: 'MANAGER',
      est_admin: true,
      est_actif: true,
      statut: 'Actif',
      password: '$2b$10$new-password-hash',
    });

    await expect(strategy.validate(request, payload)).rejects.toThrow(
      'Session invalide',
    );
  });

  it('rejects legacy tokens without jti or password fingerprint', async () => {
    await expect(
      strategy.validate(request, { ...payload, jti: undefined } as any),
    ).rejects.toThrow('Session invalide');
    await expect(
      strategy.validate(request, { ...payload, password_fingerprint: undefined } as any),
    ).rejects.toThrow('Session invalide');
  });

  it('blocks normal API routes until the initial password is changed', async () => {
    users.findAuthByMatricule.mockResolvedValue({
      matricule: 'MAT01',
      email: 'current@sabc.cm',
      role: 'AGENT',
      id_region: 'LT',
      est_admin: false,
      est_actif: true,
      statut: 'Actif',
      password: passwordHash,
      password_change_required: true,
    });

    await expect(strategy.validate(request, payload)).rejects.toThrow(ForbiddenException);
  });
});
