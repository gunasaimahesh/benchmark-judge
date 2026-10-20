import { describe, expect, it } from 'vitest';
import { compareModels, describeMetricAgreement } from '../src/lib/comparisons';
import type { ModelMetrics } from '../src/types/benchmark';

function metrics(values: Partial<ModelMetrics>): ModelMetrics {
  return {
    total: 10,
    correct: 5,
    accuracy: 0.5,
    macroF1: 0.5,
    balancedAccuracy: 0.5,
    perLabel: [],
    ...values,
  };
}

describe('model comparisons', () => {
  it('names A, B, and ties using the unrounded difference', () => {
    expect(compareModels(metrics({ accuracy: 0.8 }), metrics({ accuracy: 0.7 }), 'accuracy')).toEqual({
      winner: 'A',
      difference: -0.10000000000000009,
    });
    expect(compareModels(metrics({ accuracy: 0.7 }), metrics({ accuracy: 0.8 }), 'accuracy').winner).toBe('B');
    expect(compareModels(metrics({ accuracy: 0.7001 }), metrics({ accuracy: 0.701 }), 'accuracy')).toEqual({
      winner: 'tie',
      difference: 0.0009000000000000119,
    });
  });

  it('describes disagreement, agreement, and a named tie', () => {
    expect(
      describeMetricAgreement(
        metrics({ accuracy: 0.9, macroF1: 0.6, balancedAccuracy: 0.6 }),
        metrics({ accuracy: 0.8, macroF1: 0.8, balancedAccuracy: 0.7 }),
      ),
    ).toBe(
      'The winner depends on the metric: Model A wins accuracy; Model B wins macro-F1 and balanced accuracy. See per-label performance below.',
    );
    expect(
      describeMetricAgreement(
        metrics({ accuracy: 0.6, macroF1: 0.6, balancedAccuracy: 0.6 }),
        metrics({ accuracy: 0.8, macroF1: 0.8, balancedAccuracy: 0.8 }),
      ),
    ).toBe('Model B wins on all three metrics.');
    expect(
      describeMetricAgreement(
        metrics({ accuracy: 0.6, macroF1: 0.6, balancedAccuracy: 0.6 }),
        metrics({ accuracy: 0.6005, macroF1: 0.8, balancedAccuracy: 0.8 }),
      ),
    ).toContain('accuracy is tied');
  });
});
