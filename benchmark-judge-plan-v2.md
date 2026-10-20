# Benchmark Judge — Plan v2 (deadline edition)

> **This file supersedes `benchmark-judge-plan.md`.** Where the two disagree, follow this file. Keep v1 in the repo as the planning trail.
>
> **Deadline:** The organizer's buildathon page lists **20 Oct 2026, 11:59 PM IST**. The page makes the README part of the submission, recommends a 2–3 minute demo video, and treats a live link as optional. This plan targets both the video and live link for a stronger presentation, but neither should block the core build or submission. Re-check the submission dashboard before the final upload.
>
> **How to use this file:** give it to the build agent and run the prompts in §17 in order. §2 is the clock; §10 is the demo story. The current workspace is the project/repository root; do not create a second nested `benchmark-judge/` directory unless you intentionally change the working directory for every command.

## 0. What changed from v1

1. The work is time-boxed with checkpoints, a 5 PM feature freeze, and an explicit cut order (§2).
2. The GitHub repo and first Docker build happen in Phase 0 instead of at the end; a live deploy is started early but is not a core-build blocker.
3. The sample dataset is fully specified as an exact count table with expected metrics. It is built right after the metric engine and locked by a story test (§10).
4. The sample has a concrete scenario (email triage) and a `text` column, so the row detail shows real evidence instead of repeating the table row.
5. The v1 "category performance" table is replaced by a **per-label table computed over the whole dataset**. Slice metrics appear only when the CSV has a real `category` column. There is no fallback from `category` to `true_label` (§5.6).
6. McNemar's exact test adds paired evidence about whether the accuracy gap is distinguishable from chance on this evaluation set (§6).
7. Macro-F1 is documented as equivalent to scikit-learn with `labels=` set to the ground-truth labels, and the sample's expected values were cross-checked with scikit-learn (§5.4, §10.3).
8. Fully blank CSV lines are ignored, so the trailing newline most exports add no longer fails validation (§4).
9. The disagreement table is paginated and the confusion matrix is capped at 30 labels (§5.7, §7).
10. Both confusion matrices share one label set and order (§5.7).
11. The Docker serve command no longer uses `--network none`, which would make the app unreachable (§13).
12. The overview states outright when the metrics disagree about the winner (§8.3).
13. The prompt sequence is split into smaller steps and the sample is built before the UI (§17).
14. Inconsistencies are resolved: one button name (**Try sample dataset**), no "missing values" count, one number format, a defined action for per-label rows, and gap columns that name their metric.

## 1. Product summary

**One-sentence pitch:** Benchmark Judge compares two classification models beyond a single accuracy number, showing per-label tradeoffs, whether the accuracy gap is distinguishable from chance on this evaluation set, and the exact examples behind their disagreements.

**User:** a student, researcher, data scientist, or ML engineer with one labeled evaluation set and predictions from two models, who needs to choose between them. No coding required.

**Promise:** after loading a CSV, the user sees the overall comparison in under five seconds and reaches the exact rows behind a difference in two clicks or fewer.

**Why not a notebook?** No code, no setup, nothing leaves the browser, and every metric links back to the concrete rows that produced it.

**Honest limitation** (methodology section and README): results describe this evaluation set only. They do not prove one model will be better on future data.

## 2. Schedule, checkpoints, and cut line

All times are IST on 20 Oct. If a phase starts late, push that phase back, never the freeze or submit times.

| Target | Phase | Exit criteria |
|---|---|---|
| 12:45–1:45 AM | Phase 0 — Setup (Prompt 1 + manual steps) | Repo pushed to GitHub; the empty state works locally; `docker build` succeeds; a live deploy is attempted if time allows |
| 1:45–3:30 AM | Phase 1 — Data layer, metrics, sample (Prompts 2–4) | All unit tests pass, including the sample story test |
| — | Sleep / break | If Phase 1 isn't done, finish it first thing. Do not start UI before the story test passes. |
| 9:00–11:00 AM | Phase 2 — Upload and overview (Prompt 5) | Sample loads; winner flips with the metric selector; callout and McNemar sentence visible |
| 11:00 AM–1:30 PM | Phase 3 — Per-label table and explorer (Prompt 6) | Per-label button, then a row, opens the evidence in two clicks |
| **2:00 PM** | **Checkpoint** | Full demo path works locally or on the live URL, if deployed. **Record a rough demo video now** (one pass, no editing) and keep it. |
| 2:00–4:00 PM | Phase 4 — Matrix, slices, exports, states (Prompt 7) | Smoke test in §14 passes |
| 4:00–5:00 PM | Phase 5 — README, Docker verification, screenshots (Prompt 8) | §19 engineering items checked |
| **5:00 PM** | **Feature freeze** | Bug fixes only after this point |
| 5:00–8:00 PM | Phase 6 — Final demo video | Recorded, uploaded, link works in a private window |
| 8:00–10:00 PM | Phase 7 — Submit | Submitted by 10 PM |
| 10:00–11:59 PM | Buffer | Nothing planned |

If the current clock is already past one of these target windows, do not try to recreate the old schedule. Run the phases in order with roughly 45 minutes for setup, 90 minutes for the data layer and story test, 120 minutes for the overview, 90 minutes for the evidence path, and the remaining time for rebuild checks and submission materials. Keep the 5 PM feature freeze and the 10 PM submission target fixed.

### Priority tiers

**Must** — the product, rebuild, or official submission basics depend on it:
- Sample dataset generated from §10, with the story test passing.
- CSV upload with header, blank-cell, duplicate-ID, field-count, and size validation, and readable errors.
- Template download.
- Overview: all three metrics for both models, metric selector, winner/tie card, metric-agreement callout.
- Per-label table with a "Show N disagreements" button per row.
- Disagreement explorer: outcome chips with counts, label filter, paginated table, row detail with `text`.
- Unit tests for parsing, validation, metrics, stats, and the sample story.
- README, Dockerfile, and offline test inside Docker.

