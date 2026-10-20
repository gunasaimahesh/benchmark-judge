import { describe, expect, it } from 'vitest';
import {
  buildConfusionMatrix,
  calculateModelMetrics,
  calculateSliceMetrics,
  disagreementOutcome,
  findDisagreements,
  slicesHaveSingleLabels,
} from '../src/lib/metrics';
import { getLabelSet } from '../src/lib/labels';
import type { BenchmarkRow } from '../src/types/benchmark';

function row(
  id: string,
  trueLabel: string,
  modelA: string,
  modelB: string,
  category: string | null = null,
): BenchmarkRow {
  return {
    id,
    category,
    trueLabel,
    modelA,
    modelB,
    text: null,
    extras: {},
    sourceRow: Number(id.replace(/\D/g, '')) + 1,
  };
}

describe('labels and classification metrics', () => {
  it('orders labels by support then alphabetically and puts prediction-only labels last', () => {
    const rows = [
      row('1', 'z', 'z', 'q'),
      row('2', 'a', 'x', 'a'),
      row('3', 'z', 'z', 'z'),
      row('4', 'a', 'a', 'a'),
      row('5', 'b', 'b', 'b'),
    ];
    expect(getLabelSet(rows)).toEqual({
      groundTruth: ['a', 'z', 'b'],
      predictionOnly: ['q', 'x'],
    });
  });

  it('calculates accuracy, per-label metrics, macro-F1, and balanced accuracy', () => {
    const rows = [
      row('1', 'cat', 'cat', 'cat'),
      row('2', 'cat', 'dog', 'cat'),
      row('3', 'dog', 'dog', 'cat'),
      row('4', 'dog', 'bird', 'dog'),
    ];
    const labels = getLabelSet(rows);
    const metrics = calculateModelMetrics(rows, 'A', labels);

    expect(metrics).toMatchObject({ total: 4, correct: 2, accuracy: 0.5 });
    expect(metrics.perLabel).toEqual([
      expect.objectContaining({
        label: 'cat',
        support: 2,
        predicted: 1,
        truePositive: 1,
        falsePositive: 0,
        falseNegative: 1,
        precision: 1,
        recall: 0.5,
        f1: 2 / 3,
      }),
      expect.objectContaining({
        label: 'dog',
        support: 2,
        predicted: 2,
        truePositive: 1,
        falsePositive: 1,
        falseNegative: 1,
        precision: 0.5,
        recall: 0.5,
        f1: 0.5,
      }),
      expect.objectContaining({ label: 'bird', predictionOnly: true, support: 0, precision: 0, recall: 0, f1: 0 }),
    ]);
    expect(metrics.macroF1).toBeCloseTo(7 / 12, 12);
    expect(metrics.balancedAccuracy).toBe(0.5);
  });

  it('uses ground-truth labels only for macro-F1 and never returns NaN', () => {
    const rows = [row('1', 'cat', 'unseen', 'unseen')];
    const metrics = calculateModelMetrics(rows, 'A');
    expect(metrics.macroF1).toBe(0);
    expect(metrics.balancedAccuracy).toBe(0);
    expect(metrics.perLabel.find((item) => item.label === 'unseen')).toMatchObject({
      predictionOnly: true,
      precision: 0,
      recall: 0,
      f1: 0,
    });
    expect(metrics.perLabel.every((item) => Number.isFinite(item.f1))).toBe(true);
  });

  it('computes slice metrics from each slice and detects single-label slices', () => {
    const rows = [
      row('1', 'cat', 'cat', 'cat', 'north'),
      row('2', 'cat', 'dog', 'cat', 'north'),
      row('3', 'dog', 'dog', 'cat', 'south'),
      row('4', 'dog', 'dog', 'dog', 'south'),
    ];
    const labels = getLabelSet(rows);
    const slices = calculateSliceMetrics(rows, labels);
    expect(slices.map((slice) => slice.category)).toEqual(['north', 'south']);
    expect(slices[0].support).toBe(2);
    expect(slices[0].modelA.total).toBe(2);
    expect(slices[0].modelA.macroF1).toBeCloseTo(2 / 3, 12);
    expect(slicesHaveSingleLabels(rows)).toBe(true);
    expect(
      slicesHaveSingleLabels([
        row('1', 'cat', 'cat', 'cat', 'north'),
        row('2', 'dog', 'dog', 'cat', 'south'),
      ]),
    ).toBe(true);
    expect(slicesHaveSingleLabels(rows.map((item) => ({ ...item, category: null })))).toBe(false);
  });
});

describe('confusion matrices and disagreements', () => {
  it('uses true labels as rows and one shared label order for both models', () => {
    const rows = [
      row('1', 'cat', 'cat', 'dog'),
      row('2', 'cat', 'dog', 'cat'),
      row('3', 'dog', 'bird', 'dog'),
    ];
    const labels = getLabelSet(rows);
    const matrixA = buildConfusionMatrix(rows, 'A', labels);
    const matrixB = buildConfusionMatrix(rows, 'B', labels);
    expect(matrixA.rowLabels).toEqual(['cat', 'dog']);
    expect(matrixA.columnLabels).toEqual(['cat', 'dog', 'bird']);
    expect(matrixA.matrix).toEqual([
      [1, 1, 0],
      [0, 0, 1],
    ]);
    expect(matrixB.columnLabels).toEqual(matrixA.columnLabels);
    expect(matrixB.matrix).toEqual([
      [1, 1, 0],
      [0, 1, 0],
    ]);
  });

  it('classifies all three disagreement outcomes and ignores equal predictions', () => {
    const rows = [
      row('1', 'cat', 'cat', 'dog'),
      row('2', 'cat', 'dog', 'cat'),
      row('3', 'cat', 'dog', 'bird'),
      row('4', 'cat', 'dog', 'dog'),
    ];
    expect(rows.map(disagreementOutcome)).toEqual([
      'A_CORRECT_B_WRONG',
      'B_CORRECT_A_WRONG',
      'BOTH_WRONG',
      null,
    ]);
    expect(findDisagreements(rows).map((item) => item.outcome)).toEqual([
      'A_CORRECT_B_WRONG',
      'B_CORRECT_A_WRONG',
      'BOTH_WRONG',
    ]);
    expect(findDisagreements(rows.map((item) => ({ ...item, modelB: item.modelA })))).toEqual([]);
  });
});
