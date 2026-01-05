// Export de tous les hooks personnalisés SABC
export { default as useAuth } from './useAuth';
export { default as useTheme } from './useTheme';
export { default as useEvaluations } from './useEvaluations';
export { default as useAnalytics } from './useAnalytics';
export { default as useDashboard } from './useDashboard';
export { default as usePermissions } from './usePermissions';
export { default as useEvaluationForms } from './useEvaluationForms';
export { default as useNotifications } from './useNotifications';

// Export des types associés aux hooks
export type { Evaluation, EvaluationFormData } from './useEvaluations';
export type { DashboardStats, RegionalStats } from './useDashboard';
export type { AnalyticsData, FilterGroup } from './useAnalytics';
export type { Permission, EvaluationRules } from './usePermissions';
export type { Competency, EvaluationFormTemplate } from './useEvaluationForms';
export type { NotificationMetadata } from './useNotifications';
