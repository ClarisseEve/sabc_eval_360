import { APP_THROTTLER_OPTIONS } from './throttler-options';

describe('configuration du rate limiting', () => {
  it('ne déclare qu’un plafond global, les seuils spécialisés restant locaux aux routes', () => {
    expect(APP_THROTTLER_OPTIONS).toEqual([
      {
        name: 'default',
        ttl: 60_000,
        limit: 300,
      },
    ]);
  });
});
