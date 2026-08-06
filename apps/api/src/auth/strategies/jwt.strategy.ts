import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { CacheService } from '../../common/cache.service';
import {
  createPasswordFingerprint,
  jwtBlacklistKey,
  passwordFingerprintMatches,
} from '../auth-security';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  is_admin: boolean;
  password_fingerprint: string;
  jti: string;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly jwtSecret: string;

  constructor(
    config: ConfigService,
    private readonly users: UsersService,
    private readonly cache: CacheService,
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
    });
    this.jwtSecret = jwtSecret;
  }

  async validate(payload: JwtPayload) {
    if (
      typeof payload?.sub !== 'string' ||
      typeof payload?.jti !== 'string' ||
      typeof payload?.exp !== 'number'
    ) {
      throw new UnauthorizedException('Session invalide');
    }

    const blacklisted = await this.cache.get<boolean>(
      jwtBlacklistKey(payload.jti),
    );
    if (blacklisted) {
      throw new UnauthorizedException('Session révoquée');
    }

    const currentUser = await this.users.findAuthByMatricule(payload.sub);
    if (
      !currentUser ||
      !currentUser.est_actif ||
      currentUser.statut !== 'Actif'
    ) {
      throw new UnauthorizedException('Compte indisponible');
    }

    const expectedFingerprint = createPasswordFingerprint(
      currentUser.password,
      this.jwtSecret,
    );
    if (
      !passwordFingerprintMatches(
        payload.password_fingerprint,
        expectedFingerprint,
      )
    ) {
      throw new UnauthorizedException('Session invalide');
    }

    return {
      matricule: currentUser.matricule,
      email: currentUser.email,
      role: currentUser.role,
      id_region: currentUser.id_region,
      is_admin: currentUser.est_admin,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
