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
    canEvaluateSubs: true,
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
    canEvaluateSubs: true,
  },
  CDS: {
    canCrossBranch: false,
    canSelfEvaluate: true,
    canEvaluatePeers: true,
    canEvaluateSubs: false,
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
    canEvaluateSubs: true,
    directSubsOnly: true,
  },
};

function toUpperNoAccent(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
}

export function normalizeRole(input?: string | null): Role {
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
  // Fallback conservateur
  return 'CSC';
}

export function getCapabilities(roleLike?: string | null): RoleCapabilities {
  const code = normalizeRole(roleLike);
  return RBAC[code];
}

export function hasCapability(roleLike: string | null | undefined, cap: keyof RoleCapabilities): boolean {
  const caps = getCapabilities(roleLike ?? undefined);
  return Boolean(caps[cap]);
}
