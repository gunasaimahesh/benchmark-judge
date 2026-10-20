import { useRef, useState, type ChangeEvent } from 'react';
import sampleCsv from './fixtures/sample.csv?raw';
import DatasetSummary from './components/DatasetSummary';
import Overview from './components/Overview';
import PerLabelTable from './components/PerLabelTable';
import DisagreementExplorer from './components/DisagreementExplorer';
import ConfusionMatrixView from './components/ConfusionMatrix';
import SliceTable from './components/SliceTable';
import Methodology from './components/Methodology';
import { analyzeRows, type AnalysisData } from './lib/analysis';
import { buildDisagreementsCsv, buildReportJson } from './lib/export';
import { formatPercent } from './lib/format';
import { parseCsv } from './lib/csv';
import { validateRows } from './lib/validation';
import type { MetricName, ModelId } from './types/benchmark';

type AppStatus = 'empty' | 'loading' | 'invalid' | 'valid';

type LoadedDataset = {
  filename: string;
  analysis: AnalysisData;
};

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function EmptyState({ onSample, onUpload }: { onSample: () => void; onUpload: () => void }) {
  return (
    <section className="card empty-state" aria-labelledby="empty-heading">
      <div className="empty-icon" aria-hidden="true">BJ</div>
      <p className="eyebrow">Local-first model evaluation</p>
      <h2 id="empty-heading">Upload prediction results to compare two models.</h2>
      <p className="empty-copy">
        Start with the story dataset or bring a CSV containing the true label and predictions
        from Model A and Model B. Your file never leaves this browser.
      </p>
      <div className="empty-actions">
        <button className="button button-primary" type="button" onClick={onSample}>Try sample dataset</button>
        <button className="button button-secondary" type="button" onClick={onUpload}>Upload CSV</button>
        <a className="text-link" href="/template.csv" download="benchmark-template.csv">Download template</a>
      </div>
      <div className="schema-hint">
        <span className="schema-label">Expected columns</span>
        <code>id, category?, true_label, model_a, model_b, text?</code>
      </div>
      <p className="privacy-note"><span aria-hidden="true">◌</span> Your file never leaves this browser.</p>
    </section>
  );
}

function ErrorPanel({ errors, onUpload }: { errors: string[]; onUpload: () => void }) {
  return (
    <section className="card error-panel" aria-labelledby="error-heading" role="alert">
      <div className="error-heading"><span className="error-icon" aria-hidden="true">!</span><div><p className="eyebrow">Upload needs attention</p><h2 id="error-heading">We couldn't analyze this CSV yet.</h2></div></div>
      <p>Fix the items below, then choose the file again. No partial metrics were calculated.</p>
      <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
      <button className="button button-secondary" type="button" onClick={onUpload}>Choose another CSV</button>
      <a className="text-link error-template-link" href="/template.csv" download="benchmark-template.csv">Download the working template</a>
    </section>
  );
}

function LoadingState() {
  return <section className="card loading-state" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><strong>Reading and validating your CSV…</strong><span>Everything is processed locally in this browser.</span></section>;
}

