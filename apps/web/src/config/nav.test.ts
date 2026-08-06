import { describe, expect, it } from 'vitest';

import { NAV_ITEMS, VALIDATION_QUEUE_ROLES } from './nav';

describe('navigation de la file de validation', () => {
  it('expose la file aux rôles DR, CDTT et CDS prévus par le parcours', () => {
    expect(VALIDATION_QUEUE_ROLES).toEqual(
      expect.arrayContaining(['DR', 'CDTT', 'CDS']),
    );

    const evaluations = NAV_ITEMS.find((item) => item.title === 'Évaluations');
    const validationQueue = evaluations?.children?.find((item) => item.href === '/evaluations/validate');

    expect(validationQueue?.roles).toEqual(VALIDATION_QUEUE_ROLES);
  });

  it('ne présente pas la navigation comme une autorisation globale', () => {
    expect(VALIDATION_QUEUE_ROLES).not.toContain('ADMIN');
    expect(VALIDATION_QUEUE_ROLES).not.toContain('AS');
  });
});

describe('navigation administrateur', () => {
  it('garde les parcours utiles sans exposer la matrice de permissions inachevée', () => {
    const hrefs = NAV_ITEMS.flatMap((item) => [
      item.href,
      ...(item.children ?? []).map((child) => child.href),
    ]);

    expect(hrefs).toContain('/admin/roles');
    expect(hrefs).toContain('/admin/evaluations/templates');
    expect(hrefs).not.toContain('/admin/roles/permissions');
  });
});
