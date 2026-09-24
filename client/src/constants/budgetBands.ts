// Canonical private Sponsor budget categories; SQL values are parity-tested.
export const budgetBands = {
  under_1k: 'Under $1K',
  '1k_5k': '$1–5K',
  '5k_25k': '$5–25K',
  '25k_plus': '$25K+',
} as const;
export type BudgetBand = keyof typeof budgetBands;
export function isBudgetBand(value: string): value is BudgetBand {
  return Object.prototype.hasOwnProperty.call(budgetBands, value);
}
