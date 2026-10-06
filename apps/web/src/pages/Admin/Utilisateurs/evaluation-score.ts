export function scoreOnTwenty(scoreOnFive: number | string | null | undefined): number | null {
  if (scoreOnFive === null || scoreOnFive === undefined || scoreOnFive === '') return null;
  const value = Number(scoreOnFive);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 400) / 100;
}
