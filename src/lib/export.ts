import type {
  BenchmarkReport,
  BenchmarkRow,
  DatasetColumns,
  Disagreement,
  LabelSet,
  MetricName,
  ModelMetrics,
} from '../types/benchmark';
import { getLabelSet } from './labels';
import {
  buildConfusionMatrix,
  calculateModelMetrics,
  calculateSliceMetrics,
  findDisagreements,
} from './metrics';
import { compareModels } from './comparisons';
import { mcnemarExact } from './stats';

export type BuildReportOptions = {
  filename?: string;
  sourceFilename?: string;
  generatedAt?: string;
  selectedMetric?: MetricName;
  hasCategory?: boolean;
  hasText?: boolean;
  columns?: Pick<DatasetColumns, 'hasCategory' | 'hasText'> | DatasetColumns;
};

export type BuildReportInput = BuildReportOptions & {
  rows: BenchmarkRow[];
  labelSet?: LabelSet;
  /** Alias accepted by report callers that use the output field name. */
  labels?: LabelSet;
  metricsA?: ModelMetrics;
  metricsB?: ModelMetrics;
  models?: { A: ModelMetrics; B: ModelMetrics };
  metrics?: { A: ModelMetrics; B: ModelMetrics };
  timestamp?: string;
  source?: {
    filename?: string;
    rows?: number;
    hasCategory?: boolean;
    hasText?: boolean;
  };
};

function uniqueCategories(rows: BenchmarkRow[]): string[] {
  const categories: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.category !== null && !seen.has(row.category)) {
      seen.add(row.category);
      categories.push(row.category);
    }
  }
  return categories;
}

function makeReport(input: BuildReportInput): BenchmarkReport {
  const rows = input.rows;
  const labelSet = input.labelSet ?? input.labels ?? getLabelSet(rows);
  const modelA =
    input.metricsA ?? input.models?.A ?? input.metrics?.A ?? calculateModelMetrics(rows, 'A', labelSet);
  const modelB =
    input.metricsB ?? input.models?.B ?? input.metrics?.B ?? calculateModelMetrics(rows, 'B', labelSet);
  const disagreements = findDisagreements(rows);
  const aCorrectBWrong = disagreements.filter((row) => row.outcome === 'A_CORRECT_B_WRONG').length;
  const bCorrectAWrong = disagreements.filter((row) => row.outcome === 'B_CORRECT_A_WRONG').length;
  const bothWrong = disagreements.filter((row) => row.outcome === 'BOTH_WRONG').length;
  const hasCategory =
    input.hasCategory ??
    input.source?.hasCategory ??
    input.columns?.hasCategory ??
    rows.some((row) => row.category !== null);
  const hasText =
    input.hasText ??
    input.source?.hasText ??
    input.columns?.hasText ??
    rows.some((row) => row.text !== null);
  const comparisons = {
    accuracy: compareModels(modelA, modelB, 'accuracy'),
    macroF1: compareModels(modelA, modelB, 'macroF1'),
    balancedAccuracy: compareModels(modelA, modelB, 'balancedAccuracy'),
  };

  return {
    tool: 'Benchmark Judge',
    methodologyVersion: '2',
    generatedAt: input.generatedAt ?? input.timestamp ?? new Date().toISOString(),
    source: {
      filename: input.filename ?? input.sourceFilename ?? input.source?.filename ?? 'dataset.csv',
      rows: rows.length,
      hasCategory,
      hasText,
    },
    labels: labelSet,
    categories: hasCategory ? uniqueCategories(rows) : null,
    selectedMetric: input.selectedMetric ?? 'macroF1',
    models: { A: modelA, B: modelB },
    comparisons,
    mcnemar: mcnemarExact(aCorrectBWrong, bCorrectAWrong),
    disagreements: {
      total: disagreements.length,
      aCorrectBWrong,
      bCorrectAWrong,
      bothWrong,
    },
    confusionMatrices: {
      A: buildConfusionMatrix(rows, 'A', labelSet),
      B: buildConfusionMatrix(rows, 'B', labelSet),
    },
    slices: hasCategory ? calculateSliceMetrics(rows, labelSet) : null,
  };
}