**Should** — after Must, before the 5 PM freeze:
- Confusion matrices with the Model A / Model B toggle.
- McNemar sentence in the overview. (Implement `mcnemarExact` in Phase 1 regardless; it is about 20 lines.)
- Exports: `benchmark-report.json` and `benchmark-disagreements.csv`.
- Slice table (only when the CSV has `category`).
- Methodology section.
- Tie, no-disagreement, single-label, too-many-labels, and single-label-slices states.

**Submission boosters** — strongly recommended by the event page, but not blockers for the base submission:
- A 2–3 minute demo video showing the evidence path.
- A live URL if a static deployment is available.

**Could** — cut first:
- Component tests.
- Text search in the explorer.
- Sortable columns.
- Drag-and-drop upload (a file input is enough).
- Mobile polish beyond horizontal scrolling.
- Large-file stress testing (just enforce the limits).

### Cut order if behind at the 2 PM checkpoint

1. All **Could** items.
2. Slice table.
3. JSON report. Keep the disagreements CSV and change the demo's closing to that export.
4. McNemar sentence in the UI. Keep the function and its tests.
5. Confusion matrix, as a last resort.

**Never cut:** the sample story and its test, the metric flip and callout, the per-label table, the explorer with row detail, validation errors, the README, and the Docker offline test. If time is tight, preserve a rough local screen recording rather than delaying submission for a live deployment or edited video.

## 3. Scope

### The MVP supports
- One CSV file, exactly two models, single-label classification.
- Labels as case-sensitive strings (`Cat` ≠ `cat`, `1` ≠ `01`).
- Optional `category` (slices) and `text` (example content) columns.
- Accuracy, macro-F1, balanced accuracy, per-label precision/recall/F1, and McNemar's exact test on accuracy.
- Confusion matrices, a disagreement explorer, two exports, and a built-in sample dataset.

### Non-goals
Regression, multi-label, more than two models, training or live inference, AI APIs, confidence calibration, accounts/servers/databases, AI-written explanations, significance tests for macro-F1, data-cleaning pipelines, and spreadsheet editing.

## 4. CSV input contract

### Schema (this is `public/template.csv`)

```csv
id,category,true_label,model_a,model_b,text
row-001,work,safe,safe,safe,Agenda for Monday's planning meeting
row-002,work,phishing,safe,phishing,Verify your password to avoid account suspension
row-003,personal,spam,spam,safe,"You've won a free cruise, claim today"
row-004,personal,malware,safe,malware,invoice_2231.zip - open today
```

| Column | Required | Meaning |
|---|---|---|
| `id` | Yes | Unique example identifier |
| `true_label` | Yes | Ground-truth class |
| `model_a` | Yes | Model A's prediction |
| `model_b` | Yes | Model B's prediction |
| `category` | No | A slice dimension such as data source, language, or mailbox. It should not be derived from the label. |
| `text` | No | The example's input content. Shown truncated in the explorer and in full in the row detail. |

### Rules
- Parse with Papa Parse using `header: true`, `skipEmptyLines: 'greedy'`, and `dynamicTyping: false`.
- Column names are case-sensitive. Trim whitespace from headers and cells. Trimming also removes a UTF-8 BOM.
- Ignore fully blank lines, including a trailing newline and rows where every field is empty (`,,,,,`). Validate every other row; never silently drop a non-blank row.
- A blank `id`, `true_label`, `model_a`, or `model_b` is an error. A blank `category` is an error when the column exists. A blank `text` is allowed.
- IDs must be unique.
- A row whose field count doesn't match the header is an error.
- Extra named columns beyond the canonical columns are allowed and kept in `extras` for the row detail. Values without a matching header are not extra columns; they are field-count errors.
- Row numbers in messages are spreadsheet row numbers: the header is row 1, and the first data row is row 2. Blank lines in the middle of a file can shift the numbering; that is acceptable for the MVP.
- Limits: 10 MB, checked before parsing, and 100,000 data rows, checked after parsing.
- At least one data row is required.

### Validation messages
Write for non-technical users:
- "Missing required column: `model_b`. Found columns: `ID`, `True_Label`, … (column names are case-sensitive)."
- "Row 14 has an empty `true_label`."
- "Duplicate ID `row-007` appears on rows 8 and 19."
- "Row 31 has 4 values, but the header has 6 columns."
- "This file is 12.4 MB. The limit is 10 MB."
- "No data rows were found after the header."

Show at most 20 errors, then "and N more errors." An invalid file never renders partial metrics.

## 5. Metric definitions

All metric code is pure, deterministic TypeScript in `src/lib/` with no React imports. Components never re-implement formulas.

### 5.1 Label set (shared by both models)
- **Ground-truth labels:** the distinct `true_label` values, ordered by support descending, with ties alphabetical.
- **Prediction-only labels:** labels predicted by either model that never appear in `true_label`, ordered alphabetically and flagged in the UI.
- Use this single order everywhere: the per-label table, both confusion matrices, and the filters.

### 5.2 Accuracy
`accuracy = correct / N`, displayed as `173 / 200 · 86.5%`.

### 5.3 Per-label precision, recall, and F1 (over the whole dataset)
For each label L, using all rows:

```text
precision(L) = TP / (TP + FP)          0 when the model never predicts L
recall(L)    = TP / (TP + FN)          0 when L never appears in true_label
F1(L)        = 2TP / (2TP + FP + FN)   0 when TP = 0
```

This F1 form equals `2PR / (P + R)` whenever that is defined, and it never divides by zero. Never display `NaN` or `Infinity`.

### 5.4 Macro-F1
The mean of F1(L) over **ground-truth labels only**. Prediction-only labels are shown in the table but excluded from the average.

This is equivalent to scikit-learn's `f1_score(y_true, y_pred, labels=<ground-truth labels>, average='macro', zero_division=0)`. It differs from sklearn's default `f1_score(average='macro')` only when a model predicts a label that never appears in the ground truth. Say this in the methodology section.

