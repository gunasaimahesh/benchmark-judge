export default function Methodology() {
  return (
    <section className="methodology-section">
      <details>
        <summary>Methodology and limitations</summary>
        <div className="methodology-grid">
          <div><h3>Input</h3><p>Required columns are <code>id</code>, <code>true_label</code>, <code>model_a</code>, and <code>model_b</code>. <code>category</code> and <code>text</code> are optional. Blank required values and duplicate IDs block analysis.</p></div>
          <div><h3>Metrics</h3><p>Macro-F1 averages F1 across ground-truth labels. Balanced accuracy averages per-label recall. Prediction-only labels are shown but excluded from macro-F1, matching the documented scikit-learn label selection.</p></div>
          <div><h3>Statistical check</h3><p>McNemar's exact test evaluates paired accuracy outcomes only. Its p-value describes this evaluation set; it is not a guarantee about future data and the MVP does not test macro-F1 significance.</p></div>
          <div><h3>Privacy</h3><p>CSV files are parsed in memory in this browser. Benchmark Judge has no backend, database, API key, or runtime network request.</p></div>
        </div>
      </details>
    </section>
  );
}
