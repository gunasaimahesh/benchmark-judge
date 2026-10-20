# Benchmark Judge — Complete Project Plan

> **Working tagline:** Compare two classification models on the same labeled examples and see where each one wins.

## 1. Project decision

Build **Benchmark Judge** for the Research, Data & Scientific Computing track.

Benchmark Judge is a local-first web application. A user uploads one CSV containing the ground-truth label and the predictions made by two classification models. The app calculates comparable metrics, breaks results down by category, renders confusion matrices, and lets the user inspect the individual examples where the models disagree.

The product must make one important distinction clear:

> It does not declare a model universally better. It shows which model performs better on this dataset, using the selected metric and category breakdown.

## 2. Why this project is the right choice

The project is intentionally designed around the buildathon constraints:

- **Useful:** model selection should be based on evidence rather than one accuracy number.
- **Demonstrable:** the built-in sample dataset can show one model winning overall while the other handles rare classes better.
- **Rebuildable:** all calculations run in the browser; no API key, backend, database, or live AI service is required.
- **Testable:** metric calculations and CSV validation are deterministic pure functions.
- **Track-aligned:** it is a data-analysis and scientific-computing tool, not just a generic dashboard.
- **Achievable:** the MVP supports two models and classification only, which keeps the scope realistic for a solo build.

## 3. Problem statement

People comparing classification models often look only at overall accuracy. That can hide important behavior when the dataset is imbalanced or when a model performs well on common classes but poorly on rare classes.

Users need a fast way to answer:

1. Which model has better overall performance?
2. Which model performs better for each class or category?
3. Are the differences meaningful, or are the models making mostly the same predictions?
4. Which exact examples explain the difference?

Benchmark Judge answers these questions from an uploaded prediction file without requiring the models to be run again.

## 4. Target user

Primary user: a student, researcher, data scientist, or ML engineer who already has:

- a labeled classification evaluation set;
- predictions from Model A;
- predictions from Model B; and
- a need to compare the models before choosing one.

The user should not need to know JavaScript or statistical programming. They should be able to upload the template CSV and understand the result from the dashboard.

## 5. MVP promise

After uploading a valid CSV, a user can see an overall comparison in under five seconds and can reach the exact rows behind a difference in two clicks or fewer.

The MVP supports:

- one CSV file;
- exactly two models;
- single-label classification;
- text or numeric labels treated as strings;
- optional category/group slices;
- accuracy, macro-F1, and balanced accuracy;
- per-category performance;
- confusion matrices;
- disagreement filtering;
- downloadable results; and
- a built-in sample dataset for an instant demo.

## 6. Explicit non-goals for the MVP

Do **not** build these in the first version:

- regression or continuous-value evaluation;
- multi-label classification;
- more than two models;
- model training or live model inference;
- prompt testing or an AI API integration;
- confidence-score calibration;
- a user account, server, database, or cloud storage;
- automated natural-language explanations of individual errors;
- statistical significance testing as a required feature;
- arbitrary data-cleaning pipelines; or
- a general-purpose spreadsheet editor.

These may be future ideas, but they are not part of the buildathon MVP.

## 7. Product positioning

### One-sentence pitch

**Benchmark Judge compares two classification models beyond a single accuracy number, showing category-level tradeoffs and the exact examples behind their disagreements.**

### Thirty-second demo pitch

“I upload the labels and predictions from two models. Benchmark Judge says Model A has higher accuracy, but Model B has higher macro-F1 because it handles the rare classes better. I can filter to the examples where only Model B was correct and inspect the true label and both predictions. This turns model selection into an evidence-based decision.”

### Honest limitation to state in the UI or README

Results are only as reliable as the uploaded labels and evaluation set. The app compares performance on the supplied data; it does not prove that one model will perform better on every future dataset.

## 8. Acceptance criteria

The feature is complete when all of the following are true:

