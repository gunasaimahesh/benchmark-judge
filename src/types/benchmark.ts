/** A validated row from a Benchmark Judge CSV file. */
export type BenchmarkRow = {
  id: string;
  category: string | null;
  trueLabel: string;
  modelA: string;
  modelB: string;
  text: string | null;
  extras: Record<string, string>;
  /** Spreadsheet row number. The header is row 1. */
  sourceRow: number;
};

export type ModelId = 'A' | 'B';
export type MetricName = 'accuracy' | 'macroF1' | 'balancedAccuracy';

/** The model names accepted by helpers that select a prediction column. */
export type ModelSelection = ModelId | 'model_a' | 'model_b';

export type LabelSet = {
  /** Ground-truth labels, ordered by support descending then alphabetically. */
  groundTruth: string[];
  /** Labels predicted by either model that never occur in the ground truth. */
  predictionOnly: string[];
};

export type LabelMetrics = {
  label: string;
  support: number;
  predicted: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
  f1: number;
  predictionOnly: boolean;
};

export type ModelMetrics = {
  total: number;
  correct: number;
  accuracy: number;
  macroF1: number;
  balancedAccuracy: number;
  /** Ground-truth labels first, followed by prediction-only labels. */
  perLabel: LabelMetrics[];
};

export type DisagreementOutcome =
  | 'A_CORRECT_B_WRONG'
  | 'B_CORRECT_A_WRONG'
  | 'BOTH_WRONG';

export type Disagreement = BenchmarkRow & {
  outcome: DisagreementOutcome;
  /** Optional non-enumerable convenience alias for row-oriented consumers. */
  readonly row?: BenchmarkRow;
};

export type Comparison = {
  winner: ModelId | 'tie';
  /** The unrounded difference, B − A. */
  difference: number;
};

export type McNemarResult = {
  aCorrectBWrong: number;
  bCorrectAWrong: number;
  pValue: number;
};

export type DatasetColumns = {
  headers: string[];
  hasCategory: boolean;
  hasText: boolean;
  extras: string[];
};

export type SliceMetrics = {
  category: string;
  support: number;
  labelSet: LabelSet;
  modelA: ModelMetrics;
  modelB: ModelMetrics;
  /** Aliases useful to consumers that use the report's A/B naming. */
  A: ModelMetrics;
  B: ModelMetrics;
};

export type ConfusionMatrix = {
  /** Ground-truth labels are rows; all labels are columns. */
  labels: string[];
  rowLabels: string[];
  columnLabels: string[];
  matrix: number[][];
  /** Aliases kept explicit so report consumers do not need to infer axes. */
  rows: string[];
  columns: string[];
  counts: number[][];
};

export type DisagreementSummary = {
  total: number;
  aCorrectBWrong: number;
  bCorrectAWrong: number;
  bothWrong: number;
};

export type BenchmarkReport = {
  tool: 'Benchmark Judge';
  methodologyVersion: '2';
  generatedAt: string;
  source: {
    filename: string;
    rows: number;
    hasCategory: boolean;
    hasText: boolean;
  };
  labels: LabelSet;
  categories: string[] | null;
  selectedMetric: MetricName;
  models: {
    A: ModelMetrics;
    B: ModelMetrics;
  };
  comparisons: {
    accuracy: Comparison;
    macroF1: Comparison;
    balancedAccuracy: Comparison;
  };
  mcnemar: McNemarResult;
  disagreements: DisagreementSummary;
  confusionMatrices: {
    A: ConfusionMatrix;
    B: ConfusionMatrix;
  };
  slices: SliceMetrics[] | null;
};
