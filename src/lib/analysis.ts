import type {
  BenchmarkRow,
  Comparison,
  ConfusionMatrix,
  DatasetColumns,
  Disagreement,
  LabelSet,
  McNemarResult,
  MetricName,
  ModelMetrics,
  SliceMetrics,
} from '../types/benchmark';
import { compareAllMetrics } from './comparisons';
import { buildConfusionMatrix, calculateModelMetrics, calculateSliceMetrics, findDisagreements } from './metrics';
import { getLabelSet } from './labels';
import { mcnemarExact } from './stats';

export type AnalysisData = {
  rows: BenchmarkRow[];
  columns: DatasetColumns;
  labelSet: LabelSet;
  metricsA: ModelMetrics;
  metricsB: ModelMetrics;
  comparisons: Record<MetricName, Comparison>;
  mcnemar: McNemarResult;
  disagreements: Disagreement[];
  confusionMatrices: { A: ConfusionMatrix; B: ConfusionMatrix };
  slices: SliceMetrics[];
};

export function analyzeRows(rows: BenchmarkRow[], columns: DatasetColumns): AnalysisData {
  const labelSet = getLabelSet(rows);
  const metricsA = calculateModelMetrics(rows, 'A', labelSet);
  const metricsB = calculateModelMetrics(rows, 'B', labelSet);
  const disagreements = findDisagreements(rows);
  const aCorrectBWrong = disagreements.filter((row) => row.outcome === 'A_CORRECT_B_WRONG').length;
  const bCorrectAWrong = disagreements.filter((row) => row.outcome === 'B_CORRECT_A_WRONG').length;

  return {
    rows,
    columns,
    labelSet,
    metricsA,
    metricsB,
    comparisons: compareAllMetrics(metricsA, metricsB),
    mcnemar: mcnemarExact(aCorrectBWrong, bCorrectAWrong),
    disagreements,
    confusionMatrices: {
      A: buildConfusionMatrix(rows, 'A', labelSet),
      B: buildConfusionMatrix(rows, 'B', labelSet),
    },
    slices: columns.hasCategory ? calculateSliceMetrics(rows, labelSet) : [],
  };
}

export function metricLabel(metric: MetricName): string {
  if (metric === 'macroF1') return 'macro-F1';
  if (metric === 'balancedAccuracy') return 'balanced accuracy';
  return 'accuracy';
}
