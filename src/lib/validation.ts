import {
  MAX_DATA_ROWS,
  MAX_FILE_SIZE_BYTES,
  type ParsedCsv,
  type RawCsvRecord,
  parseCsv,
} from './csv';
import type { BenchmarkRow, DatasetColumns } from '../types/benchmark';

export const REQUIRED_COLUMNS = ['id', 'true_label', 'model_a', 'model_b'] as const;
export const OPTIONAL_COLUMNS = ['category', 'text'] as const;
const CANONICAL_COLUMNS = new Set<string>([
  ...REQUIRED_COLUMNS,
  ...OPTIONAL_COLUMNS,
]);

export type ValidationSuccess = {
  ok: true;
  rows: BenchmarkRow[];
  columns: DatasetColumns;
};

export type ValidationFailure = {
  ok: false;
  errors: string[];
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

function formatColumnList(headers: string[]): string {
  if (headers.length === 0) return '(none)';
  return headers.map((header) => `\`${header}\``).join(', ');
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function rowNumber(recordIndex: number): number {
  // Papa's header-aware `row` index is zero-based over parsed data rows. The
  // spreadsheet header is row 1, so the first data row is row 2.
  return recordIndex + 2;
}

function valueAt(record: RawCsvRecord, header: string): string | undefined {
  const value = record[header];
  return typeof value === 'string' ? value : undefined;
}

function actualFieldCount(message: string): number | null {
  const match = message.match(/parsed\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function parserErrorMessage(
  error: NonNullable<ParsedCsv['errors']>[number],
  headers: string[],
): string {
  const row = typeof error.row === 'number' ? rowNumber(error.row) : null;
  if (
    error.code === 'TooFewFields' ||
    error.code === 'TooManyFields' ||
    error.type === 'FieldMismatch'
  ) {
    const actual = actualFieldCount(error.message);
    if (row !== null && actual !== null) {
      return `Row ${row} has ${actual} values, but the header has ${headers.length} columns.`;
    }
    if (row !== null) {
      return `Row ${row} does not have the same number of values as the header (${headers.length} columns).`;
    }
  }
  return row === null ? `CSV parsing error: ${error.message}` : `Row ${row}: ${error.message}`;
}

function capErrors(errors: string[]): string[] {
  if (errors.length <= 20) return errors;
  return [...errors.slice(0, 20), `and ${errors.length - 20} more errors.`];
}

/**
 * Validate a ParsedCsv and turn its rows into the app's canonical data type.
 * An overload accepting source text is provided for small consumers that do
 * not need to keep the intermediate parse result.
 */
export function validateRows(parsed: ParsedCsv): ValidationResult;
export function validateRows(text: string): ValidationResult;
export function validateRows(input: ParsedCsv | string): ValidationResult {
  const parsed = typeof input === 'string' ? parseCsv(input) : input;
  const errors: string[] = [];

  if (parsed.tooLarge || parsed.byteLength > MAX_FILE_SIZE_BYTES) {
    errors.push(`This file is ${formatSize(parsed.byteLength)}. The limit is 10 MB.`);
    return { ok: false, errors: capErrors(errors) };
  }

  const headers = parsed.headers;
  const headerSet = new Set(headers);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headerSet.has(column));
  if (missingColumns.length > 0) {
    for (const column of missingColumns) {
      errors.push(
        `Missing required column: \`${column}\`. Found columns: ${formatColumnList(headers)} (column names are case-sensitive).`,
      );
    }
  }

  // Without the required columns there is no meaningful row conversion to do,
  // but retain parser errors in case they explain a malformed upload too.
  if (parsed.errors.length > 0) {
    const mismatchRows = new Set<number>();
    for (const parseError of parsed.errors) {
      if (
        typeof parseError.row === 'number' &&
        (parseError.type === 'FieldMismatch' ||
          parseError.code === 'TooFewFields' ||
          parseError.code === 'TooManyFields')
      ) {
        mismatchRows.add(parseError.row);
      }
      errors.push(parserErrorMessage(parseError, headers));
    }

    // Row-level validation still runs for the columns that are present. It is
    // useful to report a blank value or duplicate ID alongside a missing
    // required column, without inventing an empty-cell error for that column.
    addCellErrors(parsed.records, headers, mismatchRows, errors);
  } else {
    addCellErrors(parsed.records, headers, new Set<number>(), errors);
  }

  if (parsed.records.length === 0) {
    errors.push('No data rows were found after the header.');
  } else if (parsed.records.length > MAX_DATA_ROWS) {
    errors.push(
      `This file has ${parsed.records.length.toLocaleString('en-US')} data rows. The limit is ${MAX_DATA_ROWS.toLocaleString('en-US')} rows.`,
    );
  }

  const duplicateErrors = duplicateIdErrors(parsed.records, headers);
  errors.push(...duplicateErrors);

  if (errors.length > 0) {
    return { ok: false, errors: capErrors(errors) };
  }

  const columns: DatasetColumns = {
    headers: [...headers],
    hasCategory: headerSet.has('category'),
    hasText: headerSet.has('text'),
    extras: headers.filter((header) => !CANONICAL_COLUMNS.has(header)),
  };

  const rows = parsed.records.map((record, index) => ({
    id: valueAt(record, 'id')!,
    category: columns.hasCategory ? valueAt(record, 'category')! : null,
    trueLabel: valueAt(record, 'true_label')!,
    modelA: valueAt(record, 'model_a')!,
    modelB: valueAt(record, 'model_b')!,
    text: columns.hasText ? valueAt(record, 'text') ?? '' : null,
    extras: Object.fromEntries(
      columns.extras.map((header) => [header, valueAt(record, header) ?? '']),
    ),
    sourceRow: rowNumber(index),
  } satisfies BenchmarkRow));

  return { ok: true, rows, columns };
}

function addCellErrors(
  records: RawCsvRecord[],
  headers: string[],
  mismatchRows: Set<number>,
  errors: string[],
): void {
  const hasCategory = headers.includes('category');
  for (const [index, record] of records.entries()) {
    if (mismatchRows.has(index)) continue;

    for (const column of REQUIRED_COLUMNS) {
      if (!headers.includes(column)) continue;
      if ((valueAt(record, column) ?? '') === '') {
        errors.push(`Row ${rowNumber(index)} has an empty \`${column}\`.`);
      }
    }
    if (hasCategory && (valueAt(record, 'category') ?? '') === '') {
      errors.push(`Row ${rowNumber(index)} has an empty \`category\`.`);
    }
  }
}

function duplicateIdErrors(records: RawCsvRecord[], headers: string[]): string[] {
  if (!headers.includes('id')) return [];

  const occurrences = new Map<string, number[]>();
  records.forEach((record, index) => {
    const id = valueAt(record, 'id');
    if (!id) return;
    const rows = occurrences.get(id) ?? [];
    rows.push(rowNumber(index));
    occurrences.set(id, rows);
  });

  return [...occurrences.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(
      ([id, rows]) =>
        `Duplicate ID \`${id}\` appears on rows ${rows.join(' and ')}.`,
    );
}
