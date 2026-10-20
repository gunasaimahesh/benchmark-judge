import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/lib/csv';
import { validateRows } from '../src/lib/validation';

const validCsv = [
  'id,category,true_label,model_a,model_b,text,source',
  'row-1,work,safe,safe,safe,Hello,import-a',
  'row-2,personal,spam,spam,safe,,import-b',
].join('\n');

describe('validateRows', () => {
  it('maps a valid parsed CSV to canonical rows and preserves extras', () => {
    const result = validateRows(parseCsv(validCsv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.columns).toEqual({
      headers: ['id', 'category', 'true_label', 'model_a', 'model_b', 'text', 'source'],
      hasCategory: true,
      hasText: true,
      extras: ['source'],
    });
    expect(result.rows[1]).toMatchObject({
      id: 'row-2',
      category: 'personal',
      trueLabel: 'spam',
      modelA: 'spam',
      modelB: 'safe',
      text: '',
      extras: { source: 'import-b' },
      sourceRow: 3,
    });
  });

  it('accepts a CSV without category and text and stores nulls', () => {
    const result = validateRows(parseCsv('id,true_label,model_a,model_b\n1,1,01,1\n'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]).toMatchObject({ category: null, text: null });
    expect(result.columns.hasCategory).toBe(false);
    expect(result.columns.hasText).toBe(false);
  });

  it('reports missing required columns with the found-columns hint', () => {
    const result = validateRows(parseCsv('id,true_label,model_a\n1,safe,safe\n'));
    expect(result).toEqual({
      ok: false,
      errors: [
        'Missing required column: `model_b`. Found columns: `id`, `true_label`, `model_a` (column names are case-sensitive).',
      ],
    });
  });

  it('keeps reporting present-column errors alongside missing columns', () => {
    const result = validateRows(
      parseCsv(
        'id,category,true_label,model_a\n' +
          'duplicate,work,safe,safe\n' +
          'duplicate,work,,phishing\n',
      ),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain('Missing required column: `model_b`. Found columns: `id`, `category`, `true_label`, `model_a` (column names are case-sensitive).');
    expect(result.errors).toContain('Row 3 has an empty `true_label`.');
    expect(result.errors).toContain('Duplicate ID `duplicate` appears on rows 2 and 3.');
    expect(result.errors).not.toContain('Row 2 has an empty `model_b`.');
  });

  it('rejects blank required cells and blank categories but allows blank text', () => {
    const result = validateRows(
      parseCsv(
        'id,category,true_label,model_a,model_b,text\n' +
          'row-1,,safe,safe,safe,\n' +
          ',work,spam,spam,spam,body\n',
      ),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain('Row 2 has an empty `category`.');
    expect(result.errors).toContain('Row 3 has an empty `id`.');
    expect(result.errors).not.toContain('Row 2 has an empty `text`.');
  });

  it('reports duplicate IDs, field counts, and spreadsheet row numbers', () => {
    const result = validateRows(
      parseCsv(
        'id,true_label,model_a,model_b\n' +
          'duplicate,safe,safe\n' +
          'duplicate,safe,safe,safe\n' +
          'last,spam,spam,spam,extra\n',
      ),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain('Row 2 has 3 values, but the header has 4 columns.');
    expect(result.errors).toContain('Row 4 has 5 values, but the header has 4 columns.');
    expect(result.errors).toContain('Duplicate ID `duplicate` appears on rows 2 and 3.');
  });

  it('enforces the 10 MB pre-parse size limit', () => {
    const result = validateRows(parseCsv(`id,true_label,model_a,model_b\n${'x'.repeat(10 * 1024 * 1024)}`));
    expect(result).toEqual({
      ok: false,
      errors: ['This file is 10.0 MB. The limit is 10 MB.'],
    });
  });

  it('enforces the 100,000 data-row limit and caps displayed errors', () => {
    const lines = ['id,true_label,model_a,model_b'];
    for (let index = 0; index < 100_001; index += 1) {
      lines.push(`row-${index},safe,safe,safe`);
    }
    const overLimit = validateRows(parseCsv(lines.join('\n')));
    expect(overLimit.ok).toBe(false);
    if (!overLimit.ok) {
      expect(overLimit.errors).toContain('This file has 100,001 data rows. The limit is 100,000 rows.');
    }

    const manyErrors = ['id,true_label,model_a,model_b'];
    for (let index = 0; index < 25; index += 1) manyErrors.push(`,safe,safe,safe`);
    const capped = validateRows(parseCsv(manyErrors.join('\n')));
    expect(capped.ok).toBe(false);
    if (!capped.ok) {
      expect(capped.errors).toHaveLength(21);
      expect(capped.errors.at(-1)).toBe('and 5 more errors.');
    }
  });
});