### 5.5 Balanced accuracy
The mean of recall(L) over ground-truth labels. This is equivalent to scikit-learn's `balanced_accuracy_score`.

### 5.6 Slice metrics (only when the CSV has `category`)
- For each category, compute support, accuracy, macro-F1, and balanced accuracy using only that category's rows. Macro-F1 averages over the labels present in that slice's ground truth.
- With no `category` column, there is no slice table and no category filter. There is **no fallback to `true_label`**.
- If every category contains exactly one ground-truth label (`slicesHaveSingleLabels(rows)`), hide the slice table and show: "Each category contains only one true label, so per-category F1 would be misleading. Use the per-label table above."

Why: inside a slice that contains a single true label there are no false positives, so precision is always 100% and F1 collapses to a rescaled recall. That flatters any model that over-predicts rare classes.

### 5.7 Confusion matrices
- There is one matrix per model, both with **identical axes**. Rows are the ground-truth labels; columns are the ground-truth labels followed by the prediction-only labels.
- Every cell shows its count. Shading reflects the cell's share of its row, so rare-class rows stay readable. The cell title reads like "4 of 10 malware (40.0%)".
- Diagonal cells get a border and a ✓, so color is never the only cue.
- With more than 30 labels in total, don't render the matrix. Show: "This dataset has N labels. Confusion matrices are shown for up to 30. The full counts are in the downloaded report."

### 5.8 Winner logic
- Metric selector options: **Macro-F1** (default), **Accuracy**, **Balanced accuracy**.
- Compare unrounded values. If |B − A| < 0.001, show "Tie by macro-F1 (difference under 0.1 points)". Otherwise show "Winner by macro-F1: Model B".
- Never show an unqualified "best model."

### 5.9 Number formats
- Metrics are percentages with one decimal place, for example `86.5%`.
- Tables show differences signed as B − A, for example `−2.5 points`. The winner card states the winner's lead as a positive number, for example "ahead by 2.5 points".
- Differences are computed from unrounded values, so they can differ by 0.1 from the difference of the displayed percentages. The methodology section mentions this.
- p-values: two decimals when p ≥ 0.01, three decimals when 0.001 ≤ p < 0.01, otherwise `< 0.001`.
- Exports keep full precision.

## 6. Significance: McNemar's exact test (accuracy only)

Let b be the number of rows where A is correct and B is wrong, and c the number where B is correct and A is wrong. These are the explorer's first two outcome counts. Rows where both models are wrong do not count, even when their predictions differ.

```text
n = b + c
p = 1                                                   if n = 0
p = min(1, 2 × Σ_{k=0}^{min(b,c)} C(n, k) × 0.5^n)      otherwise
```

Compute the terms in log space (log binomial coefficient minus n·ln 2, then exponentiate and sum) so large n neither underflows nor overflows. This lives in `src/lib/stats.ts`.

The sentence under the overview's comparison table:
- When p < 0.05: "The accuracy difference is statistically significant (McNemar exact test, p = 0.01)."
- When p ≥ 0.05: "The accuracy difference is not statistically significant (McNemar exact test, p = 0.54). It could plausibly be chance."

The methodology section notes that this test covers accuracy only, that the MVP has no significance test for macro-F1, and that the p-value describes paired outcomes on this evaluation set rather than proving future-model superiority.

Reference values for `tests/stats.test.ts`, cross-checked with SciPy's `binomtest`:

| b | c | p |
|---:|---:|---|
| 24 | 19 | 0.542384 |
| 0 | 6 | 0.031250 |
| 10 | 10 | 1 |
| 0 | 0 | 1 |
| 5000 | 5200 | 0.048788 (must not be `NaN` or 0) |

## 7. Disagreements and the explorer

A disagreement is any row where `model_a !== model_b` after trimming.

| Outcome code | Shown as | Definition |
|---|---|---|
| `A_CORRECT_B_WRONG` | A correct / B wrong | A equals the true label; B does not |
| `B_CORRECT_A_WRONG` | B correct / A wrong | B equals the true label; A does not |
| `BOTH_WRONG` | Both wrong | Neither equals the true label (and they differ from each other) |

The explorer contains:
- The total disagreement count, plus outcome chips with counts: **All**, **A correct / B wrong**, **B correct / A wrong**, **Both wrong**. One click applies a filter.
- A true-label filter, and a category filter only when `category` exists. Text search is a Could item.
- A table with ID, Category (if present), True label, Model A, Model B, Outcome, and Text (truncated to about 60 characters, if present). The default order is the CSV order.
- Pagination at 50 rows per page, for example "Showing 1–7 of 7".
- A row detail in a native `<dialog>` showing ID, category, true label, Model A prediction, Model B prediction, outcome, the full text, and any extra columns. Closing it with Esc or the button keeps the filters.
- With no disagreements: "The models made the same prediction for every row in this dataset."
- When the filters match nothing: "No disagreements match these filters." plus a **Clear filters** button.

**Two-click path:** every per-label row has a "Show N disagreements" button that sets the label filter and scrolls to the explorer (click 1). Opening a row is click 2.

## 8. Page layout (one page, top to bottom)

### 8.1 Header
`Benchmark Judge`, the subtitle "Compare classification models with evidence.", and two actions: **Load another CSV** and **Download report** (disabled until a dataset is loaded).

### 8.2 Summary strip
Rows analyzed, ground-truth labels, categories (only if present), disagreements, source filename, and a "Validated" badge. There is no missing-values count, because blank values block analysis.

### 8.3 Overview
- Metric selector as a segmented control with `aria-pressed`.
- Winner card, for example "Winner by macro-F1: Model B — 80.6% vs 68.2%, ahead by 12.5 points", or the tie card.
- A **metric-agreement callout** that is always visible. When winners differ: "The winner depends on the metric: Model A wins accuracy; Model B wins macro-F1 and balanced accuracy. See per-label performance below." When they agree: "Model B wins on all three metrics." Ties are named as ties.
- A comparison table with one row per metric and columns Model A, Model B, Difference (B − A), and Winner.
- The McNemar sentence (§6).

