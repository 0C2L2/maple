import { type Href } from 'expo-router';

// Dates in the database are UTC (`date` columns have no time), so format them in UTC too.
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const formatDate = (value: string) => dateFormat.format(new Date(value));

/** A real calendar date typed as YYYY-MM-DD. ponytail: typed dates; add a native date picker when users ask. */
export const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().startsWith(value);

/** Decimal places of a currency's smallest unit: 2 for USD (cents), 0 for KRW and JPY. */
export const minorDigits = (currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;

/**
 * Money stored in the currency's smallest unit (CLAUDE.md: integer cents; won for KRW).
 * 500000 → "$5,000", 150050 → "$1,500.50", formatMoney(5000000, 'KRW') → "₩5,000,000".
 */
export const formatMoney = (minor: number, currency = 'USD') => {
  const digits = minorDigits(currency);
  const amount = minor / 10 ** digits;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 ? digits : 0,
    maximumFractionDigits: digits,
  }).format(amount);
};

/** "2500" typed in a form → smallest units, or null when blank or not a number. */
export const toMinor = (text: string, currency = 'USD') => {
  const value = Number(text.replace(/[^\d.]/g, ''));
  return text.trim() && Number.isFinite(value) ? Math.round(value * 10 ** minorDigits(currency)) : null;
};

/** "now", "5m", "3h", "2d", then the date. */
export function timeAgo(value: string) {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`;
  return formatDate(value);
}

/** A user-typed website ("acme.com") as a link that opens outside the app. */
export const externalUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`) as Href;
