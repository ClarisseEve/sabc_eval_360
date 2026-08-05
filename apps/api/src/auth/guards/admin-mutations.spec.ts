import { GUARDS_METADATA } from '@nestjs/common/constants';
import { EvaluationsController } from '../../evaluations/evaluations.controller';
import { HierarchyController } from '../../hierarchy/hierarchy.controller';
import { NotificationsController } from '../../notifications/notifications.controller';
import { PeriodesController } from '../../periodes/periodes.controller';
import { RemplacementsController } from '../../remplacements/remplacements.controller';
import { TemplatesController } from '../../templates/templates.controller';
import { ROLES_KEY, RolesGuard } from './roles.guard';

type ControllerClass = { prototype: any };

function expectAdminGuard(controller: ControllerClass, methodName: string): void {
  const handler: (...args: any[]) => unknown = controller.prototype[methodName];
  const roles = Reflect.getMetadata(ROLES_KEY, handler) ?? [];
  const guards = Reflect.getMetadata(GUARDS_METADATA, handler) ?? [];

  expect(roles).toContain('ADMIN');
  expect(guards).toContain(RolesGuard);
}

describe('mutations sensibles réservées aux administrateurs', () => {
  it.each([
    'create',
    'update',
    'ouvrir',
    'fermer',
    'toggle',
    'remove',
  ])('protège PeriodesController.%s', (methodName) => {
    expectAdminGuard(PeriodesController, methodName);
  });

  it.each([
    'assign',
    'assignBulk',
    'create',
    'update',
    'publish',
    'unpublish',
    'remove',
    'delete',
  ])('protège TemplatesController.%s', (methodName) => {
    expectAdminGuard(TemplatesController, methodName);
  });

  it.each(['create', 'update', 'terminer'])(
    'protège RemplacementsController.%s',
    (methodName) => {
      expectAdminGuard(RemplacementsController, methodName);
    },
  );

  it('protège l’assignation de manager', () => {
    expectAdminGuard(HierarchyController, 'assignerManager');
  });

  it('protège l’envoi en masse de notifications', () => {
    expectAdminGuard(NotificationsController, 'sendBulk');
  });

  it.each(['rapport', 'rappels'])(
    'protège EvaluationsController.%s',
    (methodName) => {
      expectAdminGuard(EvaluationsController, methodName);
    },
  );
});
