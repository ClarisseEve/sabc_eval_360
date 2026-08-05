import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { normalizeLoginIdentifier } from '../auth-security';

interface LoginRequestBody {
  identifier?: unknown;
  email?: unknown;
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'identifier', passReqToCallback: true });
  }

  async validate(req: Request, _username: string, password: string) {
    const body = req.body as LoginRequestBody | undefined;
    const identifier = normalizeLoginIdentifier(
      body?.identifier ?? body?.email ?? _username,
    );
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return this.authService.validateUser(identifier, password, ip);
  }
}
