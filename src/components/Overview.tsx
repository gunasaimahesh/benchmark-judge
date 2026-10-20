import type { Comparison, McNemarResult, MetricName, ModelMetrics } from '../types/benchmark';
import { describeMetricAgreement } from '../lib/comparisons';
import { formatPercent, formatPoints, formatPValue } from '../lib/format';
import { metricLabel } from '../lib/analysis';

type OverviewProps = {
  metric: MetricName;
  onMetricChange: (metric: MetricName) => void;
  metricsA: ModelMetrics;
  metricsB: ModelMetrics;
  comparisons: Record<MetricName, Comparison>;
  mcnemar: McNemarResult;
  groundTruthLabelCount: number;
};

const metricOptions: Array<{ value: MetricName; label: string }> = [
  { value: 'macroF1', label: 'Macro-F1' },
  { value: 'accuracy', label: 'Accuracy' },
  { value: 'balancedAccuracy', label: 'Balanced accuracy' },
];

function winnerText(winner: Comparison['winner']): string {
  return winner === 'tie' ? 'Tie' : `Model ${winner}`;
}

function metricDifference(comparison: Comparison): string {
  return comparison.winner === 'tie' ? 'Effectively equal' : formatPoints(comparison.difference);
}

function MetricCard({ model, metrics, primary }: { model: 'A' | 'B'; metrics: ModelMetrics; primary: MetricName }) {
  return (
    <article className={`metric-card model-${model.toLowerCase()}`}>
      <div className="metric-card-heading">
        <span className="model-dot" aria-hidden="true" />
        <span>Model {model}</span>
      </div>
      <strong>{formatPercent(metrics[primary])}</strong>
      <span className="metric-card-label">{metricLabel(primary)}</span>
      <span className="metric-card-count">Accuracy · {metrics.correct.toLocaleString()} / {metrics.total.toLocaleString()} correct</span>
    </article>
  );
}

export default function Overview({ metric, onMetricChange, metricsA, metricsB, comparisons, mcnemar, groundTruthLabelCount }: OverviewProps) {
  const selected = comparisons[metric];
  const lead = selected.winner === 'tie' ? null : Math.abs(selected.difference);

  return (
    <section className="section-block" aria-labelledby="overview-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Decision summary</p>
          <h2 id="overview-heading">Which model is better for this dataset?</h2>
        </div>
        <div className="metric-selector" aria-label="Primary comparison metric">
          {metricOptions.map((option) => (
            <button
              key={option.value}
              className={metric === option.value ? 'selected' : ''}
              type="button"
              aria-pressed={metric === option.value}
              onClick={() => onMetricChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="winner-card">
        <div>
          <span className="winner-kicker">Winner by {metricLabel(metric)}</span>
          <strong>{winnerText(selected.winner)}</strong>
          <span className="winner-explanation">
            {selected.winner === 'tie'
              ? 'The difference is under 0.1 percentage points.'
              : `Model ${selected.winner} leads by ${formatPoints(lead ?? 0).replace('+', '')}.`}
          </span>
        </div>
        <div className="winner-values" aria-label={`${metricLabel(metric)} values`}>
          <span><b>Model A</b>{formatPercent(metricsA[metric])}</span>
          <span><b>Model B</b>{formatPercent(metricsB[metric])}</span>
        </div>
      </div>

      <div className="metric-cards">
        <MetricCard model="A" metrics={metricsA} primary={metric} />
        <MetricCard model="B" metrics={metricsB} primary={metric} />
      </div>

      <div className="callout" role="status">
        <span className="callout-icon" aria-hidden="true">i</span>
        <p>{describeMetricAgreement(metricsA, metricsB)}</p>
      </div>

      {groundTruthLabelCount === 1 && (
        <div className="state-note" role="note">
          <strong>Single-label dataset.</strong> Macro-F1 and balanced accuracy are less informative when only one ground-truth label is present.
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table comparison-table">
          <caption className="sr-only">Comparison of all metrics</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Model A</th>
              <th scope="col">Model B</th>
              <th scope="col">Difference (B − A)</th>
              <th scope="col">Winner</th>
            </tr>
          </thead>
          <tbody>
            {metricOptions.map((option) => {
              const comparison = comparisons[option.value];
              return (
                <tr key={option.value} className={option.value === metric ? 'active-row' : ''}>
                  <th scope="row">{option.label}</th>
                  <td>{formatPercent(metricsA[option.value])}</td>
                  <td>{formatPercent(metricsB[option.value])}</td>
                  <td>{metricDifference(comparison)}</td>
                  <td><span className={`winner-pill winner-${comparison.winner.toLowerCase()}`}>{winnerText(comparison.winner)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="stat-note">
        {mcnemar.pValue < 0.05
          ? `The accuracy difference is statistically significant (McNemar exact test, p = ${formatPValue(mcnemar.pValue)}).`
          : `The accuracy difference is not statistically significant (McNemar exact test, p = ${formatPValue(mcnemar.pValue)}). It could plausibly be chance.`}
      </p>
    </section>
  );
}