1. A user can open the app without an API key or network connection.
2. A user can load the bundled sample data with one click.
3. A user can upload a valid CSV using the documented schema.
4. The app validates required headers and reports invalid row numbers clearly.
5. The app displays the number of rows, distinct labels, categories, and missing values.
6. The app displays accuracy, macro-F1, and balanced accuracy for both models.
7. The app identifies a winner or a tie for the selected comparison metric.
8. The app shows class/category-level metrics with support counts.
9. The app shows one confusion matrix per model with actual labels as rows and predicted labels as columns.
10. The app identifies rows where Model A and Model B disagree.
11. A user can filter disagreements by outcome and category.
12. A user can open a disagreement and see the row ID, category, true label, Model A prediction, and Model B prediction.
13. A user can download a machine-readable report of the calculated results.
14. Empty, invalid, equal-performance, no-disagreement, and large-but-valid states have clear messages.
15. Metric calculations have automated tests covering normal and boundary cases.
16. `npm test`, `npm run build`, and the documented Docker commands work without network access after dependencies are installed.

## 9. User flow

### First visit

1. User sees the product name, one-line explanation, and two primary actions:
   - **Try sample dataset**
   - **Upload CSV**
2. User sees a short schema hint and a link to download a CSV template.
3. No dashboard appears until a dataset is loaded.

### Upload flow

1. User selects or drops a `.csv` file.
2. The app reads the file entirely in the browser.
3. A validation summary appears.
4. If invalid, analysis is blocked and the user sees actionable row/header errors.
5. If valid, the app renders the dashboard and preserves the uploaded data in memory only.

### Analysis flow

1. User sees an overview with the dataset summary and metric cards.
2. User changes the primary comparison metric using a selector.
3. User opens category performance to find tradeoffs.
4. User switches between the two confusion matrices.
5. User opens the disagreement explorer and applies filters.
6. User clicks a row to inspect the exact prediction evidence.
7. User downloads the report.

## 10. CSV input contract

### Canonical schema

The downloadable template must contain these columns in this order:

```csv
id,category,true_label,model_a,model_b
example-001,common,cat,cat,dog
example-002,common,dog,dog,dog
example-003,rare,fish,bird,fish
```

### Column definitions

| Column | Required | Type | Meaning |
|---|---:|---|---|
| `id` | Yes | string | Unique identifier for the evaluated example. |
| `category` | No | string | Analysis group or slice. If omitted, the app uses `true_label` as the category. |
| `true_label` | Yes | string | Correct ground-truth class. |
| `model_a` | Yes | string | Prediction from the first model. |
| `model_b` | Yes | string | Prediction from the second model. |

Rules:

- Column names are case-sensitive in the MVP.
- Leading and trailing whitespace is trimmed from headers and cell values.
- Label case is preserved. `Cat` and `cat` are different labels.
- Extra columns are allowed and ignored.
- Blank values in `id`, `true_label`, `model_a`, or `model_b` are errors.
- If `category` is present, blank category values are errors.
- IDs must be unique.
- The file must be UTF-8 CSV.
- A file must contain at least one valid data row.
- MVP limit: 100,000 rows or 10 MB, whichever is reached first.

### Validation messages

Messages should be written for a non-technical user. Examples:

- “Missing required column: `model_b`.”
- “Row 14 has an empty `true_label`.”
- “Duplicate ID `example-007` appears on rows 8 and 19.”
- “This file contains 12.4 MB. The MVP limit is 10 MB.”
- “No data rows were found after the header.”

Show at most 20 row-level errors initially, followed by “and N more errors.”

## 11. Metric definitions

All calculations must be implemented as pure, deterministic functions. The UI must show the formula or a tooltip so users know what each number means.

Let `N` be the number of valid rows.

### Accuracy

```text
accuracy = number of correct predictions / N
```

Display as a percentage with two decimal places and the raw count, for example `184 / 200 (92.00%)`.

### Per-label precision, recall, and F1

For each true label `L`:

```text
precision(L) = TP(L) / (TP(L) + FP(L))
recall(L)    = TP(L) / (TP(L) + FN(L))
F1(L)        = 2 * precision(L) * recall(L) / (precision(L) + recall(L))
```

When a denominator is zero, display the metric as `0` and mark it as not observed where appropriate. Do not display `NaN` or infinity.

