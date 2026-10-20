# Benchmark Judge

**Compare classification models beyond one accuracy number.** Upload the same labeled evaluation examples and predictions from two models, then inspect the per-label tradeoffs and the exact rows behind their disagreements.

Benchmark Judge is a local-first project for the **Research, Data & Scientific Computing** track of the OmniRush Frontier Buildathon.

## What it does

Benchmark Judge answers:

- Which model wins on accuracy, macro-F1, or balanced accuracy?
- Does the winner change when rare labels matter more?
- Which labels explain the difference?
- Is the paired accuracy difference distinguishable from chance on this evaluation set?
- Which exact examples did the models disagree on?

The app runs all analysis in the browser. Uploaded files are not sent to an API or stored on a server.

## Try it

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite and click **Try sample dataset**. The bundled synthetic email-triage dataset demonstrates the main story:

- Model A has higher accuracy: **86.5% vs 84.0%**.
- Model B has higher macro-F1: **80.6% vs 68.2%**.
- Model B has higher balanced accuracy: **82.3% vs 63.6%**.
- The models disagree on 46 examples.
- Model A catches 2 of 10 malware examples; Model B catches 8 of 10.

The sample is synthetic and illustrative. It is not a claim about real email-security performance.

## CSV format

Download the in-app template or prepare a CSV with these required columns:

```csv
id,category,true_label,model_a,model_b,text
row-001,work,safe,safe,safe,Agenda for Monday's planning meeting
row-002,work,phishing,safe,phishing,Verify your password to avoid account suspension
```

| Column | Required | Description |
|---|---:|---|
| `id` | Yes | Unique example identifier. |
| `true_label` | Yes | Ground-truth class. |
| `model_a` | Yes | Model A prediction. |
| `model_b` | Yes | Model B prediction. |
| `category` | No | A real slice dimension such as source, language, or mailbox. |
| `text` | No | Input content shown in the disagreement detail view. |

Labels are case-sensitive. Blank required values, blank categories when the column exists, duplicate IDs, malformed rows, files over 10 MB, and files over 100,000 data rows are rejected with row-aware messages. Extra named columns are preserved in the row detail.

## Metrics

- **Accuracy:** correct predictions divided by all rows.
- **Per-label precision, recall, and F1:** calculated over the whole dataset.
- **Macro-F1:** mean F1 across ground-truth labels. Prediction-only labels are shown but excluded from the average.
- **Balanced accuracy:** mean recall across ground-truth labels.
- **McNemar exact test:** a paired exact test for the accuracy difference only. Its p-value describes this evaluation set; it does not guarantee future performance.

The methodology panel in the app explains the formulas, rounding, slice behavior, and limitations.

## Main workflow

1. Upload a prediction CSV or load the sample.
2. Review the overview cards and switch the primary comparison metric.
3. Inspect per-label precision, recall, F1, support, and evidence counts.
4. Filter disagreements by outcome, true label, category, or search term.
5. Open a row to see the true label, both predictions, input text, and extra columns.
6. Compare the shared-axis confusion matrices.
7. Download the JSON report or disagreement CSV.

## Development

Node 22 is the reference runtime. The version is pinned in `.nvmrc`.

```bash
npm ci
npm run dev
npm test
npm run build
```

Generate the deterministic sample fixture again with:

```bash
npm run generate:sample
```

The sample story test checks the committed fixture's counts, metrics, disagreements, confusion-matrix rows, and McNemar value.

## Docker and offline verification

```bash
docker build -t benchmark-judge .
docker run --rm --network none benchmark-judge npm test
docker run --rm -p 4173:4173 benchmark-judge
```

Then open <http://localhost:4173>. The runtime app has no network dependency; the `--network none` command is the offline test proof.

## Project structure

```text
src/lib/                 CSV, validation, metrics, statistics, exports
src/components/          Dashboard sections and evidence explorer
src/fixtures/            Deterministic sample dataset
scripts/                 Sample data generator
tests/                   Data-layer and story tests
benchmark-judge-plan.md  Original project plan
benchmark-judge-plan-v2.md
```

## Limitations and non-goals

The MVP supports exactly two models and single-label classification. It does not train models, run live inference, support regression or multi-label classification, connect to an AI API, or upload data to a backend. Results describe the supplied evaluation set only.

## Buildathon note

This project was built in OmniRush for the Research, Data & Scientific Computing track. Add the final demo video, live URL if deployed, and OmniRush session list when submitting.
