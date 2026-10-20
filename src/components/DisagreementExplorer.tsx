import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { countDisagreementOutcomes, filterDisagreements, orderedDisagreementLabels, type OutcomeFilter } from '../lib/explorer';
import type { DatasetColumns, Disagreement, DisagreementOutcome } from '../types/benchmark';

type DisagreementExplorerProps = {
  disagreements: Disagreement[];
  columns: DatasetColumns;
  labelOrder: string[];
  labelFilter: string;
  onLabelFilterChange: (label: string) => void;
  explorerRef?: RefObject<HTMLElement | null>;
};

const PAGE_SIZE = 50;

const outcomeLabels: Record<OutcomeFilter, string> = {
  ALL: 'All',
  A_CORRECT_B_WRONG: 'A correct / B wrong',
  B_CORRECT_A_WRONG: 'B correct / A wrong',
  BOTH_WRONG: 'Both wrong',
};

function displayCategory(row: Disagreement): string {
  return row.category ?? '—';
}

function outcomeClass(outcome: DisagreementOutcome): string {
  if (outcome === 'A_CORRECT_B_WRONG') return 'outcome-a';
  if (outcome === 'B_CORRECT_A_WRONG') return 'outcome-b';
  return 'outcome-both';
}

function shortText(value: string | null): string {
  if (!value) return '—';
  return value.length > 62 ? `${value.slice(0, 59)}…` : value;
}

