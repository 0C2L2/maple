import type { PostInput, TierInput } from '@/features/posts/mutations';
import { isIsoDate } from '@/lib/format';

/** Mirrors the database checks with friendly messages. Returns field errors, empty when valid. */
export function validatePost(input: PostInput): Record<string, string> {
  const next: Record<string, string> = {};
  if (!input.title.trim()) next.title = 'Add a title.';
  if (!input.body.trim()) next.body = input.kind === 'event' ? 'Describe the event plan.' : 'Describe what you are looking for.';
  if (input.starts_on && !isIsoDate(input.starts_on)) next.starts_on = 'Use the format YYYY-MM-DD.';
  if (input.ends_on && !isIsoDate(input.ends_on)) next.ends_on = 'Use the format YYYY-MM-DD.';
  if (input.starts_on && input.ends_on && isIsoDate(input.starts_on) && isIsoDate(input.ends_on) && input.ends_on < input.starts_on)
    next.ends_on = 'The end date is before the start date.';
  if (input.deadline && !isIsoDate(input.deadline)) next.deadline = 'Use the format YYYY-MM-DD.';
  if (!input.online && input.kind === 'event' && !input.city?.trim()) next.city = 'Add a city, or mark it online.';
  input.tiers.forEach((tier, i) => validateTier(tier, i, next));
  return next;
}

function validateTier(tier: TierInput, i: number, next: Record<string, string>) {
  if (!tier.name.trim()) next[`tier${i}`] = 'Name this tier or remove it.';
}
