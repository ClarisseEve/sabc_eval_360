import { parseAllowedOrigins } from './cors-origins';

const allows = (origins: Array<string | RegExp>, origin: string) =>
  origins.some((allowed) => (typeof allowed === 'string' ? allowed === origin : allowed.test(origin)));

describe('parseAllowedOrigins', () => {
  it('garde les origines exactes et retire le slash final', () => {
    expect(parseAllowedOrigins('https://a.vercel.app/, http://localhost:5173')).toEqual([
      'https://a.vercel.app',
      'http://localhost:5173',
    ]);
  });

  it('accepte les previews Vercel du projet via un joker', () => {
    const origins = parseAllowedOrigins('https://sabc-eval-360-*-clarisseeve.vercel.app');
    expect(allows(origins, 'https://sabc-eval-360-git-dever-clarisseeve.vercel.app')).toBe(true);
    expect(allows(origins, 'https://sabc-eval-360-abc123-clarisseeve.vercel.app')).toBe(true);
  });

  it('refuse un joker qui franchirait un point ou un autre suffixe', () => {
    const origins = parseAllowedOrigins('https://sabc-eval-360-*-clarisseeve.vercel.app');
    expect(allows(origins, 'https://sabc-eval-360-x.evil.com-clarisseeve.vercel.app')).toBe(false);
    expect(allows(origins, 'https://sabc-eval-360-x-clarisseeve.vercel.app.evil.com')).toBe(false);
    expect(allows(origins, 'https://sabc-eval-360-x-autre.vercel.app')).toBe(false);
  });
});
