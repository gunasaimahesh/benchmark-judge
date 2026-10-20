import { describe, expect, it } from 'vitest';
import { countDisagreementOutcomes, filterDisagreements, orderedDisagreementLabels } from '../src/lib/explorer';
import type { Disagreement, DisagreementOutcome } from '../src/types/benchmark';

function disagreement(
  id: string,
  trueLabel: string,
  category: string,
  outcome: DisagreementOutcome,
  text: string,
): Disagreement {
  return {
    id,
    category,
    trueLabel,
    modelA: outcome === 'A_CORRECT_B_WRONG' ? trueLabel : 'other-a',
    modelB: outcome === 'B_CORRECT_A_WRONG' ? trueLabel : 'other-b',
    text,
    extras: {},
    sourceRow: Number(id) + 1,
    outcome,
  };
}

describe('disagreement explorer filters', () => {
  const rows = [
    disagreement('1', 'safe', 'work', 'A_CORRECT_B_WRONG', 'review ticket'),
    disagreement('2', 'phishing', 'work', 'B_CORRECT_A_WRONG', 'account notice'),
    disagreement('3', 'safe', 'personal', 'BOTH_WRONG', 'review ticket'),
    disagreement('4', 'safe', 'work', 'B_CORRECT_A_WRONG', 'review ticket'),
  ];

  it('counts outcomes after label, category, and search filters', () => {
    const filtered = filterDisagreements(rows, {
      outcomeFilter: 'ALL',
      labelFilter: 'safe',
      categoryFilter: 'work',
      search: 'ticket',
    });

    expect(countDisagreementOutcomes(filtered)).toEqual({
      ALL: 2,
      A_CORRECT_B_WRONG: 1,
      B_CORRECT_A_WRONG: 1,
      BOTH_WRONG: 0,
    });
    expect(filterDisagreements(rows, {
      outcomeFilter: 'B_CORRECT_A_WRONG',
      labelFilter: 'safe',
      categoryFilter: 'work',
      search: 'ticket',
    }).map((row) => row.id)).toEqual(['4']);
  });

  it('keeps true-label options in the shared label order', () => {
    expect(orderedDisagreementLabels(rows, ['safe', 'phishing', 'malware'])).toEqual(['safe', 'phishing']);
  });
});
