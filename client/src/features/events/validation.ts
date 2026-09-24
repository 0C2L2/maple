import { taxonomy } from '@/constants/taxonomy';
import { normalizeWebsite } from '@/features/organizations/validation';
import { defaultTimezone, wallToInstant } from './dates';
export const formats = { in_person: 'In person', online: 'Online', hybrid: 'Hybrid' } as const;
export type EventInput = {
  org_id: string; title: string; slug: string; description: string; format: keyof typeof formats;
  starts_at: string; ends_at: string; timezone: string; venue_name: string; city: string; country: string;
  website: string; categories: string[]; audience_types: string[]; attendance_band: string;
};
export const emptyEvent = (): EventInput => ({
  org_id: '', title: '', slug: '', description: '', format: 'in_person', starts_at: '', ends_at: '',
  timezone: defaultTimezone(), venue_name: '', city: '', country: '', website: '', categories: [], audience_types: [], attendance_band: '',
});
export const eventSlugPattern = /^(?=.{3,64}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validateEvent(value: EventInput, editing = false) {
  const errors: Partial<Record<keyof EventInput, string>> = {};
  if (!editing && !value.org_id) errors.org_id = 'Choose an organization you administer.';
  if (!value.title.trim() || [...value.title.trim()].length > 160) errors.title = 'Enter a title of 1–160 characters.';
  if (!editing && !eventSlugPattern.test(value.slug)) errors.slug = 'Use 3–64 lowercase letters, numbers and single hyphens.';
  if ([...value.description].length > 10000) errors.description = 'Keep the description within 10,000 characters.';
  if (!(value.format in formats)) errors.format = 'Choose an event format.';
  for (const field of ['venue_name', 'city', 'country'] as const) {
    if ([...value[field].trim()].length > (field === 'venue_name' ? 200 : 120)) errors[field] = 'This location is too long.';
  }
  if (value.format !== 'online') {
    if (!value.city.trim()) errors.city = 'Enter the city for this event.';
    if (!value.country.trim()) errors.country = 'Enter the country for this event.';
  }
  try { wallToInstant('2026-01-15T12:00', value.timezone); } catch { errors.timezone = 'Choose a recognized IANA timezone, such as Asia/Seoul.'; }
  let start = '', end = '';
  for (const field of ['starts_at', 'ends_at'] as const) {
    try { const instant = wallToInstant(value[field], value.timezone); if (field === 'starts_at') start = instant; else end = instant; }
    catch { errors[field] = 'Choose a valid date/time. Ambiguous or skipped daylight-saving times are not accepted.'; }
  }
  if (start && end && Date.parse(end) <= Date.parse(start)) errors.ends_at = 'End must be after start.';
  try { normalizeWebsite(value.website); } catch { errors.website = 'Use a valid HTTP or HTTPS website.'; }
  for (const field of ['categories', 'audience_types'] as const) {
    if (!value[field].length || value[field].length > 5 || value[field].some(v => !(taxonomy[field] as readonly string[]).includes(v)))
      errors[field] = 'Choose at least one of the available options.';
  }
  if (!(taxonomy.audience_band as readonly string[]).includes(value.attendance_band)) errors.attendance_band = 'Choose an attendance band.';
  return errors;
}