export function buildReport(input: BuildReportInput): BenchmarkReport;
export function buildReport(
  rows: BenchmarkRow[],
  labelSet: LabelSet,
  metricsA: ModelMetrics,
  metricsB: ModelMetrics,
  options?: BuildReportOptions,
): BenchmarkReport;
export function buildReport(
  rows: BenchmarkRow[],
  labelSet: LabelSet,
  metricsA: ModelMetrics,
  metricsB: ModelMetrics,
  timestampOrFilename?: string,
  filenameOrTimestamp?: string,
  selectedMetric?: MetricName,
): BenchmarkReport;
export function buildReport(
  inputOrRows: BuildReportInput | BenchmarkRow[],
  labelSet?: LabelSet,
  metricsA?: ModelMetrics,
  metricsB?: ModelMetrics,
  optionsOrTimestamp: BuildReportOptions | string = {},
  filenameOrTimestamp?: string,
  positionalMetric?: MetricName,
): BenchmarkReport {
  if (Array.isArray(inputOrRows)) {
    const options: BuildReportOptions =
      typeof optionsOrTimestamp === 'string'
        ? /^\d{4}-\d{2}-\d{2}T/.test(optionsOrTimestamp)
          ? {
              generatedAt: optionsOrTimestamp,
              filename: filenameOrTimestamp,
              selectedMetric: positionalMetric,
            }
          : {
              filename: optionsOrTimestamp,
              generatedAt: filenameOrTimestamp,
              selectedMetric: positionalMetric,
            }
        : optionsOrTimestamp;
    return makeReport({
      ...options,
      rows: inputOrRows,
      labelSet,
      metricsA,
      metricsB,
    });
  }
  return makeReport(inputOrRows);
}

function csvEscape(value: string | null | undefined): string {
  const text = value ?? '';
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

type DisagreementCsvOptions = {
  hasCategory?: boolean;
  hasText?: boolean;
  columns?: Pick<DatasetColumns, 'hasCategory' | 'hasText'> | DatasetColumns;
};

export function buildDisagreementsCsv(
  rowsOrDisagreements: BenchmarkRow[] | Disagreement[],
  options?: DisagreementCsvOptions,
): string;
export function buildDisagreementsCsv(
  rowsOrDisagreements: BenchmarkRow[] | Disagreement[],
  hasCategory?: boolean,
  hasText?: boolean,
): string;
export function buildDisagreementsCsv(
  rowsOrDisagreements: BenchmarkRow[] | Disagreement[],
  optionsOrHasCategory: DisagreementCsvOptions | boolean = {},
  positionalHasText?: boolean,
): string {
  const options: DisagreementCsvOptions =
    typeof optionsOrHasCategory === 'boolean'
      ? { hasCategory: optionsOrHasCategory, hasText: positionalHasText }
      : optionsOrHasCategory;
  const hasOutcomes = rowsOrDisagreements.every((row) => 'outcome' in row);
  const disagreements = hasOutcomes
    ? (rowsOrDisagreements as Disagreement[])
    : findDisagreements(rowsOrDisagreements as BenchmarkRow[]);
  const sourceRows = rowsOrDisagreements as BenchmarkRow[];
  const hasCategory =
    options.hasCategory ?? options.columns?.hasCategory ?? sourceRows.some((row) => row.category !== null);
  const hasText =
    options.hasText ?? options.columns?.hasText ?? sourceRows.some((row) => row.text !== null);

  const lines = ['id,category,true_label,model_a,model_b,outcome,text'];
  for (const disagreement of disagreements) {
    const source = disagreement.row ?? disagreement;
    lines.push(
      [
        source.id,
        hasCategory ? source.category : null,
        source.trueLabel,
        source.modelA,
        source.modelB,
        disagreement.outcome,
        hasText ? source.text : null,
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

export function buildReportJson(
  input: BuildReportInput | BenchmarkRow[],
  labelSet?: LabelSet,
  metricsA?: ModelMetrics,
  metricsB?: ModelMetrics,
  options?: BuildReportOptions,
): string {
  const report = Array.isArray(input)
    ? buildReport(input, labelSet!, metricsA!, metricsB!, options)
    : buildReport(input);
  return JSON.stringify(report, null, 2);
}

/** Descriptive aliases for callers that prefer the export format in the name. */
export const buildJsonReport = buildReportJson;
export const buildDisagreementCsv = buildDisagreementsCsv;
