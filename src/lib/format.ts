function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

/** Format a proportion as a percentage with the product's one-decimal rule. */
export function formatPercent(value: number): string {
  const percentage = normalizeZero(value) * 100;
  return `${Number(percentage.toFixed(1)) === 0 ? '0.0' : percentage.toFixed(1)}%`;
}

/** Format a proportion difference as signed percentage points. */
export function formatPoints(value: number): string {
  const points = normalizeZero(value) * 100;
  const rounded = points.toFixed(1);
  if (Number(rounded) === 0) return '0.0 points';
  if (points > 0) return `+${rounded} points`;
  if (points < 0) return `−${Math.abs(points).toFixed(1)} points`;
  return `${rounded} points`;
}

/** Format p-values according to the report's readable precision thresholds. */
export function formatPValue(value: number): string {
  if (value < 0.001) return '< 0.001';
  if (value < 0.01) return value.toFixed(3);
  return value.toFixed(2);
}
