export type ScoreTone = 'success' | 'warning' | 'danger';

export function getScoreTone(score: number | null | undefined): ScoreTone {
  if (score == null || Number.isNaN(score)) return 'danger';
  if (score >= 3) return 'success';
  if (score >= 2.5) return 'warning';
  return 'danger';
}

export function buildGapLabel(current: number | null | undefined, baseline: number | null | undefined): string {
  const left = current == null || Number.isNaN(current) ? 0 : Number(current);
  const right = baseline == null || Number.isNaN(baseline) ? 0 : Number(baseline);
  const gap = left - right;
  const absolute = Math.abs(gap).toFixed(2).padStart(4, '0');
  return `${gap >= 0 ? '+' : '-'}${absolute}`;
}

export function paginateList<T>(items: T[], { page, pageSize }: { page: number; pageSize: number }) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const clampedPage = Math.min(safePage, pageCount);
  const start = (clampedPage - 1) * safePageSize;
  const end = start + safePageSize;

  return {
    items: items.slice(start, end),
    page,
    pageCount,
    total,
  };
}