### Macro-F1

```text
macro_f1 = average of F1(L) across labels present in the ground truth
```

Macro-F1 is the default primary comparison metric because it prevents common classes from completely hiding poor performance on rare classes.

### Balanced accuracy

```text
balanced_accuracy = average of recall(L) across labels present in the ground truth
```

### Category metrics

For each category value, calculate the same metrics using only rows in that category. Show the category support count so users can judge whether a result is based on enough examples.

If the `category` column is omitted, use `true_label` as the category. This gives useful per-class performance without forcing users to duplicate a column.

### Confusion matrix

For each model:

- rows represent actual `true_label` values;
- columns represent predicted labels;
- each cell contains the number of examples;
- diagonal cells represent correct predictions;
- labels are the union of observed true and predicted labels;
- labels that appear only in predictions are still shown as columns and flagged as prediction-only labels.

The matrix must include a legend or text explanation. Color must not be the only way to understand a cell.

### Primary winner logic

The overview has a metric selector with these options:

1. Macro-F1 — default
2. Accuracy
3. Balanced accuracy

Compare unrounded values. If the absolute difference is less than `0.001` (0.1 percentage points), show **Tie / effectively equal**. Otherwise show Model A or Model B as the winner.

The interface must say `Winner by macro-F1`, `Winner by accuracy`, or `Winner by balanced accuracy`; never show an unqualified “best model.”

## 12. Disagreement model

A disagreement is any valid row where `model_a !== model_b` after trimming.

Each disagreement receives one outcome label:

| Outcome | Definition |
|---|---|
| `A correct / B wrong` | Model A equals the true label and Model B does not. |
| `B correct / A wrong` | Model B equals the true label and Model A does not. |
| `Both wrong` | Both predictions differ from the true label. |
| `Both correct` | Not a disagreement because both correct predictions must equal the same true label. |

The disagreement explorer must show:

- total disagreement count;
- counts for each outcome;
- category filter;
- outcome filter;
- search by ID or label;
- a sortable table; and
- a detail drawer or modal for a selected row.

The detail view must contain:

```text
Example ID
Category
True label
Model A prediction
Model B prediction
Outcome
```

If there are no disagreements, show: **“The models made the same prediction for every row in this dataset.”**

## 13. Dashboard information architecture

Use one page with a clear top-to-bottom flow. Avoid a complicated multi-route application.

### Header

- Product name: `Benchmark Judge`
- Subtitle: `Compare classification models with evidence.`
- Actions: `Load another CSV`, `Download report`

### Dataset summary strip

Show:

- rows analyzed;
- number of categories;
- number of ground-truth labels;
- number of disagreements;
- source filename; and
- a small `Validated` status indicator.

### Overview section

Include:

- primary metric selector;
- winner card with the metric name;
- Model A and Model B metric cards;
- metric comparison table for all three metrics;
- short interpretation sentence, such as “Model B leads macro-F1 by 4.2 percentage points.”

Do not generate a long AI-written explanation. Use deterministic sentences from the calculated values.

### Category performance section

Show a table with:

```text
Category | Support | Model A accuracy | Model B accuracy | Model A macro-F1 | Model B macro-F1 | Difference | Local winner
```

Sort by support descending by default. Allow sorting by the largest performance gap. Highlight rare categories with their support count, not only a color.

### Confusion matrix section

Provide a Model A / Model B toggle. Use an accessible HTML table with a heat-style background and visible numbers. Keep the matrix readable on narrow screens by allowing horizontal scrolling.

### Disagreement explorer section

Show the filter controls and table described in Section 12. Keep the selected row detail visible without losing the current filters.

### Methodology section

At the bottom, include a collapsible explanation of:

- expected input schema;
- metric definitions;
- how missing or invalid rows are handled; and
- the limitation that results describe this evaluation dataset only.

## 14. Required UI states

### Empty state

Message: `Upload prediction results to compare two models.`

Actions:

- `Try sample dataset`
- `Upload CSV`
- `Download template`

### Loading state

