export const orgTypes = { event_company: 'Event company', brand: 'Brand', agency: 'Agency', university_club: 'University club' } as const;
export type OrgType = keyof typeof orgTypes;
export type OrgInput = { name: string; slug: string; type: OrgType | ''; domain: string; website: string; about: string };
export const emptyOrganization: OrgInput = { name: '', slug: '', type: '', domain: '', website: '', about: '' };
export const slugPattern = /^[a-z0-9][a-z0-9-]{2,63}$/;
const hostnamePattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
export function suggestSlug(name: string) {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
  return slugPattern.test(slug) ? slug : '';
}
function parseWeb(value: string) {
  const raw = value.trim();
  if (/[\s\\\u0000-\u001f\u007f]/.test(raw)) throw new Error('Enter a valid HTTP or HTTPS address.');
  const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : 'https://' + raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !hostnamePattern.test(url.hostname)) throw new Error('Use an HTTP or HTTPS website with a valid hostname.');
  return url;
}
export function normalizeWebsite(value: string) {
  if (!value.trim()) return null;
  return parseWeb(value).href;
}
export function normalizeDomain(value: string) {
  if (!value.trim()) return null;
  const hostname = parseWeb(value).hostname.toLowerCase().replace(/^www\./, '');
  if (hostname.length > 253 || !hostnamePattern.test(hostname)) throw new Error('Enter a valid domain, such as example.com.');
  return hostname;
}
export function safeWebsite(value: string | null) {
  if (!value || !/^https?:\/\//.test(value)) return null;
  try { return normalizeWebsite(value); } catch { return null; }
}
export function validateOrganization(input: OrgInput, editing = false) {
  const errors: Partial<Record<keyof OrgInput, string>> = {};
  if (!input.name.trim() || [...input.name.trim()].length > 160) errors.name = 'Enter an organization name of 1–160 characters.';
  if (!editing && !slugPattern.test(input.slug)) errors.slug = 'Use 3–64 lowercase letters, numbers or hyphens, starting with a letter or number.';
  if (!input.type || !(input.type in orgTypes)) errors.type = 'Choose an organization type.';
  try { normalizeDomain(input.domain); } catch { errors.domain = 'Enter a valid domain, such as example.com.'; }
  try { normalizeWebsite(input.website); } catch { errors.website = 'Use a valid HTTP or HTTPS website. Other schemes are not allowed.'; }
  return errors;
}
