import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CacheService } from '../common/cache.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import {
  createPasswordFingerprint,
  jwtBlacklistKey,
  normalizeLoginIdentifier,
} from './auth-security';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 900; // 15 minutes

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private auditLog: AuditLogService,
    private cache: CacheService,
    config: ConfigService,
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }
    this.jwtSecret = jwtSecret;
  }

  private attemptsKey(identifier: string): string {
    return `login_attempts:${identifier}`;
  }

  async validateUser(
    identifier: string,
    password: string,
    ip: string = 'unknown',
  ) {
    const normalizedIdentifier =
      normalizeLoginIdentifier(identifier) || 'anonymous';

    // Check lockout
    const key = this.attemptsKey(normalizedIdentifier);
    const attempts = await this.cache.get<number>(key);
    if (attempts !== null && attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.auditLog.log({
        matricule_utilisateur: null,
        action: 'login_blocked',
        entite: 'auth',
        adresse_ip: ip,
        details_json: {
          identifier: normalizedIdentifier,
          reason: 'account_locked',
        },
      });
      throw new UnauthorizedException(
        'Compte temporairement verrouillé (15 minutes)',
      );
    }

    // Find user
    const user = await this.users.findByIdentifier(normalizedIdentifier);
    if (!user) {
      const newAttempts = (attempts ?? 0) + 1;
      await this.cache.set(key, newAttempts, LOCKOUT_TTL_SECONDS);
      await this.auditLog.log({
        matricule_utilisateur: null,
        action: 'login_failed',
        entite: 'auth',
        adresse_ip: ip,
        details_json: {
          identifier: normalizedIdentifier,
          reason: 'unknown_user',
          attempts: newAttempts,
        },
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Check if user is active
    if (!user.est_actif || user.statut !== 'Actif') {
      const suspended = user.statut === 'Suspendu';
      await this.auditLog.log({
        matricule_utilisateur: user.matricule,
        action: 'login_failed',
        entite: 'auth',
        adresse_ip: ip,
        details_json: {
          identifier: normalizedIdentifier,
          reason: suspended ? 'suspended_user' : 'inactive_user',
        },
      });
      throw new UnauthorizedException(
        suspended ? 'Compte suspendu' : 'Compte désactivé',
      );
    }

    // Validate password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const newAttempts = (attempts ?? 0) + 1;
      await this.cache.set(key, newAttempts, LOCKOUT_TTL_SECONDS);
      await this.auditLog.log({
        matricule_utilisateur: user.matricule,
        action: 'login_failed',
        entite: 'auth',
        adresse_ip: ip,
        details_json: {
          identifier: normalizedIdentifier,
          reason: 'invalid_password',
          attempts: newAttempts,
        },
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Success: reset counter and log
    await this.cache.set(key, 0, 1); // set to 0 with short TTL to effectively delete
    await this.auditLog.log({
      matricule_utilisateur: user.matricule,
      action: 'login_success',
      entite: 'auth',
      adresse_ip: ip,
      details_json: { identifier: normalizedIdentifier },
    });

    return {
      matricule: user.matricule,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      role_nom: user.role_nom,
      est_actif: user.est_actif,
      est_admin: user.est_admin,
      statut: user.statut,
    };
  }

  async login(user: {
    matricule: string;
    email: string;
    role: string;
    est_admin: boolean;
  }) {
    const currentUser = await this.users.findAuthByMatricule(user.matricule);
    if (
      !currentUser ||
      !currentUser.est_actif ||
      currentUser.statut !== 'Actif'
    ) {
      throw new UnauthorizedException('Compte indisponible');
    }

    const jti = randomUUID();
    return {
      access_token: this.jwt.sign({
        sub: currentUser.matricule,
        email: currentUser.email,
        role: currentUser.role,
        is_admin: currentUser.est_admin,
        password_fingerprint: createPasswordFingerprint(
          currentUser.password,
          this.jwtSecret,
        ),
        jti,
      }),
      user: {
        matricule: currentUser.matricule,
        email: currentUser.email,
        role: currentUser.role,
        is_admin: currentUser.est_admin,
      },
    };
  }

  async logout(token: { jti: string; exp: number }): Promise<void> {
    const ttlSeconds = token.exp - Math.floor(Date.now() / 1000);
    if (ttlSeconds > 0) {
      await this.cache.set(jwtBlacklistKey(token.jti), true, ttlSeconds);
    }
  }

  async me(matricule: string) {
    return this.users.findByMatricule(matricule);
  }
}
