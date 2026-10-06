import { describe, expect, it } from 'vitest';
import { scoreOnTwenty } from './evaluation-score';

describe('scoreOnTwenty', () => {
  it('converts a score on five to a score on twenty', () => {
    expect(scoreOnTwenty(3.22)).toBe(12.88);
    expect(scoreOnTwenty('4')).toBe(16);
  });

  it('preserves the absence of a score', () => {
    expect(scoreOnTwenty(null)).toBeNull();
    expect(scoreOnTwenty(undefined)).toBeNull();
    expect(scoreOnTwenty('')).toBeNull();
    expect(scoreOnTwenty('invalid')).toBeNull();
  });
});