Show `Reading and validating your CSV…` with a progress-safe spinner. Do not show a fake percentage.

### Invalid file state

Show a clear error panel with:

- what is wrong;
- affected headers or rows;
- how to fix it; and
- a link to the template.

Do not render partial metrics from an invalid dataset.

### Valid state

Render the full dashboard and show the filename and row count.

### Equal-performance state

If both models have the same selected metric within the tie threshold, show a tie card and direct the user to category metrics and disagreements.

### No-disagreement state

Show the explicit no-disagreement message from Section 12 rather than an empty table with no explanation.

### Single-label state

Allow the analysis, but show a note that macro-F1 and balanced accuracy are less informative when only one ground-truth label is present.

## 15. Visual and interaction direction

Use a calm, analytical visual style rather than a flashy AI style.

- Light background with high-contrast cards.
- One accent color for Model A and a different accent color for Model B.
- Use text labels and icons in addition to red/green colors.
- Use tabular numerals for percentages and counts.
- Keep numbers to two decimal places for percentages.
- Use sticky section headings only if they do not reduce mobile space.
- Make tables responsive with horizontal scrolling.
- Ensure keyboard focus is visible.
- Use semantic headings, labels, table headers, and button names.
- Do not use color alone to communicate winner, error, or matrix intensity.

## 16. Sample dataset design

Bundle a deterministic sample CSV at `src/fixtures/sample.csv`.

The sample should contain approximately 200 rows across four labels:

- `common_a`: 110 rows;
- `common_b`: 55 rows;
- `rare_c`: 25 rows; and
- `rare_d`: 10 rows.

Design the predictions so that:

- Model A has higher overall accuracy because it performs very well on common classes;
- Model B has higher macro-F1 or balanced accuracy because it handles `rare_c` and `rare_d` better;
- the file contains at least 20 disagreements;
- the disagreement explorer has examples in every outcome category; and
- the results are stable and deterministic.

The UI should include a `Try the story dataset` button. The README should describe the intended demo result without promising exact percentages unless the bundled file is tested against those values.

## 17. Technical architecture

### Recommended stack

- React
- TypeScript
- Vite
- Plain CSS or a small local component style system
- A CSV parser such as Papa Parse
- Vitest for unit tests
- React Testing Library for component-level tests
- Node.js 22 for development and Docker

Avoid a backend. The app should process the file in the browser and keep it in memory. Do not send uploaded prediction data to a remote service.

### Why this architecture

- It is easy to run locally and deploy as a static site.
- It works offline after dependencies are installed.
- It keeps data private by default.
- Metric logic can be tested independently from the UI.
- A static deployment can be added later without changing the core design.

### Data flow

```text
CSV file or bundled fixture
        ↓
CSV parser
        ↓
normalization and validation
        ↓
typed BenchmarkRow[]
        ↓
metric engine
        ↓
dashboard view model
        ↓
cards, tables, matrices, filters, exports
```

The metric engine must not know about React components. The UI should consume typed results rather than reimplementing formulas.

## 18. Suggested project structure

```text
benchmark-judge/
├── .dockerignore
├── .gitignore
├── .nvmrc
├── .env.example
├── Dockerfile
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── public/
│   └── template.csv
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── types/
│   │   └── benchmark.ts
│   ├── lib/
│   │   ├── csv.ts
│   │   ├── validation.ts
│   │   ├── metrics.ts
│   │   ├── comparisons.ts
│   │   └── export.ts
│   ├── fixtures/
│   │   └── sample.csv
│   └── components/
│       ├── EmptyState.tsx
│       ├── UploadPanel.tsx
│       ├── DatasetSummary.tsx
│       ├── MetricSelector.tsx
│       ├── OverviewCards.tsx
│       ├── CategoryTable.tsx
│       ├── ConfusionMatrix.tsx
│       ├── DisagreementExplorer.tsx
│       ├── RowDetail.tsx
│       ├── Methodology.tsx
│       └── ErrorPanel.tsx
└── tests/
    ├── csv.test.ts
    ├── validation.test.ts
    ├── metrics.test.ts
    ├── comparisons.test.ts
    └── export.test.ts
```

