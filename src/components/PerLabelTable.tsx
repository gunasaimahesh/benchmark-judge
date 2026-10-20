import type { LabelMetrics, MetricName } from '../types/benchmark';
import { formatPercent, formatPoints } from '../lib/format';
import { metricLabel } from '../lib/analysis';

type PerLabelTableProps = {
  labelsA: LabelMetrics[];
  labelsB: LabelMetrics[];
  metric: MetricName;
  disagreementsForLabel: (label: string) => number;
  onShowDisagreements: (label: string) => void;
};

function selectedLabelMetric(label: LabelMetrics, metric: MetricName): number {
  return metric === 'macroF1' ? label.f1 : label.recall;
}

function labelMetricText(label: LabelMetrics): string {
  return `P ${formatPercent(label.precision)} · R ${formatPercent(label.recall)} · F1 ${formatPercent(label.f1)}`;
}

export default function PerLabelTable({ labelsA, labelsB, metric, disagreementsForLabel, onShowDisagreements }: PerLabelTableProps) {
  return (
    <section className="section-block" aria-labelledby="labels-heading">
      <div className="section-heading-row compact-heading">
        <div>
          <p className="eyebrow">Where the difference comes from</p>
          <h2 id="labels-heading">Per-label performance</h2>
        </div>
        <span className="section-hint">Gap in {metric === 'macroF1' ? 'F1' : 'recall'} follows the selected metric</span>
      </div>
      <div className="table-wrap">
        <table className="data-table label-table">
          <caption className="sr-only">Per-label precision, recall, and F1 metrics</caption>
          <thead>
            <tr>
              <th scope="col">Label</th>
              <th scope="col">Support</th>
              <th scope="col">Model A</th>
              <th scope="col">Model B</th>
              <th scope="col">Gap in {metric === 'macroF1' ? 'F1' : 'recall'} (B − A)</th>
              <th scope="col">Better on this label</th>
              <th scope="col">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {labelsA.map((labelA, index) => {
              const labelB = labelsB[index];
              const valueA = selectedLabelMetric(labelA, metric);
              const valueB = selectedLabelMetric(labelB, metric);
              const difference = valueB - valueA;
              const winner = Math.abs(difference) < 0.001 ? 'Tie' : difference > 0 ? 'Model B' : 'Model A';
              const count = disagreementsForLabel(labelA.label);
              return (
                <tr key={labelA.label}>
                  <th scope="row">
                    <span className="label-name">{labelA.label}</span>
                    {labelA.predictionOnly && <span className="label-note">prediction-only · excluded from macro-F1</span>}
                  </th>
                  <td>{labelA.support}</td>
                  <td><span className="metric-stack">{labelMetricText(labelA)}<small>{labelA.truePositive} / {labelA.support} recall</small></span></td>
                  <td><span className="metric-stack">{labelMetricText(labelB)}<small>{labelB.truePositive} / {labelB.support} recall</small></span></td>
                  <td className={difference > 0.001 ? 'positive-gap' : difference < -0.001 ? 'negative-gap' : ''}>{formatPoints(difference)}</td>
                  <td><span className={`winner-pill winner-${winner === 'Model A' ? 'a' : winner === 'Model B' ? 'b' : 'tie'}`}>{winner}</span></td>
                  <td>
                    <button className="table-action" type="button" disabled={count === 0} onClick={() => onShowDisagreements(labelA.label)}>
                      Show {count} disagreement{count === 1 ? '' : 's'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="table-footnote">Recall is shown with counts so a 100% score on a small class is easy to interpret.</p>
    </section>
  );
}
