import Papa from 'papaparse';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_DATA_ROWS = 100_000;

/** A row exactly as Papa Parse returned it, including __parsed_extra on mismatch. */
export type RawCsvRecord = Record<string, string | string[] | undefined>;

export type ParsedCsv = {
  headers: string[];
  records: RawCsvRecord[];
  /** Compatibility aliases for callers that use Papa's row terminology. */
  readonly rows?: RawCsvRecord[];
  readonly data?: RawCsvRecord[];
  readonly rawRecords?: RawCsvRecord[];
  errors: Papa.ParseError[];
  /** UTF-8 byte length, used for the pre-parse file-size check. */
  byteLength: number;
  tooLarge: boolean;
};

function withParseMetadata(
  headers: string[],
  records: RawCsvRecord[],
  errors: Papa.ParseError[],
  byteLength: number,
  tooLarge: boolean,
): ParsedCsv {
  // The public enumerable shape is intentionally just `headers` and `records`,
  // matching the parse stage in the data flow. Validation metadata remains
  // available as normal properties without making raw-record snapshots noisy.
  const parsed = { headers, records } as ParsedCsv;
  Object.defineProperties(parsed, {
    errors: { value: errors, enumerable: false },
    byteLength: { value: byteLength, enumerable: false },
    tooLarge: { value: tooLarge, enumerable: false },
    rows: { value: records, enumerable: false },
    data: { value: records, enumerable: false },
    rawRecords: { value: records, enumerable: false },
  });
  return parsed;
}

function utf8ByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).byteLength;
  }

  // TextEncoder is present in supported browsers and Node. This fallback keeps
  // the helper usable in older test runners without changing the byte contract.
  return unescape(encodeURIComponent(value)).length;
}

function cleanHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim();
}

function cleanCell(value: string): string {
  return value.replace(/^\uFEFF/, '').trim();
}

/**
 * Parse a CSV using the input contract from the plan.
 *
 * Parsing deliberately returns Papa's raw objects. Validation, including
 * required columns and field-count errors, is kept in validation.ts so this
 * function remains useful for callers that only need to inspect a CSV parse.
 */
export function parseCsv(text: string): ParsedCsv {
  const byteLength = utf8ByteLength(text);
  const tooLarge = byteLength > MAX_FILE_SIZE_BYTES;

  // The size limit is checked before invoking Papa Parse. Returning an empty
  // parse result still gives validateRows a deterministic place to report the
  // actionable size error.
  if (tooLarge) {
    return withParseMetadata([], [], [], byteLength, tooLarge);
  }

  const result = Papa.parse<RawCsvRecord>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: cleanHeader,
    transform: cleanCell,
  });

  return withParseMetadata(
    result.meta.fields ?? [],
    result.data,
    result.errors,
    byteLength,
    tooLarge,
  );
}