### 8.4 Per-label performance (always shown)

```text
Label | Support | Model A: Precision · Recall · F1 | Model B: Precision · Recall · F1 | Gap (B − A) | Better on this label | Action
```

- Recall cells show counts, for example `2 / 10 · 20.0%`.
- **Gap** and **Better on this label** follow the selected metric: F1 when macro-F1 is selected, recall otherwise (per-label accuracy and per-label balanced accuracy both equal recall). The header names the metric, for example "Gap in F1 (B − A)". A gap under 0.001 is a tie.
- Prediction-only labels go at the bottom, marked "prediction-only, not in macro-F1".
- The action button reads "Show N disagreements" and is disabled when N = 0.
- Rows follow the shared label order (support descending). Column sorting is a Could item.

### 8.5 Disagreement explorer
As specified in §7.

### 8.6 Confusion matrices
As specified in §5.7, with a Model A / Model B toggle (Model A first), horizontal scrolling on narrow screens, and a one-line legend: "Rows are true labels, columns are predictions. ✓ marks correct predictions. Shading shows the share of each true label."

### 8.7 Slices (only when `category` exists)

```text
Category | Support | Model A <selected metric> | Model B <selected metric> | Gap (B − A) | Better in this slice
```

Footnote: "Slice metrics use only that slice's rows. Small slices are noisy, so check the support."

### 8.8 Methodology (collapsible)
The input schema, metric definitions with the scikit-learn equivalences, the McNemar note, the rounding note, how invalid and blank rows are handled, and the "this evaluation set only" limitation.

### 8.9 Visual direction
- Calm and analytical: a light background and high-contrast cards.
- Model A is blue and Model B is orange, and both are always labeled with text.
- Use tabular numerals and visible keyboard focus.
- Use semantic headings, `<table>` with `<th scope>`, and real `<button>` elements.
- Never use color alone for a winner, an error, or matrix intensity.
- Use the system font stack and inline SVG or Unicode icons. No CDN fonts or icon kits, so the app works fully offline.

## 9. UI states

| State | Behavior |
|---|---|
| Empty | "Upload prediction results to compare two models." with **Try sample dataset**, **Upload CSV**, and **Download template**, a one-line schema hint, and "Your file never leaves this browser." |
| Loading | "Reading and validating your CSV…" with a spinner and no fake percentage |
| Invalid | Error panel: what is wrong, the affected rows or headers, how to fix it, and a template link. No dashboard. |
| Valid | Full dashboard showing the filename and row count |
| Tie | Tie card for the selected metric, pointing to the per-label table and explorer |
| No disagreements | The §7 message instead of an empty table |
| Single ground-truth label | A note that macro-F1 and balanced accuracy are less informative with one label |
| More than 30 labels | The §5.7 matrix message; the rest of the dashboard works |
| Single-label slices | The slice table is replaced by the §5.6 note |
| Page refresh | Back to the empty state, because data lives in memory only |

## 10. Sample dataset (the demo story)

**Scenario:** an email-triage evaluation set of 200 emails. Model A is a standard classifier; Model B was trained with class weighting. The data is synthetic and illustrative, and the README says so.

**Labels and support:** `safe` 110, `spam` 55, `phishing` 25, `malware` 10.

**Story:** Model A is more accurate overall but catches only 2 of 10 malware emails and 10 of 25 phishing emails. Model B catches 8 and 20, at the cost of misfiling 16 of 110 safe emails, compared with 2 for Model A. A's accuracy lead is not statistically significant.

### 10.1 Count table (exact; the generator expands it)

| # | true_label | model_a | model_b | count | outcome |
|---:|---|---|---|---:|---|
| 1 | safe | safe | safe | 93 | both correct |
| 2 | safe | safe | spam | 6 | A correct / B wrong |
| 3 | safe | safe | phishing | 7 | A correct / B wrong |
| 4 | safe | safe | malware | 2 | A correct / B wrong |
| 5 | safe | spam | safe | 1 | B correct / A wrong |
| 6 | safe | spam | spam | 1 | both wrong, same prediction (not a disagreement) |
| 7 | spam | spam | spam | 45 | both correct |
| 8 | spam | spam | safe | 5 | A correct / B wrong |
| 9 | spam | spam | phishing | 3 | A correct / B wrong |
| 10 | spam | safe | spam | 1 | B correct / A wrong |
| 11 | spam | safe | safe | 1 | both wrong, same prediction (not a disagreement) |
| 12 | phishing | phishing | phishing | 9 | both correct |
| 13 | phishing | safe | phishing | 8 | B correct / A wrong |
| 14 | phishing | spam | phishing | 3 | B correct / A wrong |
| 15 | phishing | phishing | spam | 1 | A correct / B wrong |
| 16 | phishing | safe | spam | 2 | both wrong |
| 17 | phishing | safe | safe | 2 | both wrong, same prediction (not a disagreement) |
| 18 | malware | malware | malware | 2 | both correct |
| 19 | malware | safe | malware | 4 | B correct / A wrong |
| 20 | malware | spam | malware | 1 | B correct / A wrong |
| 21 | malware | phishing | malware | 1 | B correct / A wrong |
| 22 | malware | safe | phishing | 1 | both wrong |
| 23 | malware | safe | safe | 1 | both wrong, same prediction (not a disagreement) |

### 10.2 Generator: `scripts/generate-sample.mjs` (plain Node, no dependencies)

1. Expand each count-table row into `count` rows, in table order.
2. Within each table row, the first `Math.round(count * 0.6)` rows get `category = work`; the rest get `personal`.
3. Shuffle all 200 rows with Fisher–Yates driven by `mulberry32(20261020)`:

   ```js
   function mulberry32(seed) {
     return function () {
       let t = (seed += 0x6d2b79f5);
       t = Math.imul(t ^ (t >>> 15), t | 1);
       t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
       return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
     };
   }
   // for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); swap(i, j); }
   ```

