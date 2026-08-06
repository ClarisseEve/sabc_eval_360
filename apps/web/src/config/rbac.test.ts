import { describe, expect, it } from 'vitest';
import {
  DOMAINES,
  RBAC,
  filterByDomaine,
  getDomaine,
  normalizeRole,
  type Role,
} from './rbac';

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

/**
 * Le cahier des charges prévoit, pour les chefs de département, une bascule
 * entre les périmètres commercial et marketing. Le rattachement d'un rôle à
 * une branche est la donnée de référence côté API (table roles.id_branche);
 * cette table doit rester alignée dessus.
 */
describe('getDomaine', () => {
  it.each([
    ['DR', 'commercial'],
    ['CSC', 'commercial'],
    ['CDV', 'commercial'],
    ['CDS', 'commercial'],
    ['CDTT', 'marketing'],
    ['RTM', 'marketing'],
    ['TMO', 'marketing'],
    ['SRMO', 'marketing'],
    ['SS', 'sponsoring'],
    ['AS', 'sponsoring'],
  ] as const)('rattache %s au domaine %s', (role, domaine) => {
    expect(getDomaine(role)).toBe(domaine);
  });

  it('couvre tous les rôles déclarés, sans exception', () => {
    const codes = Object.keys(RBAC) as Role[];
    for (const code of codes) {
      expect(DOMAINES).toContain(getDomaine(code));
    }
  });

  it('accepte un libellé complet et non seulement un code', () => {
    expect(getDomaine('Superviseur sponsoring')).toBe('sponsoring');
  });
});

describe('filterByDomaine', () => {
  const membres = [
    { matricule: 'M1', role: 'CDS' },
    { matricule: 'M2', role: 'TMO' },
    { matricule: 'M3', role: 'AS' },
  ];

  it('ne garde que les membres du domaine demandé', () => {
    expect(filterByDomaine(membres, 'marketing')).toEqual([{ matricule: 'M2', role: 'TMO' }]);
  });

  it('retourne tout le périmètre quand aucun domaine n’est demandé', () => {
    expect(filterByDomaine(membres, null)).toEqual(membres);
  });

  it('ne classe pas arbitrairement un rôle inconnu dans le domaine commercial', () => {
    const avecInconnu = [...membres, { matricule: 'M4', role: 'ROLE_X' }];
    expect(filterByDomaine(avecInconnu, 'commercial')).toEqual([
      { matricule: 'M1', role: 'CDS' },
    ]);
    expect(getDomaine('ROLE_X')).toBeNull();
  });
});
