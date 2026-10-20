import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateSampleCsv } from '../scripts/generate-sample.mjs';
import { parseCsv } from '../src/lib/csv';
import { getLabelSet } from '../src/lib/labels';
import {
  calculateModelMetrics,
  findDisagreements,
  buildConfusionMatrix,
} from '../src/lib/metrics';
import { mcnemarExact } from '../src/lib/stats';
import { validateRows } from '../src/lib/validation';

const here = path.dirname(fileURLToPath(import.meta.url));
const committedPath = path.resolve(here, '../src/fixtures/sample.csv');

function loadSample() {
  const result = validateRows(parseCsv(fs.readFileSync(committedPath, 'utf8')));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.rows;
}

describe('deterministic email-triage sample story', () => {
  it('matches the committed generated file', () => {
    const committed = fs.readFileSync(committedPath, 'utf8').replaceAll('\r\n', '\n');
    expect(generateSampleCsv().replaceAll('\r\n', '\n')).toBe(committed);
  });

  it('locks the exact support, metrics, and disagreement story', () => {
    const rows = loadSample();
    expect(rows).toHaveLength(200);
    const support = new Map<string, number>();
    for (const row of rows) support.set(row.trueLabel, (support.get(row.trueLabel) ?? 0) + 1);
    expect(Object.fromEntries(support)).toEqual({ safe: 110, spam: 55, phishing: 25, malware: 10 });

    const labels = getLabelSet(rows);
    expect(labels).toEqual({
      groundTruth: ['safe', 'spam', 'phishing', 'malware'],
      predictionOnly: [],
    });
    const modelA = calculateModelMetrics(rows, 'A', labels);
    const modelB = calculateModelMetrics(rows, 'B', labels);
    expect(modelA).toMatchObject({ total: 200, correct: 173, accuracy: 0.865 });
    expect(modelB).toMatchObject({ total: 200, correct: 168, accuracy: 0.84 });
    expect(modelA.macroF1).toBeCloseTo(0.681569, 4);
    expect(modelB.macroF1).toBeCloseTo(0.806436, 4);
    expect(modelA.balancedAccuracy).toBeCloseTo(0.636364, 4);
    expect(modelB.balancedAccuracy).toBeCloseTo(0.822727, 4);

    const expectedLabels = [
      ['safe', 110, 0.84375, 0.981818, 0.907563, 0.912621, 0.854545, 0.882629],
      ['spam', 55, 0.898305, 0.963636, 0.929825, 0.821429, 0.836364, 0.828829],
      ['phishing', 25, 0.909091, 0.4, 0.555556, 0.645161, 0.8, 0.714286],
      ['malware', 10, 1, 0.2, 0.333333, 0.8, 0.8, 0.8],
    ] as const;
    expectedLabels.forEach(([label, support, aPrecision, aRecall, aF1, bPrecision, bRecall, bF1], index) => {
      expect(modelA.perLabel[index]).toMatchObject({ label, support });
      expect(modelA.perLabel[index].precision).toBeCloseTo(aPrecision, 4);
      expect(modelA.perLabel[index].recall).toBeCloseTo(aRecall, 4);
      expect(modelA.perLabel[index].f1).toBeCloseTo(aF1, 4);
      expect(modelB.perLabel[index].precision).toBeCloseTo(bPrecision, 4);
      expect(modelB.perLabel[index].recall).toBeCloseTo(bRecall, 4);
      expect(modelB.perLabel[index].f1).toBeCloseTo(bF1, 4);
    });

    const disagreements = findDisagreements(rows);
    expect(disagreements).toHaveLength(46);
    expect(disagreements.filter((row) => row.outcome === 'A_CORRECT_B_WRONG')).toHaveLength(24);
    expect(disagreements.filter((row) => row.outcome === 'B_CORRECT_A_WRONG')).toHaveLength(19);
    expect(disagreements.filter((row) => row.outcome === 'BOTH_WRONG')).toHaveLength(3);
    expect(rows.filter((row) => row.modelA === row.trueLabel && row.modelB === row.trueLabel)).toHaveLength(149);
    expect(
      rows.filter(
        (row) =>
          row.modelA === row.modelB &&
          row.modelA !== row.trueLabel,
      ),
    ).toHaveLength(5);
    expect(mcnemarExact(24, 19).pValue).toBeCloseTo(0.542384, 6);

    const malware = disagreements.filter((row) => row.trueLabel === 'malware');
    expect(malware).toHaveLength(7);
    expect(malware.filter((row) => row.outcome === 'B_CORRECT_A_WRONG')).toHaveLength(6);
    expect(malware.filter((row) => row.outcome === 'BOTH_WRONG')).toHaveLength(1);

    const matrixA = buildConfusionMatrix(rows, 'A', labels);
    const matrixB = buildConfusionMatrix(rows, 'B', labels);
    const malwareRow = labels.groundTruth.indexOf('malware');
    expect(matrixA.matrix[malwareRow]).toEqual([6, 1, 1, 2]);
    expect(matrixB.matrix[malwareRow]).toEqual([1, 0, 1, 8]);
  });
});
