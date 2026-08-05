import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ROLES_KEY, RolesGuard } from '../auth/guards/roles.guard';
import { HierarchyController } from './hierarchy.controller';

function handlerMetadata(methodName: string) {
  const handler = (
    HierarchyController.prototype as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >
  )[methodName];

  return {
    guards: Reflect.getMetadata(GUARDS_METADATA, handler) ?? [],
    roles: Reflect.getMetadata(ROLES_KEY, handler) ?? [],
  };
}

describe('HierarchyController access policy', () => {
  it('requires a JWT for every route', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, HierarchyController) ?? [];

    expect(guards).toContain(JwtAuthGuard);
  });

  it.each([
    'getRegion',
    'getRegionStats',
    'getManagersEligibles',
    'verifierSupervision',
    'validerAssignation',
    'assignerManager',
  ])('reserves %s for administrators', (methodName) => {
    const { guards, roles } = handlerMetadata(methodName);

    expect(guards).toContain(RolesGuard);
    expect(roles).toContain('ADMIN');
  });

  it.each(['getSubordonnes', 'getTousSubordonnes', 'getChaineHierarchique'])(
    'keeps the self-scoped route %s accessible to any authenticated user',
    (methodName) => {
      const { guards, roles } = handlerMetadata(methodName);

      expect(guards).not.toContain(RolesGuard);
      expect(roles).toEqual([]);
    },
  );
});
