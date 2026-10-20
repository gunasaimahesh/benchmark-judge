import type { DatasetColumns } from '../types/benchmark';

type DatasetSummaryProps = {
  rows: number;
  labels: number;
  categories: number;
  disagreements: number;
  filename: string;
  columns: DatasetColumns;
};

export default function DatasetSummary({ rows, labels, categories, disagreements, filename, columns }: DatasetSummaryProps) {
  return (
    <section className="summary-strip" aria-label="Validated dataset summary">
      <div className="summary-source">
        <span className="validated-badge"><span aria-hidden="true">✓</span> Validated</span>
        <strong title={filename}>{filename}</strong>
      </div>
      <div className="summary-stat"><b>{rows.toLocaleString()}</b><span>rows analyzed</span></div>
      <div className="summary-stat"><b>{labels}</b><span>ground-truth labels</span></div>
      {columns.hasCategory && <div className="summary-stat"><b>{categories}</b><span>categories</span></div>}
      <div className="summary-stat"><b>{disagreements}</b><span>disagreements</span></div>
    </section>
  );
}