The exact filenames can change during implementation, but keep parsing, validation, calculations, and UI concerns separate.

## 19. Core TypeScript data model

Use explicit types similar to these:

```ts
export type BenchmarkRow = {
  id: string;
  category: string;
  trueLabel: string;
  modelA: string;
  modelB: string;
  sourceRow: number;
};

export type MetricName = 'accuracy' | 'macroF1' | 'balancedAccuracy';

export type ModelMetrics = {
  total: number;
  correct: number;
  accuracy: number;
  macroF1: number;
  balancedAccuracy: number;
  perLabel: Record<string, LabelMetrics>;
};

export type LabelMetrics = {
  support: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
  f1: number;
};

export type DisagreementOutcome =
  | 'A_CORRECT_B_WRONG'
  | 'B_CORRECT_A_WRONG'
  | 'BOTH_WRONG';
```

Keep `sourceRow` so validation and detail views can point back to the original CSV row.

## 20. Calculation implementation plan

Implement in this order:

1. `parseCsv(text)` — parse headers and rows without calculating anything.
2. `validateRows(parsed)` — return either valid `BenchmarkRow[]` or structured errors.
3. `getLabelSet(rows, model)` — return sorted labels from true and predicted values.
4. `calculateLabelMetrics(rows, model)` — calculate TP, FP, FN, precision, recall, and F1.
5. `calculateModelMetrics(rows, model)` — calculate accuracy, macro-F1, balanced accuracy, and totals.
6. `calculateCategoryMetrics(rows)` — group by category and calculate the same metrics.
7. `buildConfusionMatrix(rows, model)` — use actual rows and predicted columns.
8. `findDisagreements(rows)` — classify and retain the original row fields.
9. `compareModels(metrics, metricName)` — calculate difference and winner using the tie threshold.
10. `buildExportPayload(results)` — produce stable, serializable output for downloads.

Use the same metric functions for the overview and category tables. Do not duplicate formulas in components.

## 21. Export behavior

Provide two download actions:

### Download benchmark report

Download `benchmark-report.json` containing:

- generated timestamp;
- source filename;
- row count;
- label list;
- category list;
- selected primary metric;
- Model A overall metrics;
- Model B overall metrics;
- category metrics;
- winner and difference;
- disagreement counts; and
- the methodology version.

### Download disagreements

Download `benchmark-disagreements.csv` containing:

```csv
id,category,true_label,model_a,model_b,outcome
```

The exports must use the calculated in-memory results and must not make a network request.

## 22. Error and edge-case policy

Implement and test these cases deliberately:

- missing required header;
- extra columns;
- empty file;
- only header and no rows;
- quoted commas inside a cell;
- newline inside a quoted cell if supported by the parser;
- duplicate IDs;
- blank required values;
- blank category values when the column exists;
- labels containing spaces or punctuation;
- numeric-looking labels such as `1` and `01`;
- a model predicting a label never present in the ground truth;
- one ground-truth label;
- all predictions correct;
- all predictions wrong;
- models making identical predictions for every row;
- a tie within 0.1 percentage points;
- categories with only one row; and
- the maximum accepted file size or row count.

Do not silently drop rows. If a row is invalid, block analysis and show the row number.

## 23. Testing plan

### Unit tests — required

#### CSV and validation

- Parses the canonical CSV format.
- Trims header and cell whitespace.
- Preserves label case.
- Uses `true_label` as category when `category` is absent.
- Rejects missing required columns.
- Rejects blank required cells.
- Rejects duplicate IDs.
- Accepts extra columns and ignores them.
- Reports source row numbers in errors.

#### Metrics

- Calculates accuracy for a simple known dataset.
- Calculates precision, recall, and F1 for at least two labels.
- Calculates macro-F1 as the mean of label F1 values.
- Calculates balanced accuracy as the mean of label recall values.
- Treats prediction-only labels as errors without crashing.
- Does not return `NaN` or infinity for zero denominators.
- Produces correct confusion-matrix orientation.
- Produces correct category subsets.

