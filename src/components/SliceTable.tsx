import type { MetricName, SliceMetrics } from '../types/benchmark';
import { formatPercent, formatPoints } from '../lib/format';
import { metricLabel } from '../lib/analysis';
import { slicesHaveSingleLabels } from '../lib/metrics';
import type { BenchmarkRow } from '../types/benchmark';

type SliceTableProps = {
  rows: BenchmarkRow[];
  slices: SliceMetrics[];
  metric: MetricName;
};

export default function SliceTable({ rows, slices, metric }: SliceTableProps) {
  if (!rows.some((row) => row.category !== null)) return null;
  if (slicesHaveSingleLabels(rows)) {
    return (
      <section className="section-block" aria-labelledby="slices-heading">
        <div className="section-heading-row compact-heading"><div><p className="eyebrow">Optional slice dimension</p><h2 id="slices-heading">Category slices</h2></div></div>
        <div className="state-note">Each category contains only one true label, so per-category F1 would be misleading. Use the per-label table above.</div>
      </section>
    );
  }

  return (
    <section className="section-block" aria-labelledby="slices-heading">
      <div className="section-heading-row compact-heading"><div><p className="eyebrow">Optional slice dimension</p><h2 id="slices-heading">Category slices</h2></div><span className="section-hint">Small slices are noisy, so check support.</span></div>
      <div className="table-wrap">
        <table className="data-table slice-table">
          <caption className="sr-only">Performance by category slice</caption>
          <thead><tr><th scope="col">Category</th><th scope="col">Support</th><th scope="col">Model A {metricLabel(metric)}</th><th scope="col">Model B {metricLabel(metric)}</th><th scope="col">Gap (B − A)</th><th scope="col">Better in this slice</th></tr></thead>
          <tbody>
            {slices.map((slice) => {
              const a = slice.modelA[metric];
              const b = slice.modelB[metric];
              const difference = b - a;
              const winner = Math.abs(difference) < 0.001 ? 'Tie' : difference > 0 ? 'Model B' : 'Model A';
              return <tr key={slice.category}><th scope="row">{slice.category}</th><td>{slice.support}</td><td>{formatPercent(a)}</td><td>{formatPercent(b)}</td><td>{formatPoints(difference)}</td><td><span className={`winner-pill winner-${winner === 'Model A' ? 'a' : winner === 'Model B' ? 'b' : 'tie'}`}>{winner}</span></td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <p className="table-footnote">Slice metrics use only the rows in that category. They should be interpreted together with support.</p>
    </section>
  );
}
