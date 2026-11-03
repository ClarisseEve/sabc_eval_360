import type { CSSProperties } from 'react';

/**
 * Palette et réglages graphiques uniques de l'application SABC.
 * Valeurs hexadécimales (et non variables CSS) pour que les exports PNG/SVG/PDF
 * conservent les couleurs.
 */
export const CHART_COLORS = {
  /** Palette historique des graphiques, antérieure à la refonte visuelle. */
  primary: '#E53E3E',
  secondary: '#3182CE',
  tertiary: '#9E9E9E',
  emphasis: '#FF9800',
  dark: '#D69E2E',
  accent: '#FF9800',
  success: '#48BB78',
  warning: '#D69E2E',
  info: '#3182CE',
  gray: '#9E9E9E',
  grid: '#E5E5E3',
  axis: '#C9C9C6',
  tick: '#4F4F4F',
  track: '#F0F0EE',
} as const;

/** Ordre historique des séries utilisé par les graphiques catégoriels. */
export const CHART_SERIES: string[] = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.info,
  CHART_COLORS.warning,
  '#9F7AEA',
  '#ED64A6',
  '#38B2AC',
  '#DD6B20',
  '#667EEA',
  '#F56565',
];

/** Couleurs de statut sémantique (réservées aux vrais statuts). */
export const CHART_STATUS = {
  success: '#48BB78',
  warning: '#D69E2E',
  danger: '#E53E3E',
} as const;

export const CHART_TICK = { fill: CHART_COLORS.tick, fontSize: 11 };
export const CHART_AXIS_LINE = { stroke: CHART_COLORS.axis };

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E5E3',
  borderRadius: 8,
  boxShadow: 'none',
  fontSize: 12,
  padding: '6px 10px',
};

/** Échelle des notes : 0 à 5, pas de 1. */
export const SCORE_DOMAIN: [number, number] = [0, 5];
export const SCORE_TICKS = [0, 1, 2, 3, 4, 5];

/** Échelle des pourcentages : 0 à 100, pas de 25. */
export const PERCENT_DOMAIN: [number, number] = [0, 100];
export const PERCENT_TICKS = [0, 25, 50, 75, 100];

/** Nombre au format français (« 3,7 »), « n.d. » si absent. */
export function formatChartNumber(value: unknown, digits = 1): string {
  if (value === null || value === undefined || value === '') return 'n.d.';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'n.d.';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

/** Note au format français pour un tooltip (« 3,70 / 5 »). */
export function formatChartScore(value: unknown, digits = 2): string {
  if (value === null || value === undefined || value === '') return 'n.d.';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'n.d.';
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} / 5`;
}

/** Pourcentage au format français (« 82 % »). */
export function formatChartPercent(value: unknown, digits = 0): string {
  if (value === null || value === undefined || value === '') return 'n.d.';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'n.d.';
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: digits })} %`;
}

/** Formateur de graduation d'axe en français. */
export const frenchTick = (value: number | string) => formatChartNumber(value, 1);
