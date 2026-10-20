import { describe, expect, it } from 'vitest';
import { formatPercent, formatPoints, formatPValue } from '../src/lib/format';

describe('formatters', () => {
  it('formats percentages and signed points from proportions', () => {
    expect(formatPercent(0.865)).toBe('86.5%');
    expect(formatPoints(0.125)).toBe('+12.5 points');
    expect(formatPoints(-0.025)).toBe('−2.5 points');
    expect(formatPoints(0)).toBe('0.0 points');
  });

  it('formats p-values at the specified thresholds', () => {
    expect(formatPValue(0.542384)).toBe('0.54');
    expect(formatPValue(0.005)).toBe('0.005');
    expect(formatPValue(0.0009)).toBe('< 0.001');
  });
});