export default function DisagreementExplorer({ disagreements, columns, labelOrder, labelFilter, onLabelFilterChange, explorerRef }: DisagreementExplorerProps) {
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<Disagreement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const labels = useMemo(() => orderedDisagreementLabels(disagreements, labelOrder), [disagreements, labelOrder]);
  const categories = useMemo(() => [...new Set(disagreements.map((row) => row.category).filter((value): value is string => value !== null))].sort(), [disagreements]);

  const filteredRowsWithoutOutcome = useMemo(
    () => filterDisagreements(disagreements, {
      outcomeFilter: 'ALL',
      labelFilter,
      categoryFilter,
      search,
    }),
    [categoryFilter, disagreements, labelFilter, search],
  );
  const counts = useMemo(() => countDisagreementOutcomes(filteredRowsWithoutOutcome), [filteredRowsWithoutOutcome]);
  const filteredRows = useMemo(
    () => outcomeFilter === 'ALL'
      ? filteredRowsWithoutOutcome
      : filteredRowsWithoutOutcome.filter((row) => row.outcome === outcomeFilter),
    [filteredRowsWithoutOutcome, outcomeFilter],
  );

  useEffect(() => { setPage(1); }, [categoryFilter, labelFilter, outcomeFilter, search]);
  useEffect(() => { if (page > Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))) setPage(1); }, [filteredRows.length, page]);
  useEffect(() => {
    if (selectedRow && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [selectedRow]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageStart = filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, filteredRows.length);

  function clearFilters() {
    setOutcomeFilter('ALL');
    onLabelFilterChange('ALL');
    setCategoryFilter('ALL');
    setSearch('');
  }

  return (
    <section className="section-block explorer-section" ref={explorerRef} aria-labelledby="explorer-heading">
      <div className="section-heading-row compact-heading">
        <div>
          <p className="eyebrow">The evidence trail</p>
          <h2 id="explorer-heading">Disagreement explorer</h2>
        </div>
        <span className="section-hint">Find the rows behind a metric difference</span>
      </div>

      {disagreements.length === 0 ? (
        <div className="state-note"><strong>The models made the same prediction for every row in this dataset.</strong></div>
      ) : (
        <>
          <div className="outcome-chips" aria-label="Disagreement outcome filters">
            {(Object.keys(outcomeLabels) as OutcomeFilter[]).map((outcome) => (
              <button key={outcome} type="button" className={`outcome-chip ${outcomeFilter === outcome ? 'selected' : ''}`} aria-pressed={outcomeFilter === outcome} onClick={() => setOutcomeFilter(outcome)}>
                <span className={`chip-dot ${outcome === 'A_CORRECT_B_WRONG' ? 'chip-a' : outcome === 'B_CORRECT_A_WRONG' ? 'chip-b' : outcome === 'BOTH_WRONG' ? 'chip-both' : ''}`} aria-hidden="true" />
                {outcomeLabels[outcome]} <b>{counts[outcome]}</b>
              </button>
            ))}
          </div>

          <div className="filter-bar">
            <label>True label<select value={labelFilter} onChange={(event) => onLabelFilterChange(event.target.value)}><option value="ALL">All labels</option>{labels.map((label) => <option key={label} value={label}>{label}</option>)}</select></label>
            {columns.hasCategory && <label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="ALL">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>}
            <label className="search-field">Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID or label" /></label>
          </div>

          {filteredRows.length === 0 ? (
            <div className="state-note"><strong>No disagreements match these filters.</strong><button className="table-action" type="button" onClick={clearFilters}>Clear filters</button></div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table explorer-table">
                  <caption className="sr-only">Filtered model disagreements</caption>
                  <thead><tr><th scope="col">ID</th>{columns.hasCategory && <th scope="col">Category</th>}<th scope="col">True label</th><th scope="col">Model A</th><th scope="col">Model B</th><th scope="col">Outcome</th>{columns.hasText && <th scope="col">Text</th>}<th scope="col"><span className="sr-only">Details</span></th></tr></thead>
                  <tbody>
                    {visibleRows.map((row) => <tr key={`${row.id}-${row.sourceRow}`}><th scope="row">{row.id}</th>{columns.hasCategory && <td>{displayCategory(row)}</td>}<td>{row.trueLabel}</td><td>{row.modelA}</td><td>{row.modelB}</td><td><span className={`outcome-label ${outcomeClass(row.outcome)}`}>{outcomeLabels[row.outcome]}</span></td>{columns.hasText && <td className="truncated-cell" title={row.text ?? ''}>{shortText(row.text)}</td>}<td><button className="table-action" type="button" onClick={() => setSelectedRow(row)}>Inspect</button></td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className="pagination"><span>Showing {pageStart}–{pageEnd} of {filteredRows.length}</span><div><button className="pagination-button" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="pagination-button" type="button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
            </>
          )}
        </>
      )}

      <dialog ref={dialogRef} className="detail-dialog" onClose={() => setSelectedRow(null)}>
        {selectedRow && <>
          <div className="dialog-heading"><div><p className="eyebrow">Example evidence</p><h2>{selectedRow.id}</h2></div><button className="dialog-close" type="button" aria-label="Close details" onClick={() => dialogRef.current?.close()}>×</button></div>
          <div className="detail-grid">
            <div><span>Category</span><strong>{displayCategory(selectedRow)}</strong></div>
            <div><span>True label</span><strong>{selectedRow.trueLabel}</strong></div>
            <div><span>Model A prediction</span><strong>{selectedRow.modelA}</strong></div>
            <div><span>Model B prediction</span><strong>{selectedRow.modelB}</strong></div>
            <div><span>Outcome</span><strong className={`outcome-label ${outcomeClass(selectedRow.outcome)}`}>{outcomeLabels[selectedRow.outcome]}</strong></div>
            <div><span>Source row</span><strong>{selectedRow.sourceRow}</strong></div>
          </div>
          {selectedRow.text && <div className="detail-text"><span>Input text</span><p>{selectedRow.text}</p></div>}
          {Object.keys(selectedRow.extras).length > 0 && <div className="detail-text"><span>Extra columns</span><p>{Object.entries(selectedRow.extras).map(([key, value]) => `${key}: ${value}`).join(' · ')}</p></div>}
          <div className="dialog-footer"><button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>Close</button></div>
        </>}
      </dialog>
    </section>
  );
}