export default function App() {
  const [status, setStatus] = useState<AppStatus>('empty');
  const [dataset, setDataset] = useState<LoadedDataset | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [primaryMetric, setPrimaryMetric] = useState<MetricName>('macroF1');
  const [matrixModel, setMatrixModel] = useState<ModelId>('A');
  const [labelFilter, setLabelFilter] = useState('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const explorerRef = useRef<HTMLElement | null>(null);

  function processCsv(text: string, filename: string): void {
    setStatus('loading');
    setErrors([]);
    window.setTimeout(() => {
      const validation = validateRows(parseCsv(text));
      if (!validation.ok) {
        setDataset(null);
        setErrors(validation.errors);
        setStatus('invalid');
        return;
      }
      setDataset({ filename, analysis: analyzeRows(validation.rows, validation.columns) });
      setPrimaryMetric('macroF1');
      setLabelFilter('ALL');
      setStatus('valid');
    }, 20);
  }

  function loadSample(): void {
    processCsv(sampleCsv, 'email-triage-sample.csv');
  }

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    processCsv(await file.text(), file.name);
  }

  function resetDataset(): void {
    setDataset(null);
    setErrors([]);
    setStatus('empty');
    setLabelFilter('ALL');
  }

  function downloadReport(): void {
    if (!dataset) return;
    const { analysis } = dataset;
    const json = buildReportJson({
      rows: analysis.rows,
      labelSet: analysis.labelSet,
      metricsA: analysis.metricsA,
      metricsB: analysis.metricsB,
      selectedMetric: primaryMetric,
      sourceFilename: dataset.filename,
      columns: analysis.columns,
    });
    downloadFile('benchmark-report.json', json, 'application/json');
  }

  function downloadDisagreements(): void {
    if (!dataset) return;
    const { analysis } = dataset;
    downloadFile('benchmark-disagreements.csv', buildDisagreementsCsv(analysis.disagreements, analysis.columns), 'text/csv;charset=utf-8');
  }

  function showLabelEvidence(label: string): void {
    setLabelFilter(label);
    window.setTimeout(() => explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  }

  const analysis = dataset?.analysis;
  const disagreementCountForLabel = (label: string) => analysis?.disagreements.filter((row) => row.trueLabel === label).length ?? 0;

  return (
    <main className="app-shell">
      <input ref={fileInputRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
      <header className="site-header">
        <div>
          <p className="eyebrow">Research · Data · Scientific Computing</p>
          <h1>Benchmark Judge</h1>
          <p className="subtitle">Compare classification models with evidence.</p>
        </div>
        <div className="header-actions">
          <button className="button button-secondary" type="button" onClick={openFilePicker}>{status === 'valid' ? 'Load another CSV' : 'Upload CSV'}</button>
          <button className="button button-primary" type="button" disabled={!dataset} onClick={downloadReport}>Download report</button>
        </div>
      </header>

      {status === 'empty' && <EmptyState onSample={loadSample} onUpload={openFilePicker} />}
      {status === 'loading' && <LoadingState />}
      {status === 'invalid' && <ErrorPanel errors={errors} onUpload={openFilePicker} />}

      {status === 'valid' && analysis && (
        <div className="dashboard">
          <DatasetSummary rows={analysis.rows.length} labels={analysis.labelSet.groundTruth.length} categories={analysis.slices.length} disagreements={analysis.disagreements.length} filename={dataset.filename} columns={analysis.columns} />

          <Overview metric={primaryMetric} onMetricChange={setPrimaryMetric} metricsA={analysis.metricsA} metricsB={analysis.metricsB} comparisons={analysis.comparisons} mcnemar={analysis.mcnemar} groundTruthLabelCount={analysis.labelSet.groundTruth.length} />

          <PerLabelTable labelsA={analysis.metricsA.perLabel} labelsB={analysis.metricsB.perLabel} metric={primaryMetric} disagreementsForLabel={disagreementCountForLabel} onShowDisagreements={showLabelEvidence} />

          <DisagreementExplorer disagreements={analysis.disagreements} columns={analysis.columns} labelOrder={analysis.labelSet.groundTruth} labelFilter={labelFilter} onLabelFilterChange={setLabelFilter} explorerRef={explorerRef} />

          <ConfusionMatrixView matrices={analysis.confusionMatrices} model={matrixModel} onModelChange={setMatrixModel} />

          <SliceTable rows={analysis.rows} slices={analysis.slices} metric={primaryMetric} />

          <Methodology />

          <footer className="dashboard-footer">
            <div><span className="validated-badge"><span aria-hidden="true">✓</span> Calculated locally</span><span>Results describe {dataset.filename} only.</span></div>
            <div className="footer-actions"><button className="text-button" type="button" onClick={downloadDisagreements}>Download disagreements CSV</button><button className="text-button" type="button" onClick={resetDataset}>Start over</button></div>
          </footer>
        </div>
      )}
    </main>
  );
}
