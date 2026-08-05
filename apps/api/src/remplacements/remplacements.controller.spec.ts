import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ROLES_KEY, RolesGuard } from '../auth/guards/roles.guard';
import { RemplacementsController } from './remplacements.controller';

function handlerMetadata(methodName: string) {
  const handler = (
    RemplacementsController.prototype as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >
  )[methodName];

  return {
    guards: Reflect.getMetadata(GUARDS_METADATA, handler) ?? [],
    roles: Reflect.getMetadata(ROLES_KEY, handler) ?? [],
  };
}

describe('RemplacementsController access policy', () => {
  it('requires a JWT for every route', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, RemplacementsController) ?? [];

    expect(guards).toContain(JwtAuthGuard);
  });

  it.each([
    'getActifs',
    'getAVenir',
    'getHistorique',
    'getById',
    'create',
    'update',
    'terminer',
  ])('reserves %s for administrators', (methodName) => {
    const { guards, roles } = handlerMetadata(methodName);

    expect(guards).toContain(RolesGuard);
    expect(roles).toContain('ADMIN');
  });

  it('keeps the self-scoped user route accessible to any authenticated user', () => {
    const { guards, roles } = handlerMetadata('getPourUtilisateur');

    expect(guards).not.toContain(RolesGuard);
    expect(roles).toEqual([]);
  });

  it('declares the literal self route before the generic id route', () => {
    const methods = Object.getOwnPropertyNames(
      RemplacementsController.prototype,
    );

    expect(methods.indexOf('getPourUtilisateur')).toBeLessThan(
      methods.indexOf('getById'),
    );
  });
});