#### Comparisons

- Identifies Model A as the winner.
- Identifies Model B as the winner.
- Returns a tie within the configured threshold.
- Classifies all three disagreement outcomes.
- Returns an empty disagreement list when predictions are identical.

#### Exports

- Produces valid JSON with the required top-level fields.
- Produces CSV with the required headers.
- Escapes commas and quotes in exported values.

### Component tests — recommended

- Empty state shows sample and upload actions.
- Valid sample data renders the overview cards.
- Metric selector changes the displayed winner.
- Invalid upload shows errors and no dashboard.
- Disagreement filters change the visible rows.
- Clicking a disagreement shows its details.

### Manual smoke test

Before submission, run this exact flow:

1. Start the app.
2. Click `Try the story dataset`.
3. Verify the overview renders.
4. Change the primary metric.
5. Open a category row.
6. Toggle the confusion matrix model.
7. Filter disagreements to `B correct / A wrong`.
8. Open a row detail.
9. Download both exports.
10. Refresh the page and verify no stale dataset is incorrectly shown.
11. Upload an invalid CSV and verify the error state.

## 24. Implementation phases

Build in small, working increments. Commit after each phase.

### Phase 0 — Project setup

Deliverables:

- React + TypeScript + Vite app;
- Node version pinned in `.nvmrc`;
- lockfile committed;
- basic README;
- test command configured;
- `.env.example` containing a comment that no environment variables are required; and
- initial empty state visible in the browser.

Done when:

- `npm install` succeeds;
- `npm run dev` opens the app;
- `npm test` runs at least one test; and
- the project has a clean initial commit.

### Phase 1 — CSV parsing and validation

Deliverables:

- canonical parser;
- required-header validation;
- row normalization;
- duplicate and blank-cell checks;
- file-size and row-count limits;
- structured errors with source rows;
- template download; and
- unit tests for validation.

Done when an invalid file is blocked with actionable messages and a valid file becomes typed rows.

### Phase 2 — Metric engine

Deliverables:

- accuracy;
- per-label precision, recall, and F1;
- macro-F1;
- balanced accuracy;
- category grouping;
- confusion matrices;
- disagreement classification; and
- comparison/winner logic.

Done when the metric test suite passes on hand-calculated examples.

### Phase 3 — Upload and overview dashboard

Deliverables:

- upload/drop zone;
- sample dataset button;
- dataset summary strip;
- primary metric selector;
- model metric cards;
- winner/tie card;
- metric comparison table; and
- deterministic interpretation sentence.

Done when a judge can load the sample dataset and understand the main result without scrolling through raw data.

### Phase 4 — Category and confusion-matrix views

Deliverables:

- category table;
- support counts;
- sorting by support and performance gap;
- Model A / Model B confusion-matrix toggle;
- visible matrix values; and
- methodology explanation.

Done when users can discover that overall and rare-category results differ.

### Phase 5 — Disagreement explorer

Deliverables:

- outcome summary counts;
- category filter;
- outcome filter;
- text search;
- sortable table;
- row detail drawer/modal; and
- empty disagreement state.

Done when the demo can move from a metric difference to a concrete example in two clicks or fewer.

### Phase 6 — Exports and polish

Deliverables:

- JSON benchmark report;
- CSV disagreement export;
- responsive layout;
- keyboard-accessible controls;
- visible focus states;
- useful empty/error states;
- sample data tuned for the demo; and
- final README screenshots.

Done when the complete smoke test in Section 23 passes.

### Phase 7 — Rebuild and submission hardening

Deliverables:

- Dockerfile;
- `.dockerignore`;
- production build;
- offline test execution;
- README run/test/Docker instructions;
- public GitHub repository; and
- 2–3 minute demo video.

Done when a clean Docker build and offline test command pass from the project root.

## 25. Package scripts

The final `package.json` should expose predictable commands:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

If the selected Vite template uses different TypeScript commands, keep the same behavior and document the actual commands in the README.

## 26. Docker and rebuild plan

Use Node 22 and install only from the committed lockfile.

Recommended Dockerfile shape:

