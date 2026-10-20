import type { ConfusionMatrix, ModelId } from '../types/benchmark';

type ConfusionMatrixProps = {
  matrices: { A: ConfusionMatrix; B: ConfusionMatrix };
  model: ModelId;
  onModelChange: (model: ModelId) => void;
};

export default function ConfusionMatrixView({ matrices, model, onModelChange }: ConfusionMatrixProps) {
  const matrix = matrices[model];
  const labelCount = matrix.columnLabels.length;

  return (
    <section className="section-block" aria-labelledby="matrix-heading">
      <div className="section-heading-row compact-heading">
        <div>
          <p className="eyebrow">Error shape</p>
          <h2 id="matrix-heading">Confusion matrix</h2>
        </div>
        <div className="metric-selector model-selector" aria-label="Confusion matrix model">
          {(['A', 'B'] as const).map((option) => (
            <button key={option} type="button" className={model === option ? 'selected' : ''} aria-pressed={model === option} onClick={() => onModelChange(option)}>
              Model {option}
            </button>
          ))}
        </div>
      </div>
      {labelCount > 30 ? (
        <div className="state-note"><strong>Matrix capped for readability.</strong> This dataset has {labelCount} labels. Confusion matrices are shown for up to 30; full counts remain available in the downloaded report.</div>
      ) : (
        <>
          <p className="matrix-legend">Rows are true labels, columns are predictions. <b>✓</b> marks correct predictions. Shading shows the share of each true-label row.</p>
          <div className="table-wrap matrix-wrap">
            <table className="matrix-table">
              <caption>Model {model} confusion matrix</caption>
              <thead>
                <tr>
                  <th scope="col">Actual \ Predicted</th>
                  {matrix.columnLabels.map((label) => <th scope="col" key={label}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.matrix.map((row, rowIndex) => {
                  const total = row.reduce((sum, value) => sum + value, 0);
                  return (
                    <tr key={matrix.rowLabels[rowIndex]}>
                      <th scope="row">{matrix.rowLabels[rowIndex]}</th>
                      {row.map((value, columnIndex) => {
                        const share = total === 0 ? 0 : value / total;
                        const isDiagonal = matrix.rowLabels[rowIndex] === matrix.columnLabels[columnIndex];
                        return (
                          <td
                            key={`${matrix.rowLabels[rowIndex]}-${matrix.columnLabels[columnIndex]}`}
                            className={isDiagonal ? 'matrix-diagonal' : ''}
                            title={`${value} of ${total} ${matrix.rowLabels[rowIndex]} (${(share * 100).toFixed(1)}%)`}
                            style={{ backgroundColor: value === 0 ? undefined : `rgba(${model === 'A' ? '40, 107, 193' : '224, 126, 42'}, ${0.07 + share * 0.55})` }}
                          >
                            {isDiagonal && <span aria-hidden="true">✓ </span>}{value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
