import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { AppThrottlerGuard } from './app-throttler.guard';

class TestAppThrottlerGuard extends AppThrottlerGuard {
  tracker(req: Record<string, any>) {
    return this.getTracker(req);
  }
}

describe('AppThrottlerGuard', () => {
  const guard = new TestAppThrottlerGuard([], {} as any, new Reflector());

  it('uses normalized identifier and req.ip for login', async () => {
    await expect(
      guard.tracker({
        originalUrl: '/api/auth/login',
        body: { identifier: '  User@SABC.CM ', email: 'ignored@sabc.cm' },
        ip: '203.0.113.7',
        headers: { 'x-forwarded-for': '198.51.100.99' },
      }),
    ).resolves.toBe('login:user@sabc.cm:203.0.113.7');
  });

  it('falls back to normalized email when identifier is absent', async () => {
    await expect(
      guard.tracker({
        originalUrl: '/api/auth/login',
        body: { email: '  Agent@SABC.CM ' },
        ip: '203.0.113.8',
      }),
    ).resolves.toBe('login:agent@sabc.cm:203.0.113.8');
  });

  it('does not read an untrusted X-Forwarded-For value directly', async () => {
    await expect(
      guard.tracker({
        originalUrl: '/api/health',
        ip: '203.0.113.9',
        headers: { 'x-forwarded-for': '1.2.3.4' },
      }),
    ).resolves.toBe('ip:203.0.113.9');
  });

  it('uses a SHA-256 fingerprint for a non-login Bearer token', async () => {
    const token = 'header.payload.signature';
    const fingerprint = createHash('sha256')
      .update(token, 'utf8')
      .digest('hex');

    const tracker = await guard.tracker({
      originalUrl: '/api/auth/me',
      ip: '203.0.113.9',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(tracker).toBe(`token:${fingerprint}`);
    expect(tracker).not.toContain(token);
  });
});
