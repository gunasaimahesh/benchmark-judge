import type { BenchmarkRow, LabelSet } from '../types/benchmark';

function lexicalCompare(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Build the one shared label order used by tables, filters, and matrices.
 * Ground-truth labels are support-descending; ties use deterministic string
 * ordering. Prediction-only labels are appended alphabetically.
 */
export function getLabelSet(rows: BenchmarkRow[]): LabelSet {
  const support = new Map<string, number>();
  const predictions = new Set<string>();

  for (const row of rows) {
    support.set(row.trueLabel, (support.get(row.trueLabel) ?? 0) + 1);
    predictions.add(row.modelA);
    predictions.add(row.modelB);
  }

  const groundTruth = [...support.keys()].sort(
    (left, right) =>
      (support.get(right)! - support.get(left)!) || lexicalCompare(left, right),
  );
  const groundTruthSet = new Set(groundTruth);
  const predictionOnly = [...predictions]
    .filter((label) => !groundTruthSet.has(label))
    .sort(lexicalCompare);

  return { groundTruth, predictionOnly };
}

export function allLabels(labelSet: LabelSet): string[] {
  return [...labelSet.groundTruth, ...labelSet.predictionOnly];
}
