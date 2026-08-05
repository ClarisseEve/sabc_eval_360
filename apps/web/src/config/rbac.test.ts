import { describe, expect, it } from 'vitest';
import { RBAC, normalizeRole, type Role } from './rbac';

/**
 * La sidebar construit le lien « Tableau de bord » avec normalizeRole, alors
 * qu'AuthGuard compare le rôle brut renvoyé par l'API. Si normalizeRole ne
 * reconnaît pas un code de rôle, il retombe sur CSC: l'utilisateur est envoyé
 * vers /csc/dashboard, refusé par le garde, et atterrit sur /403 sans pouvoir
 * atteindre son propre tableau de bord. C'est ce qui arrivait au rôle SS.
 */
describe('normalizeRole', () => {
  const codes = Object.keys(RBAC) as Role[];

  it.each(codes)('reconnaît le code de rôle %s', (code) => {
    expect(normalizeRole(code)).toBe(code);
  });

  it.each(codes)('reconnaît %s en minuscules et avec des espaces', (code) => {
    expect(normalizeRole(`  ${code.toLowerCase()} `)).toBe(code);
  });

  // Libellés tels que définis dans apps/api/prisma/seed.ts.
  it.each([
    ['Superviseur sponsoring', 'SS'],
    ['Assistant superviseur sponsoring', 'AS'],
    ['Superviseur regional marketing operationnel', 'SRMO'],
    ['Directeur regional', 'DR'],
    ['Chef de secteur', 'CDS'],
  ] as const)('associe le libellé « %s » au code %s', (label, code) => {
    expect(normalizeRole(label)).toBe(code);
  });

  it('retombe sur CSC pour une valeur inconnue ou vide', () => {
    expect(normalizeRole('ROLE_INCONNU')).toBe('CSC');
    expect(normalizeRole('')).toBe('CSC');
    expect(normalizeRole(null)).toBe('CSC');
  });
});
