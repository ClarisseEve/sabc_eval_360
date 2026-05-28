import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CacheService } from '../common/cache.service';
import * as bcrypt from 'bcryptjs';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 900; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private auditLog: AuditLogService,
    private cache: CacheService,
  ) {}

  private attemptsKey(identifier: string): string {
    return `login_attempts:${identifier}`;
  }

  async validateUser(identifier: string, password: string, ip: string = 'unknown') {
    // Check lockout
    const key = this.attemptsKey(identifier);
    const attempts = await this.cache.get<number>(key);
    if (attempts !== null && attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.auditLog.log({
        matricule_utilisateur: null,
        action: 'login_blocked',
        entite: 'auth',
        adresse_ip: ip,
        details_json: { identifier, reason: 'account_locked' },
      });
      throw new UnauthorizedException('Compte temporairement verrouillé (15 minutes)');
    }

    // Find user
    const user = await this.users.findByIdentifier(identifier);
    if (!user) {
      const newAttempts = (attempts ?? 0) + 1;
      await this.cache.set(key, newAttempts, LOCKOUT_TTL_SECONDS);
      await this.auditLog.log({
        matricule_utilisateur: null,
        action: 'login_failed',
        entite: 'auth',
        adresse_ip: ip,
        details_json: { identifier, reason: 'unknown_user', attempts: newAttempts },
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Check if user is active
    if (!user.est_actif) {
      await this.auditLog.log({
        matricule_utilisateur: user.matricule,
        action: 'login_failed',
        entite: 'auth',
        adresse_ip: ip,
        details_json: { identifier, reason: 'inactive_user' },
      });
      throw new UnauthorizedException('Compte désactivé');
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
        details_json: { identifier, reason: 'invalid_password', attempts: newAttempts },
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
      details_json: { identifier },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: { matricule: string; email: string; role: string; est_admin: boolean }) {
    return {
      access_token: this.jwt.sign({
        sub: user.matricule,
        email: user.email,
        role: user.role,
        is_admin: user.est_admin,
      }),
      user: {
        matricule: user.matricule,
        email: user.email,
        role: user.role,
        is_admin: user.est_admin,
      },
    };
  }

  async me(matricule: string) {
    return this.users.findByMatricule(matricule);
  }
}
