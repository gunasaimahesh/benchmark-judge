import type { McNemarResult } from '../types/benchmark';

const LOG_TWO = Math.log(2);

function assertCount(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
}

/**
 * Exact log binomial coefficient, evaluated with the shorter product. It is
 * intentionally iterative rather than relying on a platform-specific lgamma
 * implementation, and is fast enough for the 100,000-row input limit.
 */
export function logBinomialCoefficient(n: number, k: number): number {
  assertCount(n, 'n');
  assertCount(k, 'k');
  if (k > n) return Number.NEGATIVE_INFINITY;
  const lower = Math.min(k, n - k);
  let result = 0;
  for (let i = 1; i <= lower; i += 1) {
    result += Math.log(n - lower + i) - Math.log(i);
  }
  return result;
}

/** Stable log-space implementation of McNemar's two-sided exact p-value. */
export function mcnemarExact(aCorrectBWrong: number, bCorrectAWrong: number): McNemarResult {
  assertCount(aCorrectBWrong, 'aCorrectBWrong');
  assertCount(bCorrectAWrong, 'bCorrectAWrong');

  const n = aCorrectBWrong + bCorrectAWrong;
  if (n === 0) {
    return { aCorrectBWrong, bCorrectAWrong, pValue: 1 };
  }

  const upper = Math.min(aCorrectBWrong, bCorrectAWrong);
  const logProbability = -n * LOG_TWO;

  // Log-sum-exp avoids both underflow in 0.5^n and overflow in C(n, k).
  let maxLogTerm = Number.NEGATIVE_INFINITY;
  let scaledSum = 0;
  // Consecutive binomial coefficients have a simple recurrence. Keeping the
  // recurrence here makes the exact test O(min(b, c)) rather than repeatedly
  // recomputing every coefficient from scratch for a large evaluation set.
  let logCombination = 0;
  for (let k = 0; k <= upper; k += 1) {
    const logTerm = logCombination + logProbability;
    if (logTerm > maxLogTerm) {
      scaledSum = scaledSum * Math.exp(maxLogTerm - logTerm) + 1;
      maxLogTerm = logTerm;
    } else {
      scaledSum += Math.exp(logTerm - maxLogTerm);
    }
    if (k < upper) {
      logCombination += Math.log(n - k) - Math.log(k + 1);
    }
  }

  const oneSidedLogSum = maxLogTerm + Math.log(scaledSum);
  const pValue = Math.min(1, 2 * Math.exp(oneSidedLogSum));
  return { aCorrectBWrong, bCorrectAWrong, pValue };
}
