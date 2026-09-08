import { describe, expect, it } from 'vitest';
import { buildGapLabel, getScoreTone, paginateList } from './adminUi';

describe('adminUi helpers', () => {
  it('renders success tone for scores at or above threshold', () => {
    expect(getScoreTone(3)).toBe('success');
    expect(getScoreTone(4.5)).toBe('success');
    expect(getScoreTone(2.9)).toBe('warning');
  });

  it('computes the gap between two values with the expected sign', () => {
    expect(buildGapLabel(4.2, 3.4)).toBe('+0.80');
    expect(buildGapLabel(2.5, 3.1)).toBe('-0.60');
  });

  it('paginates a list with a stable page size', () => {
    const result = paginateList([1, 2, 3, 4, 5, 6], { page: 2, pageSize: 3 });
    expect(result.items).toEqual([4, 5, 6]);
    expect(result.pageCount).toBe(2);
  });
});
