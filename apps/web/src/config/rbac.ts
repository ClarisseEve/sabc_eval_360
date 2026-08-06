export type Role =
  | 'ADMIN'
  | 'DR'
  | 'CDTT'
  | 'CSC'
  | 'RTM'
  | 'CDV'
  | 'TMO'
  | 'CDS'
  | 'AS'
  | 'SS'
  | 'SRMO';

export type RoleCapabilities = {
  canCrossBranch: boolean;
  canSelfEvaluate: boolean;
  canEvaluatePeers: boolean;
  canEvaluateSubs: boolean;
  directSubsOnly?: boolean; // RTM, SRMO
};

export const RBAC: Record<Role, RoleCapabilities> = {
  ADMIN: {
    canCrossBranch: true,
    canSelfEvaluate: false,
    canEvaluatePeers: true,
    canEvaluateSubs: true,
  },
  DR: {
    canCrossBranch: true,
    canSelfEvaluate: false,
    canEvaluatePeers: false,
    canEvaluateSubs: true,
  },
  CDTT: {
    canCrossBranch: true,
    canSelfEvaluate: false,
    canEvaluatePeers: false,
    canEvaluateSubs: true,
  },
  CSC: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: true,
    canEvaluateSubs: false,
  },
  RTM: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: false,
    canEvaluateSubs: true,
    directSubsOnly: true,
  },
  CDV: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: true,
    canEvaluateSubs: true,
  },
  TMO: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: true,
    canEvaluateSubs: false,
  },
  CDS: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: true,
    canEvaluateSubs: true,
  },
  AS: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: true,
    canEvaluateSubs: false,
  },
  SS: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: true,
    canEvaluateSubs: true,
  },
  SRMO: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: false,
    canEvaluateSubs: false,
    directSubsOnly: true,
  },
};

function toUpperNoAccent(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
}

export function resolveKnownRole(input?: string | null): Role | null {
  const r = toUpperNoAccent(String(input ?? '').trim());
  if (r.includes('ADMIN')) return 'ADMIN';
  if (r === 'DR' || r.includes('DIRECTEUR REGIONAL')) return 'DR';
  if (r.includes('CDTT') || r.includes('CHEF DEPARTEMENT TRADE')) return 'CDTT';
  if (r === 'CSC' || r.includes('CHEF SERVICE COMMERCIAL')) return 'CSC';
  if (r === 'CDV' || r.includes('CHEF DISTRICT VENTE')) return 'CDV';
  if (r === 'CDS' || r.includes('CHEF DE SECTEUR')) return 'CDS';
  if (r === 'RTM' || r.includes('REGIONAL TRADE MARKETING')) return 'RTM';
  if (r === 'TMO' || r.includes('TRADE MARKETING OPERATOR')) return 'TMO';
  if (r === 'SRMO' || r.includes('SUPERVISEUR REGIONAL MARKETING OPERATIONNEL')) return 'SRMO';
  if (r === 'AS' || r.includes('ASSISTANT SUPERVISEUR SPONSORING')) return 'AS';
  // Doit rester après AS: « assistant superviseur sponsoring » contient aussi
  // « superviseur sponsoring ».
  if (r === 'SS' || r.includes('SUPERVISEUR SPONSORING')) return 'SS';
  return null;
}

export function normalizeRole(input?: string | null): Role {
  // Compatibilité avec les anciens appels. Les interfaces de filtrage utilisent
  // resolveKnownRole afin de ne pas classer un rôle inconnu comme commercial.
  return resolveKnownRole(input) ?? 'CSC';
}

/**
 * Branches métier de la SABC. Chaque rôle est rattaché à l'une d'elles côté
 * API (roles.id_branche): BR001 Commercial, BR002 Marketing, BR003 Sponsoring.
 * Les jeux de critères d'évaluation suivent ce même découpage.
 */
export const DOMAINES = ['commercial', 'marketing', 'sponsoring'] as const;
export type Domaine = (typeof DOMAINES)[number];

const ROLE_DOMAINE: Record<Role, Domaine> = {
  ADMIN: 'commercial',
  DR: 'commercial',
  CSC: 'commercial',
  CDV: 'commercial',
  CDS: 'commercial',
  CDTT: 'marketing',
  RTM: 'marketing',
  TMO: 'marketing',
  SRMO: 'marketing',
  SS: 'sponsoring',
  AS: 'sponsoring',
};

export function getDomaine(roleLike?: string | null): Domaine | null {
  const role = resolveKnownRole(roleLike);
  return role ? ROLE_DOMAINE[role] : null;
}

/**
 * Restreint un périmètre à un domaine. Un domaine nul signifie « tout le
 * périmètre » plutôt qu'« aucun résultat »: c'est l'état par défaut de la
 * bascule des chefs de département.
 */
export function filterByDomaine<T extends { role?: string | null }>(
  membres: T[],
  domaine: Domaine | null,
): T[] {
  if (!domaine) return membres;
  return membres.filter((membre) => getDomaine(membre.role) === domaine);
}

export function getCapabilities(roleLike?: string | null): RoleCapabilities {
  const code = normalizeRole(roleLike);
  return RBAC[code];
}

export function hasCapability(roleLike: string | null | undefined, cap: keyof RoleCapabilities): boolean {
  const caps = getCapabilities(roleLike ?? undefined);
  return Boolean(caps[cap]);
}