4. After shuffling, assign IDs `email-001` through `email-200` in file order.
5. For `text`, the k-th row (0-based, in file order) with a given true label uses template `k % templates.length` for that label. Replace `{n}` with `100 + ((rowNumber * 37) % 900)`, where `rowNumber` runs from 1 to 200. Because 37 and 900 are coprime, every subject line is unique.
6. Write `src/fixtures/sample.csv` with the header `id,category,true_label,model_a,model_b,text`, LF line endings, and a trailing newline. Quote fields that contain commas, quotes, or newlines.
7. Export `generateSampleCsv()` so the test can compare it with the committed file, and write the file only when run directly (`npm run generate:sample`).

Subject templates (keep `{n}` in each; add more in the same style if you want):

- **safe:** "Notes from design review #{n}", "Re: Q3 budget draft (rev {n})", "Your order #{n} has shipped", "Agenda for sprint planning, room {n}", "Invoice {n} paid, thank you", "Weekend photos, album {n}", "Team lunch on Friday? (poll {n})", "Library reminder: book ref {n} is due"
- **spam:** "You've won a gift card! Claim code {n}", "Work from home and earn big, offer {n}", "Exclusive deal on designer watches, promo {n}", "Miracle weight-loss formula {n}, order now", "Last chance: free cruise, ticket {n}", "Cheap meds shipped free, order #{n}"
- **phishing:** "Your mailbox is full: verify your account (case {n})", "Unusual sign-in attempt #{n}: confirm your password", "Payroll update required: confirm bank details, ref {n}", "Package #{n} on hold: pay the customs fee", "IT Helpdesk: password expires today, ticket {n}", "Your account will be closed, case {n}"
- **malware:** "Scanned document {n} (see attached .zip)", "Invoice_{n}.xlsm: enable macros to view", "Voice message {n}.wav.exe", "Updated contract_{n}.pdf.exe", "Shipping label {n}: open the attached file"

### 10.3 Expected values (lock these in `tests/sample-story.test.ts`)

These were cross-checked with scikit-learn 1.2.2 (`accuracy_score`, `f1_score(average='macro')`, `balanced_accuracy_score`, `precision_recall_fscore_support`) and SciPy's `binomtest`. The sample has no prediction-only labels, so sklearn's default macro-F1 matches this plan's definition exactly.

| Metric | Model A | Model B | Winner |
|---|---|---|---|
| Accuracy | 173 / 200 = 0.865000 | 168 / 200 = 0.840000 | A, ahead by 2.5 points |
| Macro-F1 | 0.681569 | 0.806436 | B, ahead by 12.5 points |
| Balanced accuracy | 0.636364 | 0.822727 | B, ahead by 18.6 points |

| Label | Support | A precision | A recall | A F1 | B precision | B recall | B F1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| safe | 110 | 0.843750 | 0.981818 | 0.907563 | 0.912621 | 0.854545 | 0.882629 |
| spam | 55 | 0.898305 | 0.963636 | 0.929825 | 0.821429 | 0.836364 | 0.828829 |
| phishing | 25 | 0.909091 | 0.400000 | 0.555556 | 0.645161 | 0.800000 | 0.714286 |
| malware | 10 | 1.000000 | 0.200000 | 0.333333 | 0.800000 | 0.800000 | 0.800000 |

- Disagreements: 46 in total, made up of 24 A correct / B wrong, 19 B correct / A wrong, and 3 both wrong.
- Not disagreements: 149 rows where both are correct, and 5 rows where both are wrong with the same prediction.
- McNemar exact test: b = 24, c = 19, p = 0.542384.
- Malware explorer view (label filter = malware): 7 rows, of which 6 are B correct / A wrong and 1 is both wrong.
- Model A's confusion-matrix malware row: safe 6, spam 1, phishing 1, malware 2. Model B's: safe 1, phishing 1, malware 8.
- The test asserts all of the above to 4 decimal places, and asserts that `generateSampleCsv()` equals the committed `src/fixtures/sample.csv` after normalizing line endings.

## 11. Architecture

### Stack
React, TypeScript, Vite, plain CSS, Papa Parse, and Vitest with the `node` environment (component tests, if added, need `jsdom`). Node 22 in Docker and `.nvmrc`. Local development on a newer Node is fine; Docker is the reference environment. No backend, no runtime network calls, and data lives in memory only.

### Data flow

```text
CSV file, or the bundled sample via a ?raw import
  → parseCsv → validateRows → BenchmarkRow[]
  → getLabelSet → model metrics, slices, confusion matrices, disagreements, McNemar
  → view model → components and exports
```

### Types (`src/types/benchmark.ts`)

```ts
export type BenchmarkRow = {
  id: string;
  category: string | null; // null when the CSV has no category column
  trueLabel: string;
  modelA: string;
  modelB: string;
  text: string | null; // null when the CSV has no text column
  extras: Record<string, string>; // other columns, shown in the row detail
  sourceRow: number; // spreadsheet row number; the header is row 1
};

export type ModelId = 'A' | 'B';
export type MetricName = 'accuracy' | 'macroF1' | 'balancedAccuracy';

export type LabelSet = {
  groundTruth: string[]; // support descending, then alphabetical
  predictionOnly: string[]; // alphabetical
};

export type LabelMetrics = {
  label: string;
  support: number;
  predicted: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
  f1: number;
  predictionOnly: boolean;
};

export type ModelMetrics = {
  total: number;
  correct: number;
  accuracy: number;
  macroF1: number;
  balancedAccuracy: number;
  perLabel: LabelMetrics[]; // LabelSet order: ground truth first, then prediction-only
};

export type DisagreementOutcome = 'A_CORRECT_B_WRONG' | 'B_CORRECT_A_WRONG' | 'BOTH_WRONG';

export type Comparison = { winner: ModelId | 'tie'; difference: number }; // difference = B − A

export type McNemarResult = { aCorrectBWrong: number; bCorrectAWrong: number; pValue: number };
```