```dockerfile
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

The `.dockerignore` should exclude:

```text
node_modules
dist
.git
.DS_Store
coverage
```

Verify with:

```bash
docker build -t benchmark-judge .
docker run --rm --network none benchmark-judge npm test
docker run --rm --network none -p 4173:4173 benchmark-judge
```

The application must not require a network call at startup or during CSV analysis.

## 27. README requirements

The README must include:

1. Project name and one-sentence purpose.
2. Screenshot or short demo GIF if available.
3. The problem being solved.
4. The canonical CSV schema.
5. Metric definitions.
6. How to run locally.
7. How to run tests.
8. How to build and run Docker.
9. A short explanation of the sample dataset.
10. Privacy note: uploaded data stays in the browser and is not sent to an API.
11. Known limitations and non-goals.
12. Buildathon track and OmniRush-built project note.
13. Live demo URL, if deployed.

Recommended local instructions:

```bash
npm ci
npm run dev
```

Recommended test instructions:

```bash
npm test
npm run build
```

## 28. Buildathon demo script

Record a 2–3 minute screen capture with this sequence:

### 0:00–0:20 — Problem

“Overall accuracy can hide poor performance on rare classes. I built Benchmark Judge to compare two models using the same labeled predictions.”

### 0:20–0:40 — Load data

Click `Try the story dataset`. Briefly show the CSV schema and the dataset summary.

### 0:40–1:15 — Overall result

Show the accuracy, macro-F1, and balanced-accuracy cards. Point out that the selected metric determines the winner.

Say:

“Model A wins accuracy because it handles the common classes very well. But the result changes when we use macro-F1.”

### 1:15–1:40 — Category tradeoff

Open the category table and highlight the rare categories. Show the support count so the viewer can interpret the result responsibly.

### 1:40–2:10 — Evidence

Open the disagreement explorer, filter to `B correct / A wrong`, and click one example. Show the true label and both predictions.

Say:

“This is the evidence behind the metric difference—not just a bar chart.”

### 2:10–2:30 — Export and finish

Download the report and briefly show the methodology section. End with:

“Benchmark Judge helps choose the right model for the data and the metric that actually matters.”

## 29. OmniRush build prompt sequence

Use the following prompts in order so the work is traceable and incremental. Do not ask for the entire application in one prompt.

### Prompt 1 — Plan and inspect

```text
We are building Benchmark Judge, a local-first React and TypeScript web app for the Research, Data & Scientific Computing track. It compares two classification models from one CSV containing id, optional category, true_label, model_a, and model_b. It must work offline without an AI API or backend.

