export const DOUALA_TIME_ZONE = 'Africa/Douala';

const doualaDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: DOUALA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Returns the calendar date in Douala as YYYY-MM-DD, independently of host TZ. */
export function getDoualaDate(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    doualaDateFormatter
      .formatToParts(now)
      .filter(({ type }) => type === 'year' || type === 'month' || type === 'day')
      .map(({ type, value }) => [type, value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}
