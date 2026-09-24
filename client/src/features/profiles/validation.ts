import type { ProfileFields } from './data';
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;
export function suggestHandle(name: string) {
  const candidate = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').replace(/-+/g, '-').replace(/^[-_]+|[-_]+$/g, '').slice(0, 30);
  return HANDLE_PATTERN.test(candidate) ? candidate : '';
}
export function validateIdentity(input: ProfileFields) {
  const errors: Partial<Record<keyof ProfileFields, string>> = {};
  if (!input.name.trim() || [...input.name.trim()].length > 120) errors.name = 'Enter a name of 1–120 characters.';
  if (!HANDLE_PATTERN.test(input.handle)) errors.handle = 'Use 3–30 lowercase letters, numbers, hyphens or underscores; start with a letter or number.';
  if (!input.headline?.trim() || [...input.headline].length > 200) errors.headline = 'Enter a headline of 1–200 characters.';
  if (input.bio && [...input.bio].length > 5000) errors.bio = 'Keep your bio within 5,000 characters.';
  return errors;
}
export const emptyFields: ProfileFields = { name: '', handle: '', headline: '', bio: '', location: '', categories: [], regions: [], audience_types: [], audience_band: null, gives: [] };
