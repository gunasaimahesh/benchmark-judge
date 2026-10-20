import type {
  BenchmarkRow,
  ConfusionMatrix,
  Disagreement,
  DisagreementOutcome,
  LabelMetrics,
  LabelSet,
  ModelId,
  ModelMetrics,
  ModelSelection,
  SliceMetrics,
} from '../types/benchmark';
import { allLabels, getLabelSet } from './labels';

function predictionFor(row: BenchmarkRow, model: ModelSelection): string {
  return model === 'A' || model === 'model_a' ? row.modelA : row.modelB;
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function calculateLabelMetrics(
  rows: BenchmarkRow[],
  model: ModelSelection,
  label: string,
  predictionOnly = false,
): LabelMetrics {
  let support = 0;
  let predicted = 0;
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const row of rows) {
    const prediction = predictionFor(row, model);
    if (row.trueLabel === label) support += 1;
    if (prediction === label) predicted += 1;
    if (row.trueLabel === label && prediction === label) truePositive += 1;
    if (row.trueLabel !== label && prediction === label) falsePositive += 1;
    if (row.trueLabel === label && prediction !== label) falseNegative += 1;
  }

  const precision = safeRatio(truePositive, truePositive + falsePositive);
  const recall = safeRatio(truePositive, truePositive + falseNegative);
  const f1 = safeRatio(2 * truePositive, 2 * truePositive + falsePositive + falseNegative);

  return {
    label,
    support,
    predicted,
    truePositive,
    falsePositive,
    falseNegative,
    precision,
    recall,
    f1,
    predictionOnly,
  };
}

export function calculateModelMetrics(
  rows: BenchmarkRow[],
  model: ModelSelection,
  labelSet: LabelSet = getLabelSet(rows),
): ModelMetrics {
  const groundTruthMetrics = labelSet.groundTruth.map((label) =>
    calculateLabelMetrics(rows, model, label, false),
  );
  const predictionOnlyMetrics = labelSet.predictionOnly.map((label) =>
    calculateLabelMetrics(rows, model, label, true),
  );
  const perLabel = [...groundTruthMetrics, ...predictionOnlyMetrics];
  const correct = rows.reduce(
    (count, row) => count + (predictionFor(row, model) === row.trueLabel ? 1 : 0),
    0,
  );
  const macroF1 = safeRatio(
    groundTruthMetrics.reduce((sum, metric) => sum + metric.f1, 0),
    groundTruthMetrics.length,
  );
  const balancedAccuracy = safeRatio(
    groundTruthMetrics.reduce((sum, metric) => sum + metric.recall, 0),
    groundTruthMetrics.length,
  );

  return {
    total: rows.length,
    correct,
    accuracy: safeRatio(correct, rows.length),
    macroF1,
    balancedAccuracy,
    perLabel,
  };
}

/**
 * Compute metrics independently for each non-null category. The supplied
 * label set is accepted for API symmetry with the dashboard pipeline; each
 * slice derives its own ground-truth labels so absent labels do not lower its
 * macro-F1.
 */
export function calculateSliceMetrics(
  rows: BenchmarkRow[],
  _labelSet?: LabelSet,
): SliceMetrics[] {
  const categories: string[] = [];
  const byCategory = new Map<string, BenchmarkRow[]>();
  for (const row of rows) {
    if (row.category === null) continue;
    const categoryRows = byCategory.get(row.category);
    if (categoryRows) categoryRows.push(row);
    else {
      categories.push(row.category);
      byCategory.set(row.category, [row]);
    }
  }

  return categories.map((category) => {
    const categoryRows = byCategory.get(category)!;
    const sliceLabelSet = getLabelSet(categoryRows);
    const modelA = calculateModelMetrics(categoryRows, 'A', sliceLabelSet);
    const modelB = calculateModelMetrics(categoryRows, 'B', sliceLabelSet);
    return {
      category,
      support: categoryRows.length,
      labelSet: sliceLabelSet,
      modelA,
      modelB,
      A: modelA,
      B: modelB,
    };
  });
}

export function slicesHaveSingleLabels(rows: BenchmarkRow[]): boolean {
  const labelsByCategory = new Map<string, Set<string>>();
  for (const row of rows) {
    if (row.category === null) continue;
    const labels = labelsByCategory.get(row.category) ?? new Set<string>();
    labels.add(row.trueLabel);
    labelsByCategory.set(row.category, labels);
  }
  return labelsByCategory.size > 0 && [...labelsByCategory.values()].every((labels) => labels.size === 1);
}

export function buildConfusionMatrix(
  rows: BenchmarkRow[],
  model: ModelSelection,
  labelSet: LabelSet = getLabelSet(rows),
): ConfusionMatrix {
  const rowLabels = [...labelSet.groundTruth];
  const columnLabels = allLabels(labelSet);
  const rowIndex = new Map(rowLabels.map((label, index) => [label, index]));
  const columnIndex = new Map(columnLabels.map((label, index) => [label, index]));
  const matrix = rowLabels.map(() => columnLabels.map(() => 0));

  for (const row of rows) {
    const actual = rowIndex.get(row.trueLabel);
    const predicted = columnIndex.get(predictionFor(row, model));
    if (actual === undefined || predicted === undefined) continue;
    matrix[actual][predicted] += 1;
  }

  return {
    labels: columnLabels,
    rowLabels,
    columnLabels,
    matrix,
    rows: rowLabels,
    columns: columnLabels,
    counts: matrix,
  };
}

export function disagreementOutcome(row: BenchmarkRow): DisagreementOutcome | null {
  if (row.modelA === row.modelB) return null;
  const aCorrect = row.modelA === row.trueLabel;
  const bCorrect = row.modelB === row.trueLabel;
  if (aCorrect && !bCorrect) return 'A_CORRECT_B_WRONG';
  if (bCorrect && !aCorrect) return 'B_CORRECT_A_WRONG';
  return 'BOTH_WRONG';
}

export function findDisagreements(rows: BenchmarkRow[]): Disagreement[] {
  const disagreements: Disagreement[] = [];
  for (const row of rows) {
    const outcome = disagreementOutcome(row);
    if (outcome !== null) {
      const disagreement = { ...row, outcome } as Disagreement;
      Object.defineProperty(disagreement, 'row', {
        value: row,
        enumerable: false,
      });
      disagreements.push(disagreement);
    }
  }
  return disagreements;
}

/** Select a scalar metric without allowing components to reimplement keys. */
export function metricValue(
  metrics: ModelMetrics,
  metric: 'accuracy' | 'macroF1' | 'balancedAccuracy',
): number {
  return metrics[metric];
}

export function modelPrediction(row: BenchmarkRow, model: ModelId): string {
  return predictionFor(row, model);
}
