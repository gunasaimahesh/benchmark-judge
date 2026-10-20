import { describe, expect, it } from 'vitest';
import { mcnemarExact } from '../src/lib/stats';

describe('mcnemarExact', () => {
  it.each([
    [24, 19, 0.542384],
    [0, 6, 0.03125],
    [10, 10, 1],
    [0, 0, 1],
  ])('matches the exact reference value for b=%i, c=%i', (b, c, expected) => {
    expect(mcnemarExact(b, c).pValue).toBeCloseTo(expected, 6);
  });

  it('stays finite and nonzero for the large reference case', () => {
    const result = mcnemarExact(5000, 5200);
    expect(Number.isFinite(result.pValue)).toBe(true);
    expect(result.pValue).toBeCloseTo(0.048788, 6);
    expect(result.pValue).toBeGreaterThan(0);
  });

  it('rejects invalid discordant counts', () => {
    expect(() => mcnemarExact(-1, 2)).toThrow(RangeError);
    expect(() => mcnemarExact(1.5, 2)).toThrow(RangeError);
  });
});
