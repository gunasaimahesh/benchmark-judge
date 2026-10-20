import type { Disagreement, DisagreementOutcome } from '../types/benchmark';

export type OutcomeFilter = 'ALL' | DisagreementOutcome;

export type DisagreementExplorerFilters = {
  outcomeFilter: OutcomeFilter;
  labelFilter: string;
  categoryFilter: string;
  search: string;
};

export function filterDisagreements(
  disagreements: Disagreement[],
  filters: DisagreementExplorerFilters,
): Disagreement[] {
  const term = filters.search.trim().toLowerCase();

  return disagreements.filter((row) => {
    if (filters.outcomeFilter !== 'ALL' && row.outcome !== filters.outcomeFilter) return false;
    if (filters.labelFilter !== 'ALL' && row.trueLabel !== filters.labelFilter) return false;
    if (filters.categoryFilter !== 'ALL' && row.category !== filters.categoryFilter) return false;
    if (!term) return true;
    return [row.id, row.trueLabel, row.modelA, row.modelB, row.text ?? ''].some((value) => value.toLowerCase().includes(term));
  });
}

export function countDisagreementOutcomes(disagreements: Disagreement[]): Record<OutcomeFilter, number> {
  const counts: Record<OutcomeFilter, number> = {
    ALL: disagreements.length,
    A_CORRECT_B_WRONG: 0,
    B_CORRECT_A_WRONG: 0,
    BOTH_WRONG: 0,
  };

  for (const disagreement of disagreements) counts[disagreement.outcome] += 1;
  return counts;
}

export function orderedDisagreementLabels(disagreements: Disagreement[], labelOrder: string[]): string[] {
  const availableLabels = new Set(disagreements.map((row) => row.trueLabel));
  return labelOrder.filter((label) => availableLabels.has(label));
}
