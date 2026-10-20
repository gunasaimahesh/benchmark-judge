import type {
  Comparison,
  MetricName,
  ModelMetrics,
} from '../types/benchmark';

const METRICS: MetricName[] = ['accuracy', 'macroF1', 'balancedAccuracy'];
const METRIC_LABELS: Record<MetricName, string> = {
  accuracy: 'accuracy',
  macroF1: 'macro-F1',
  balancedAccuracy: 'balanced accuracy',
};

export function compareModels(
  metricsA: ModelMetrics,
  metricsB: ModelMetrics,
  metric: MetricName,
): Comparison {
  const difference = metricsB[metric] - metricsA[metric];
  if (Math.abs(difference) < 0.001) {
    return { winner: 'tie', difference };
  }
  return {
    winner: difference > 0 ? 'B' : 'A',
    difference,
  };
}

export function compareAllMetrics(
  metricsA: ModelMetrics,
  metricsB: ModelMetrics,
): Record<MetricName, Comparison> {
  return {
    accuracy: compareModels(metricsA, metricsB, 'accuracy'),
    macroF1: compareModels(metricsA, metricsB, 'macroF1'),
    balancedAccuracy: compareModels(metricsA, metricsB, 'balancedAccuracy'),
  };
}

function joinMetricLabels(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

type MetricBundle = Record<'A' | 'B', ModelMetrics>;

function resolveMetricBundle(
  metricsAOrBundle: ModelMetrics | MetricBundle,
  metricsB?: ModelMetrics,
): MetricBundle {
  if (metricsB) {
    return { A: metricsAOrBundle as ModelMetrics, B: metricsB };
  }
  return metricsAOrBundle as MetricBundle;
}

/**
 * Describe whether the selected metric changes the winner. The wording names
 * ties explicitly so an agreement sentence never implies a universal winner.
 */
export function describeMetricAgreement(
  metricsA: ModelMetrics,
  metricsB: ModelMetrics,
): string;
export function describeMetricAgreement(metrics: MetricBundle): string;
export function describeMetricAgreement(
  metricsAOrBundle: ModelMetrics | MetricBundle,
  metricsB?: ModelMetrics,
): string {
  const { A, B } = resolveMetricBundle(metricsAOrBundle, metricsB);
  const comparisons = compareAllMetrics(A, B);
  const winners = METRICS.map((metric) => comparisons[metric].winner);
  const allSame = winners.every((winner) => winner === winners[0]);

  if (allSame) {
    if (winners[0] === 'tie') return 'The models tie on all three metrics.';
    return `Model ${winners[0]} wins on all three metrics.`;
  }

  const parts: string[] = [];
  for (const model of ['A', 'B'] as const) {
    const labels = METRICS.filter((metric) => comparisons[metric].winner === model).map(
      (metric) => METRIC_LABELS[metric],
    );
    if (labels.length > 0) {
      parts.push(`Model ${model} wins ${joinMetricLabels(labels)}`);
    }
  }
  const ties = METRICS.filter((metric) => comparisons[metric].winner === 'tie').map(
    (metric) => METRIC_LABELS[metric],
  );
  if (ties.length > 0) {
    parts.push(`${joinMetricLabels(ties)} ${ties.length === 1 ? 'is' : 'are'} tied`);
  }

  return `The winner depends on the metric: ${parts.join('; ')}. See per-label performance below.`;
}
