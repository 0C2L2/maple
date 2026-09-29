// Maple's planned fee on a cash deal paid through Maple (D-029, docs/business/MONETIZATION.md §2), taken from the
// organizer's payout. Amounts are in the currency's smallest unit (won for KRW). Nothing is charged until payments
// launch. admin_finance() in the monetization migration uses the same rule. Check: node scripts/check-fees.mjs
export const LAUNCH_RATE = 0.05;
export const FULL_RATE = 0.08;
// Organizers' proposals to sponsors: 3 free per event, then ₩5,000 each (not enforced during early access).
export const FREE_PROPOSALS_PER_EVENT = 3;
export const EXTRA_PROPOSAL_KRW = 5_000;
const KRW_MINIMUM = 10_000;

export function mapleFee(cash: number, currency: string, rate: number): number {
  if (cash <= 0 || rate <= 0) return 0;
  const fee = Math.round(cash * rate);
  return currency === 'KRW' ? Math.min(cash, Math.max(fee, KRW_MINIMUM)) : fee;
}
