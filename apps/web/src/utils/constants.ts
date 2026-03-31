// Constantes de l'application

export const APP_NAME = 'SABC Eval360';
export const APP_DESCRIPTION = 'Plateforme d\'évaluation 360° pour SABC';

// Rôles utilisateurs
export const USER_ROLES = {
  DR: 'DR',
  CDTT: 'CDTT',
  CSC: 'CSC',
  CDV: 'CDV',
  CDS: 'CDS',
  RTM: 'RTM',
  TMO: 'TMO',
  AS: 'AS',
} as const;

// Types d'évaluation
export const EVALUATION_TYPES = {
  SELF: 'self',
  PEER: 'peer',
  MANAGER: 'manager',
  SUBORDINATE: 'subordinate',
} as const;

// Statuts d'évaluation
export const EVALUATION_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
} as const;

// Chemins d'API
export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    USER: '/api/auth/user',
  },
  EVALUATIONS: '/api/evaluations',
  USERS: '/api/users',
  REPORTS: '/api/reports',
} as const;

// Tailles de fichiers
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  DOCUMENT: 5 * 1024 * 1024, // 5MB
  IMAGE: 3 * 1024 * 1024, // 3MB
} as const;

// Durées en millisecondes
export const DURATION = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

// Thèmes de l'application
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;