### Functions, in implementation order
1. `parseCsv(text)` returns headers and raw records only.
2. `validateRows(parsed)` returns `{ ok: true, rows, columns }` or `{ ok: false, errors }`.
3. `getLabelSet(rows)` returns the shared label set.
4. `calculateModelMetrics(rows, model, labelSet)`.
5. `calculateSliceMetrics(rows, labelSet)` and `slicesHaveSingleLabels(rows)`.
6. `buildConfusionMatrix(rows, model, labelSet)`.
7. `findDisagreements(rows)`.
8. `mcnemarExact(b, c)`.
9. `compareModels(metricsA, metricsB, metric)` and `describeMetricAgreement(metricsA, metricsB)`.
10. `buildReport(...)` and `buildDisagreementsCsv(...)`. The timestamp is passed in so output is testable.
11. `formatPercent`, `formatPoints`, and `formatPValue` in `format.ts`.

### Project structure

Use the current workspace as the app and Git repository root. The commands in this plan (`npm …`, `docker build …`, and `docker run …`) are run from that root. Keep the two planning files at the root while planning; during setup, also copy them into `docs/` so the repository preserves the planning trail.

```text
./
├── .dockerignore
├── .env.example              # comment only: no environment variables are required
├── .gitignore
├── .nvmrc                    # 22
├── Dockerfile
├── README.md
├── docs/
│   ├── benchmark-judge-plan.md
│   └── benchmark-judge-plan-v2.md
├── index.html
├── package.json
├── package-lock.json
├── public/
│   └── template.csv
├── scripts/
│   └── generate-sample.mjs
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── types/
│   │   └── benchmark.ts
│   ├── lib/
│   │   ├── csv.ts
│   │   ├── validation.ts
│   │   ├── labels.ts
│   │   ├── metrics.ts
│   │   ├── stats.ts
│   │   ├── comparisons.ts
│   │   ├── format.ts
│   │   └── export.ts
│   ├── fixtures/
│   │   └── sample.csv        # generated by scripts/generate-sample.mjs; never edit by hand
│   └── components/
│       ├── EmptyState.tsx
│       ├── ErrorPanel.tsx
│       ├── DatasetSummary.tsx
│       ├── Overview.tsx
│       ├── PerLabelTable.tsx
│       ├── DisagreementExplorer.tsx
│       ├── RowDetail.tsx
│       ├── ConfusionMatrix.tsx
│       ├── SliceTable.tsx
│       └── Methodology.tsx
└── tests/
    ├── csv.test.ts
    ├── validation.test.ts
    ├── metrics.test.ts
    ├── stats.test.ts
    ├── comparisons.test.ts
    ├── sample-story.test.ts
    └── export.test.ts
```

