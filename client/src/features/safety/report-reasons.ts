// Values match the reports.reason check in supabase/migrations/*_core.sql.
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'fake', label: 'Fake organization or event' },
  { value: 'offensive', label: 'Offensive or abusive' },
  { value: 'other', label: 'Something else' },
] as const;

export type ReportTarget = 'post' | 'organization' | 'review';

export const reasonLabel = (value: string) => REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
