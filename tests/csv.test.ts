import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/lib/csv';

describe('parseCsv', () => {
  it('uses header parsing, trims headers and cells, and keeps labels as strings', () => {
    const parsed = parseCsv('\uFEFF id , true_label , model_a , model_b \n 1 , Cat , 01 , 1 \n');

    expect(parsed.headers).toEqual(['id', 'true_label', 'model_a', 'model_b']);
    expect(parsed.records).toEqual([
      { id: '1', true_label: 'Cat', model_a: '01', model_b: '1' },
    ]);
    expect(typeof parsed.records[0].id).toBe('string');
  });

  it('handles optional columns, quoted commas, and quoted newlines', () => {
    const parsed = parseCsv(
      'id,category,true_label,model_a,model_b,text\n' +
        'a,work,safe,safe,safe,"Subject, with a comma"\n' +
        'b,,spam,spam,spam,"Line one\nLine two"\n',
    );

    expect(parsed.records[0].text).toBe('Subject, with a comma');
    expect(parsed.records[1].text).toBe('Line one\nLine two');
    expect(parsed.records[1].category).toBe('');
  });

  it('ignores fully blank lines and rows whose fields are all empty', () => {
    const parsed = parseCsv(
      'id,true_label,model_a,model_b\n' +
        '\n' +
        ',,,\n' +
        'row-1,safe,safe,safe\n' +
        '\n\n',
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0].id).toBe('row-1');
  });

  it('retains Papa field-mismatch errors and extra values for validation', () => {
    const parsed = parseCsv(
      'id,true_label,model_a,model_b\n' +
        'short,safe,safe\n' +
        'long,safe,safe,safe,unexpected\n',
    );

    expect(parsed.errors).toHaveLength(2);
    expect(parsed.records[1].__parsed_extra).toEqual(['unexpected']);
  });
});
