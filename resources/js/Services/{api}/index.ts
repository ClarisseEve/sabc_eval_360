/**
 * Index des services API pour l'application SABC Évaluation 360°
 * Conforme aux règles métier et standards de développement SABC
 */

export { default as evaluationService } from './evaluation';
export { default as hierarchyService } from './hierarchy';
export { default as userService } from './user';
export { default as scoreService } from './score';
export { default as periodeService } from './periode';
export { default as regleService } from './regle';
export { default as notificationService } from './notification';
export { default as evaluationFormsService } from './evaluationForms';

// Re-export pour compatibilité avec le code existant
export { default as dashboardService } from './dashboard';
export { default as analyticsService } from './analytics';