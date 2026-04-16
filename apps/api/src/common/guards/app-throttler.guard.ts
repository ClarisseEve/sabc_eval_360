import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

function decodeJwtSubject(authorization?: string): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload?.sub === 'string' && payload.sub.trim().length > 0 ? payload.sub.trim() : null;
  } catch {
    return null;
  }
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;
    const ip = forwardedIp || req.ip || req.socket?.remoteAddress || 'unknown';

    const url = String(req.originalUrl || req.url || '');
    if (url.includes('/api/auth/login')) {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'anonymous';
      return `login:${email}:${ip}`;
    }

    const subject = decodeJwtSubject(req.headers?.authorization);
    if (subject) {
      return `user:${subject}`;
    }

    return `ip:${ip}`;
  }
}