Before writing code, inspect the workspace and propose a short implementation plan based on benchmark-judge-plan.md. Confirm the MVP scope and list the first files you will create. Do not implement yet.
```

### Prompt 2 — Set up the project

```text
Set up the project using the agreed React + TypeScript + Vite stack. Add a lockfile, Node 22 pin, test command, Dockerfile, .dockerignore, .env.example, and a minimal README. Render an accessible empty state with actions for Upload CSV, Try sample dataset, and Download template. Run the smallest meaningful checks and report the exact commands and results.
```

### Prompt 3 — Implement the data layer

```text
Implement CSV parsing, normalization, validation, and the typed BenchmarkRow model from benchmark-judge-plan.md. Keep this logic independent of React. Add tests for required headers, whitespace, missing values, duplicate IDs, optional category fallback, extra columns, quoted values, and source-row errors. Run the tests and fix failures before moving on.
```

### Prompt 4 — Implement metrics

```text
Implement deterministic metric functions for accuracy, per-label precision/recall/F1, macro-F1, balanced accuracy, category metrics, confusion matrices, disagreement outcomes, and the metric-based winner with a 0.001 tie threshold. Add hand-calculated tests, including prediction-only labels and zero denominators. Do not add an AI explanation layer.
```

### Prompt 5 — Build the dashboard

```text
Build the upload flow, sample dataset flow, dataset summary, metric selector, overview cards, category table, confusion matrix toggle, disagreement explorer, row detail view, and methodology section. Use semantic HTML, visible keyboard focus, and text in addition to color. Keep all calculations in the data layer. Test the real user flow with the bundled sample data.
```

### Prompt 6 — Export and polish

```text
Add benchmark-report.json and benchmark-disagreements.csv downloads. Tune the deterministic sample dataset so Model A wins a common-class-heavy metric while Model B demonstrates a rare-class advantage. Add all required empty, invalid, tie, single-label, and no-disagreement states. Run unit tests, build, and the manual smoke test.
```

### Prompt 7 — Rebuild checklist

```text
Act as a buildathon reviewer. Check the project against benchmark-judge-plan.md and the buildathon requirements: lockfile, pinned runtime, Dockerfile, README, test command, offline behavior, no machine-specific paths, no secrets, and a reproducible sample demo. Run docker build and docker run --rm --network none benchmark-judge npm test. Fix any issue you find, then report the exact evidence.
```

## 30. Risk register and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Users provide inconsistent CSV headers | High | Publish one canonical template and show exact missing-header errors. |
| Overall accuracy hides rare-class behavior | High | Default to macro-F1, show balanced accuracy, and expose category metrics. |
| The app feels like a generic dashboard | Medium | Make the disagreement explorer the centerpiece and include the evidence trail. |
| Sample data does not show an interesting tradeoff | High | Test the bundled fixture and document its expected qualitative story. |
| Large CSV freezes the browser | Medium | Enforce 100,000-row/10 MB limits and show a clear limit message. |
| Confusion matrix is unreadable on small screens | Medium | Use horizontal scrolling, compact labels, and visible cell values. |
| Tiny metric differences are overinterpreted | Medium | Use a 0.1 percentage-point tie threshold and show raw support counts. |
| API/network failure breaks the demo | High | Do not use a runtime AI or data API. Keep all analysis local. |
| Scope expands into training or regression | High | Treat the non-goals as fixed until the MVP is complete. |
| Judges cannot reproduce the project | High | Commit lockfile, pin Node 22, add Dockerfile, and test with `--network none`. |

## 31. Stretch goals, only after the MVP

Implement at most one or two of these after the full acceptance criteria pass:

1. Bootstrap confidence interval for the accuracy difference.
2. Paired win/loss/tie visualization.
3. CSV column mapping for common aliases.
4. Print-friendly HTML report.
5. Shareable URL using only encoded non-sensitive sample data.
6. Support for a third model behind an explicit scope extension.

Do not sacrifice validation, tests, Docker, or the disagreement explorer for a stretch goal.

## 32. Final submission checklist

### Product

- [ ] Empty state is understandable.
- [ ] Sample dataset works with one click.
- [ ] Valid CSV upload works.
- [ ] Invalid CSV errors are actionable.
- [ ] Accuracy, macro-F1, and balanced accuracy are correct.
- [ ] Category performance is visible.
- [ ] Both confusion matrices work.
- [ ] Disagreement filters work.
- [ ] Row detail shows the evidence.
- [ ] JSON and CSV exports download correctly.
- [ ] No API key or network is needed.

### Engineering

- [ ] Unit tests cover parsing, validation, metrics, comparisons, and exports.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Docker image builds.
- [ ] Tests pass inside Docker with `--network none`.
- [ ] Node version is pinned.
- [ ] Lockfile is committed.
- [ ] No absolute machine-specific paths exist.
- [ ] No secrets are committed.

### Submission

- [ ] Public GitHub repository is connected to the buildathon entry.
- [ ] README includes setup, tests, Docker, schema, metrics, and limitations.
- [ ] Screenshots or a demo video are included.
- [ ] The demo video is 2–3 minutes and follows the evidence story.
- [ ] The project is submitted before the published deadline.
- [ ] The listed OmniRush sessions match the actual implementation history.

## 33. Definition of done

Benchmark Judge is ready to submit when a new user can go from the empty state to an evidence-backed model comparison using only the bundled sample dataset, and a judge can rebuild the project from a clean Linux environment, run the tests offline, and understand the project from the README without needing a private key or additional service.
