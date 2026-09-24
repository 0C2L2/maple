import { type Href } from 'expo-router';

// Dates in the database are UTC (`date` columns have no time), so format them in UTC too.
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const formatDate = (value: string) => dateFormat.format(new Date(value));

/** A real calendar date typed as YYYY-MM-DD. ponytail: typed dates; add a native date picker when users ask. */
export const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().startsWith(value);

/** 500000 → "$5,000", 150050 → "$1,500.50". */
export const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

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
