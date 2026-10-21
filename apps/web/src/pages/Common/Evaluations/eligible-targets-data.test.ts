import { describe, expect, it } from 'vitest';
import { paginateEligibleGroups } from './eligible-targets-data';

describe('paginateEligibleGroups', () => {
  const groups = [
    { key: 'team', label: 'Équipe', targets: Array.from({ length: 8 }, (_, id) => `team-${id + 1}`) },
    { key: 'peers', label: 'Pairs', targets: Array.from({ length: 7 }, (_, id) => `peer-${id + 1}`) },
  ];

  it('limits the page and preserves each target group', () => {
    const result = paginateEligibleGroups(groups, 1, 10);

    expect(result).toMatchObject({ total: 15, page: 1, totalPages: 2, start: 1, end: 10 });
    expect(result.groups).toEqual([
      { key: 'team', label: 'Équipe', targets: groups[0].targets },
      { key: 'peers', label: 'Pairs', targets: ['peer-1', 'peer-2'] },
    ]);
  });

  it('returns the final partial page with accurate range', () => {
    const result = paginateEligibleGroups(groups, 2, 10);

    expect(result).toMatchObject({ total: 15, page: 2, totalPages: 2, start: 11, end: 15 });
    expect(result.groups).toEqual([
      { key: 'peers', label: 'Pairs', targets: ['peer-3', 'peer-4', 'peer-5', 'peer-6', 'peer-7'] },
    ]);
  });

  it('clamps the requested page when the target list shrinks', () => {
    expect(paginateEligibleGroups(groups, 8, 10).page).toBe(2);
    expect(paginateEligibleGroups([], 8, 10)).toMatchObject({
      total: 0,
      page: 1,
      totalPages: 1,
      start: 0,
      end: 0,
    });
  });
});
