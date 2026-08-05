import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import { normalizeLoginIdentifier } from '../../auth/auth-security';

interface TrackedRequest {
  ip?: unknown;
  socket?: { remoteAddress?: unknown };
  originalUrl?: unknown;
  url?: unknown;
  body?: { identifier?: unknown; email?: unknown };
  headers?: { authorization?: unknown };
}

function bearerFingerprint(authorization: unknown): string | null {
  if (typeof authorization !== 'string') return null;
  const match = authorization.trim().match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;
  return createHash('sha256').update(match[1], 'utf8').digest('hex');
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const request = req as unknown as TrackedRequest;
    // Express computes req.ip from the explicitly configured trusted proxy hop.
    // Reading X-Forwarded-For directly here would allow clients to choose their key.
    const ip =
      (typeof request.ip === 'string' && request.ip) ||
      (typeof request.socket?.remoteAddress === 'string' &&
        request.socket.remoteAddress) ||
      'unknown';

    const url =
      (typeof request.originalUrl === 'string' && request.originalUrl) ||
      (typeof request.url === 'string' && request.url) ||
      '';
    if (url.includes('/api/auth/login')) {
      const identifier =
        normalizeLoginIdentifier(
          request.body?.identifier ?? request.body?.email,
        ) || 'anonymous';
      return Promise.resolve(`login:${identifier}:${ip}`);
    }

    // APP_GUARD runs before route JwtAuthGuard, so req.user is not reliable here.
    // Hashing the opaque token gives stable per-session quotas without storing it.
    const tokenFingerprint = bearerFingerprint(request.headers?.authorization);
    if (tokenFingerprint) {
      return Promise.resolve(`token:${tokenFingerprint}`);
    }

    return Promise.resolve(`ip:${ip}`);
  }
}
