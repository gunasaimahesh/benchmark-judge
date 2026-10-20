import { describe, expect, it } from 'vitest';
import { buildDisagreementsCsv, buildReport, buildReportJson } from '../src/lib/export';
import type { BenchmarkRow } from '../src/types/benchmark';

function row(
  id: string,
  trueLabel: string,
  modelA: string,
  modelB: string,
  category: string | null,
  text: string | null,
): BenchmarkRow {
  return { id, category, trueLabel, modelA, modelB, text, extras: { source: 'fixture' }, sourceRow: 2 };
}

const rows = [
  row('1', 'cat', 'cat', 'dog', 'mail,one', 'quoted "subject", line\nnext'),
  row('2', 'dog', 'cat', 'dog', 'mail,one', null),
];

describe('exports', () => {
  it('builds a complete report with full precision and a testable timestamp', () => {
    const report = buildReport({
      rows,
      filename: 'results.csv',
      generatedAt: '2026-10-20T00:00:00.000Z',
      selectedMetric: 'accuracy',
    });

      expect(report).toMatchObject({
      tool: 'Benchmark Judge',
      methodologyVersion: '2',
      generatedAt: '2026-10-20T00:00:00.000Z',
      source: { filename: 'results.csv', rows: 2, hasCategory: true, hasText: true },
      selectedMetric: 'accuracy',
      disagreements: { total: 2, aCorrectBWrong: 1, bCorrectAWrong: 1, bothWrong: 0 },
    });
    expect(report.models.A.accuracy).toBe(0.5);
    expect(report.comparisons.accuracy.difference).toBe(0);
    expect(report.confusionMatrices.A.columnLabels).toEqual(['cat', 'dog']);
    expect(report.categories).toEqual(['mail,one']);
    expect(report.slices).toHaveLength(1);

    const parsed = JSON.parse(buildReportJson({ rows, generatedAt: 'stamp' }));
    expect(parsed.generatedAt).toBe('stamp');
    expect(parsed.models.A.perLabel[0].f1).toBe(2 / 3);
  });

  it('exports disagreement rows with the required header and CSV escaping', () => {
    const csv = buildDisagreementsCsv(rows, { hasCategory: true, hasText: true });
    expect(csv).toBe(
        'id,category,true_label,model_a,model_b,outcome,text\n' +
        '1,"mail,one",cat,cat,dog,A_CORRECT_B_WRONG,"quoted ""subject"", line\nnext"\n' +
        '2,"mail,one",dog,cat,dog,B_CORRECT_A_WRONG,\n',
    );
  });

  it('leaves optional fields empty when the input had no optional columns', () => {
    const csv = buildDisagreementsCsv(
      [row('1', 'cat', 'cat', 'dog', null, null)],
      { hasCategory: false, hasText: false },
    );
    expect(csv).toContain('1,,cat,cat,dog,A_CORRECT_B_WRONG,\n');
  });
});
