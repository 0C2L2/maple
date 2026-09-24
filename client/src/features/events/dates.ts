import { Temporal } from '@js-temporal/polyfill';

export function wallToInstant(wall: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wall)) throw new Error('Choose a date and time.');
  if (timezone !== 'UTC' && !timezone.includes('/')) throw new Error('Choose an IANA timezone.');
  return Temporal.PlainDateTime.from(wall).toZonedDateTime(timezone, { disambiguation: 'reject' }).toInstant().toString();
}
export function instantToWall(instant: string, timezone: string): string {
  return Temporal.Instant.from(instant).toZonedDateTimeISO(timezone).toPlainDateTime().toString({ smallestUnit: 'minute' });
}
export function displayDate(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(new Date(instant));
}
export function defaultTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}
export function timezoneOptions(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  try { return ['UTC', ...(intl.supportedValuesOf?.('timeZone') ?? ['Asia/Seoul', 'America/New_York', 'Europe/London'])]; }
  catch { return ['UTC', 'Asia/Seoul', 'America/New_York', 'Europe/London']; }
}
