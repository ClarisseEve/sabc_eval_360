import { createHmac, timingSafeEqual } from 'node:crypto';

const JWT_BLACKLIST_PREFIX = 'auth:jwt:blacklist';

export function normalizeLoginIdentifier(identifier: unknown): string {
  return typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
}

export function createPasswordFingerprint(
  passwordHash: string,
  jwtSecret: string,
): string {
  return createHmac('sha256', jwtSecret)
    .update(passwordHash, 'utf8')
    .digest('base64url');
}

export function passwordFingerprintMatches(
  actual: unknown,
  expected: string,
): boolean {
  if (typeof actual !== 'string') return false;

  const actualBuffer = Buffer.from(actual, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function jwtBlacklistKey(jti: string): string {
  return `${JWT_BLACKLIST_PREFIX}:${jti}`;
}
