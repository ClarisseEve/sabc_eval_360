import { validateEnvironment } from './validate-env';

describe('validateEnvironment', () => {
  const productionEnv = {
    NODE_ENV: 'production',
    PORT: '3000',
    JWT_SECRET: 'a-secure-secret-with-more-than-32-characters',
    DATABASE_URL: 'mysql://user:a-secure-mysql-password@mysql:3306/sabc_core',
    PG_HOST: 'postgres',
    PG_DATABASE: 'sabc_business',
    PG_USER: 'sabc_user',
    PG_PASSWORD: 'a-secure-password',
    FRONTEND_URL: 'https://eval.example.com',
    CACHE_DRIVER: 'redis',
    REDIS_URL: 'redis://redis:6379',
  };

  it('accepts a complete production environment', () => {
    expect(validateEnvironment({ ...productionEnv })).toMatchObject({ PORT: 3000 });
  });

  it('rejects the example JWT secret in production', () => {
    expect(() =>
      validateEnvironment({ ...productionEnv, JWT_SECRET: 'CHANGE_ME_MIN_32_CHARS' }),
    ).toThrow('JWT_SECRET');
  });

  it('rejects example database passwords in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionEnv,
        DATABASE_URL: 'mysql://sabc_user:secret@mysql:3306/sabc_core',
      }),
    ).toThrow('DATABASE_URL');

    expect(() =>
      validateEnvironment({ ...productionEnv, PG_PASSWORD: 'secret' }),
    ).toThrow('PG_PASSWORD');
  });

  it('keeps local development lightweight', () => {
    expect(validateEnvironment({ NODE_ENV: 'development' })).toMatchObject({ PORT: 3000 });
  });
});