### Package scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "generate:sample": "node scripts/generate-sample.mjs"
  }
}
```

If the Vite template uses different TypeScript build commands, keep the same behavior and document the actual commands in the README.

## 12. Exports

Both exports are built from in-memory results and make no network request.

**`benchmark-report.json`** contains these top-level fields:

```text
tool, methodologyVersion ("2"), generatedAt,
source { filename, rows, hasCategory, hasText },
labels { groundTruth, predictionOnly },
categories (or null), selectedMetric,
models { A, B } (full ModelMetrics including perLabel),
comparisons { accuracy, macroF1, balancedAccuracy },
mcnemar { aCorrectBWrong, bCorrectAWrong, pValue },
disagreements { total, aCorrectBWrong, bCorrectAWrong, bothWrong },
confusionMatrices { A, B },
slices (or null)
```

**`benchmark-disagreements.csv`:**

```csv
id,category,true_label,model_a,model_b,outcome,text
```

`category` and `text` are empty when the input had no such column. `outcome` uses the codes from §7. Escape commas, quotes, and newlines.

## 13. Docker and deployment

### Dockerfile

```dockerfile
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173", "--strictPort"]
```

`.dockerignore`:

```text
node_modules
dist
.git
.DS_Store
coverage
*.log
```

### Verification (Docker Desktop must be running)

```bash
docker build -t benchmark-judge .
docker run --rm --network none benchmark-judge npm test   # offline proof: tests pass with no network
docker run --rm -p 4173:4173 benchmark-judge              # then open http://localhost:4173
```

Don't add `--network none` to the serve command. With no network, the container has only a loopback interface, so `-p` has nothing to forward to. The app makes no runtime requests anyway; the README can point to the browser's Network tab as evidence.

Run the Docker build in Phase 0 and again in Phase 5.

### Live deployment (recommended, not a blocker)
If time permits in Phase 0, connect the GitHub repo to Vercel or Netlify with framework Vite, build command `npm run build`, output directory `dist`, and no environment variables. Every push redeploys. Avoid GitHub Pages: it needs a `base` path, and that breaks `/template.csv` links unless handled. The buildathon page treats a live link as optional, so a failed or unavailable deployment must not delay the local build, Docker verification, video, or submission.

## 14. Tests

### Unit tests (required)

**CSV and validation**
- Parses the canonical CSV both with and without `category` and `text`.
- Trims headers and cells, preserves label case, and keeps `1` and `01` distinct.
- Ignores fully blank lines, including a trailing newline, several blank lines at the end, and `,,,,,` rows.
- Rejects a missing required column, with the found-columns hint.
- Rejects a blank required cell and a blank `category` when the column exists; allows a blank `text`.
- Duplicate IDs report both row numbers.
- Rejects a field-count mismatch.
- Handles quoted commas and quoted newlines.
- Keeps extra columns in `extras`.
- Reports spreadsheet row numbers (the first data row is 2).
- Enforces the size and row limits.

**Metrics**
- Hand-calculated accuracy, per-label precision/recall/F1 for at least two labels, macro-F1, and balanced accuracy on a small dataset.
- A prediction-only label is reported but excluded from macro-F1.
- Zero denominators give 0, never `NaN` or `Infinity`.
- Label order: support descending, alphabetical ties, prediction-only labels last.
- Confusion-matrix orientation, and both models share axes.
- Slice metrics use slice rows only; `slicesHaveSingleLabels` detection.

**Stats:** the McNemar reference values in §6.

**Comparisons:** A wins, B wins, a tie under 0.001, the metric-agreement sentence (metrics disagree, all agree, and one tie), all three disagreement outcomes, and an empty list when predictions are identical.

**Sample story:** everything in §10.3.

**Exports:** required JSON fields with full precision, the CSV header, and escaping of commas, quotes, and newlines in `text`.

### Component tests (Could)
The empty state shows its actions; the sample renders the overview; the selector flips the winner; an invalid upload shows errors and no dashboard; the per-label button filters the explorer; clicking a row opens the detail.

### Manual smoke test (locally, then on the live URL if deployed)
1. Open the app and click **Try sample dataset**.
2. The overview opens on macro-F1 with "Winner by macro-F1: Model B", and the callout says the winner depends on the metric.
3. Switch to accuracy. Model A wins, and the McNemar sentence reads p = 0.54, not significant.
4. In the per-label table, malware recall is `2 / 10` for Model A and `8 / 10` for Model B.
5. Click "Show 7 disagreements" on malware. The explorer shows 7 rows: 6 B correct / A wrong and 1 both wrong.
6. Open a row. The detail shows the subject line, true label, both predictions, and the outcome.
7. Toggle the confusion matrix. The axes stay identical.
8. Download both exports and open them.
9. Upload `public/template.csv`. It is accepted.
10. Upload a CSV with no `model_b` column and a duplicate ID. The error panel shows the problems and no dashboard appears.
11. Refresh the page. The empty state returns.

## 15. README requirements

1. Project name and one-sentence purpose.
2. **Demo video link** and **live demo URL, if available**. The video is recommended by the event page; the live URL is optional.
3. A screenshot of the overview.
4. The problem being solved.
5. The CSV schema, including the optional `category` and `text` columns, with a link to the template.
6. Metric definitions with the scikit-learn equivalences. Claim "matches scikit-learn" only for what §10.3 verified.
7. The McNemar note (accuracy only).
8. Running locally (`npm ci`, `npm run dev`) and testing (`npm test`, `npm run build`).
9. Docker: the three commands from §13.
10. The sample dataset: synthetic email triage, its story, and the numbers from §10.3, which are locked by tests.
11. Privacy: the file never leaves the browser.
12. Known limitations and non-goals.
13. Buildathon track, the OmniRush-built note, and the OmniRush session list.
14. Planning trail: `docs/` holds v1 and v2 of the plan.

## 16. Demo script (about 2:35)

**0:00–0:15 — Problem.** "Accuracy can hide failures on rare classes, and in email security the rare classes are the dangerous ones. Benchmark Judge compares two models on the same labeled data."

**0:15–0:30 — Load.** Click **Try sample dataset**. Point at the summary strip: 200 emails, 4 labels, 46 disagreements.

**0:30–1:00 — Overview.** "Ranked by macro-F1, the default, Model B wins: 80.6% versus 68.2%." Point at the callout: "But the winner depends on the metric." Switch to accuracy: "Model A wins accuracy, 86.5% versus 84.0%, and McNemar's test says that 2.5-point lead isn't statistically significant." Switch back to macro-F1.

**1:00–1:30 — Per-label.** "Here's why. Model A catches 2 of 10 malware emails and 10 of 25 phishing emails. Model B catches 8 and 20. The cost: B misfiles 16 safe emails, and A only 2. It's a tradeoff, not a universal winner."

**1:30–2:05 — Evidence.** Click "Show 7 disagreements" on malware, then open a B correct / A wrong row. "The truth is malware. Model A said safe; Model B caught it. This is the evidence behind the metric, not just a bar chart."

**2:05–2:20 — Matrix.** On Model A's matrix: "6 of 10 malware emails land in the safe column." Toggle to Model B: "8 of 10 are on the diagonal."

**2:20–2:35 — Close.** Click **Download report** and briefly open the methodology. "Benchmark Judge helps you choose the right model for your data and the metric that actually matters."

Record a rough take at the 2 PM checkpoint and the final take after the 5 PM freeze.

## 17. OmniRush prompt sequence

Run one prompt per step, in order, and push to GitHub after each one.

**Do these by hand in Phase 0, alongside Prompt 1:**
- Confirm the deadline's time zone.
- Open the submission form and note every required field plus any optional fields worth completing (video host and length, repo link, live URL, session list).
- Start Docker Desktop.
- Create the GitHub repo and push.
- If time permits, connect the repo to Vercel or Netlify.

### Prompt 1 — Setup (Phase 0)

```text
We are building Benchmark Judge, a local-first React + TypeScript + Vite app for the Research, Data & Scientific Computing track. Read benchmark-judge-plan-v2.md; it supersedes benchmark-judge-plan.md. Confirm the Must-tier scope from §2 in five bullets, then set up the project in the current workspace root per §11 and §13: a Vite React-TS app, Vitest with one passing test, .nvmrc with 22, a committed package-lock.json, the Dockerfile and .dockerignore from §13, .env.example noting that no variables are needed, a minimal README, both plan files copied into docs/, public/template.csv from §4, and an accessible empty state per §9 with Try sample dataset (disabled until the sample exists), Upload CSV, and Download template. Do not create a nested benchmark-judge/ directory. Run npm test, npm run build, and docker build -t benchmark-judge . and report the exact commands and results.
```

### Prompt 2 — CSV parsing and validation (Phase 1)

```text
Implement §4 of benchmark-judge-plan-v2.md: parseCsv and validateRows in src/lib and the BenchmarkRow type from §11. Use Papa Parse with header true, skipEmptyLines 'greedy', and dynamicTyping false; report spreadsheet row numbers; use the listed message styles. Keep this independent of React. Add the CSV and validation tests from §14, including the trailing-newline case. Run npm test and fix failures before finishing.
```

### Prompt 3 — Metric engine and McNemar (Phase 1)

```text
Implement §5 and §6 of benchmark-judge-plan-v2.md in src/lib: the shared label set and ordering, per-label precision/recall/F1 over the whole dataset, macro-F1 over ground-truth labels only, balanced accuracy, slice metrics and slicesHaveSingleLabels, confusion matrices with shared axes, disagreement outcomes, compareModels with the 0.001 tie threshold, describeMetricAgreement, mcnemarExact computed in log space, and the formatters from §5.9. Add the metrics, stats, and comparisons tests from §14, using the McNemar reference values in §6. No React and no AI explanation layer. Run npm test.
```

### Prompt 4 — Sample dataset and story test (Phase 1)

```text
Implement §10 of benchmark-judge-plan-v2.md exactly: scripts/generate-sample.mjs (plain Node; the count table, category split, mulberry32 seed 20261020 shuffle, ids, and text templates), the generate:sample npm script, the generated src/fixtures/sample.csv, and tests/sample-story.test.ts asserting every value in §10.3 to 4 decimal places, plus that generateSampleCsv() equals the committed file after normalizing line endings. Run npm test.
```

### Prompt 5 — Upload flow and overview (Phase 2)

```text
Build §8.1–§8.3 of benchmark-judge-plan-v2.md and the empty, loading, invalid, and valid states from §9: file upload (an input element is enough), the Try sample dataset button loading src/fixtures/sample.csv via a ?raw import, the error panel, the summary strip, the metric selector, the winner/tie card, the metric-agreement callout, the comparison table, and the McNemar sentence. All numbers come from src/lib in the §5.9 formats. Verify with the sample that macro-F1 shows Model B winning and accuracy shows Model A winning.
```

### Prompt 6 — Per-label table and disagreement explorer (Phase 3)

```text
Build §8.4 and §7 of benchmark-judge-plan-v2.md: the per-label table (recall with counts, Gap following the selected metric, prediction-only rows, and a "Show N disagreements" button that sets the label filter and scrolls to the explorer), and the explorer with outcome chips, a label filter, a category filter when present, 50-row pagination, the empty-filter state, and the row detail in a native dialog showing text and extra columns. Walk through smoke-test steps 1–6 from §14 with the sample and report the results.
```

### Prompt 7 — Matrix, slices, exports, remaining states (Phase 4)

```text
Build the confusion matrices from §5.7 and §8.6 (shared axes, row-share shading, ✓ on the diagonal, legend, 30-label cap), the §8.7 slice table with the single-label-slices note, the §12 exports with their tests, the §8.8 methodology section, and the remaining §9 states (tie, no disagreements, single label, more than 30 labels). Run npm test, npm run build, and the full manual smoke test from §14.
```

### Prompt 8 — README and rebuild review (Phase 5)

```text
Act as a buildathon reviewer. Write the README per §15 of benchmark-judge-plan-v2.md, leaving placeholders for the live URL and video link if they are not known yet. Then check the project against §19: lockfile, Node pin, Dockerfile, test command, offline behavior, no machine-specific paths, no secrets, and a reproducible sample. Run docker build -t benchmark-judge . and docker run --rm --network none benchmark-judge npm test. Fix anything you find and report the exact evidence.
```

## 18. Risk register

| Risk | Mitigation |
|---|---|
| Running out of time | §2 checkpoints, 5 PM freeze, cut order, rough video at 2 PM |
| Deadline time-zone mix-up | The source page lists IST; re-check the live submission dashboard in Phase 0 before planning the final upload |
| Sample doesn't tell the story | Exact count table plus a test that locks every number |
| Judges can't or won't run Docker | A live URL if available, plus a short demo video and complete README; none of these replaces the Docker check |
| Docker or Node 22 surprise at the end | First Docker build in Phase 0; Docker is the reference environment |
| Laptop or environment failure | Push after every prompt; auto-deploy on push |
| Numbers questioned against scikit-learn | Documented equivalences; sample values cross-checked |
| Small gaps over-interpreted | McNemar sentence, tie threshold, support counts, slice footnote |
| Misleading per-category F1 | Per-label metrics over the whole dataset, no label fallback, single-label-slice detection |
| Trailing newline flagged as invalid | `skipEmptyLines: 'greedy'` plus a test |
| Large files freeze the tab | 10 MB / 100,000-row limits, 50-row pagination, 30-label matrix cap |
| Feels like a generic dashboard | Concrete scenario, text in the row detail, two-click evidence path |
| Scope creep | Non-goals are fixed; Could items only after Must and Should |

## 19. Submission checklist

### Product
- [ ] The empty state is clear, and **Try sample dataset** works in one click.
- [ ] The template uploads successfully; a broken CSV shows actionable errors and no dashboard.
- [ ] Sample metrics match §10.3, the winner flips with the selector, and the callout appears.
- [ ] The McNemar sentence shows p = 0.54 on the sample.
- [ ] The per-label table and the two-click evidence path work.
- [ ] The confusion matrices toggle with identical axes.
- [ ] Both exports download and open correctly.
- [ ] No API key or network connection is needed.

### Engineering
- [ ] `npm test` and `npm run build` pass.
- [ ] `docker build -t benchmark-judge .` passes, and `docker run --rm --network none benchmark-judge npm test` passes.
- [ ] `docker run --rm -p 4173:4173 benchmark-judge` serves the app.
- [ ] Node is pinned, the lockfile is committed, and there are no absolute paths or secrets.

### Submission
- [ ] The deadline's time zone is confirmed.
- [ ] The public GitHub repo is linked in the entry.
- [ ] Recommended: the live URL works in a private browser window.
- [ ] Recommended: the demo video is 2–3 minutes, follows §16, and its link works while logged out.
- [ ] The README is complete per §15.
- [ ] The OmniRush session list matches the commit history.
- [ ] Submitted by 10 PM, with buffer to spare.

## 20. Definition of done

A new user can go from the empty state to an evidence-backed comparison using only the bundled sample, locally or on the live URL if deployed. A judge can rebuild the project on a clean Linux machine with Docker, run the tests offline, and understand the project from the README, with no private key or external service.
