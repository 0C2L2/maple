// Enum values must match the database (supabase/migrations/*_core.sql, SHARED_CONTRACTS §1).
// Labels are what users see.

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

export type Role = 'organizer' | 'sponsor';
export const ROLE_LABELS: Record<Role, string> = { organizer: 'Event organizer', sponsor: 'Sponsor' };
export const ROLES = (Object.keys(ROLE_LABELS) as Role[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

// What kind of organization it is. Each role offers the kinds that fit it.
export const ORG_KIND_LABELS = {
  event_company: 'Event company',
  community: 'Community or meetup group',
  university_club: 'University club',
  nonprofit: 'Nonprofit',
  company: 'Company',
  agency: 'Agency',
} as const;
export type OrgKind = keyof typeof ORG_KIND_LABELS;
const kinds = (values: OrgKind[]) => values.map((value) => ({ value, label: ORG_KIND_LABELS[value] }));
export const ORG_KINDS: Record<Role, { value: OrgKind; label: string }[]> = {
  organizer: kinds(['event_company', 'community', 'university_club', 'nonprofit', 'company']),
  sponsor: kinds(['company', 'agency', 'nonprofit']),
};

export const POST_KIND_LABELS = { event: 'Event post', sponsor: 'Sponsor post' } as const;
export type PostKind = keyof typeof POST_KIND_LABELS;
export const POST_KINDS = options(POST_KIND_LABELS);

export const POST_STATUS_LABELS = { draft: 'Draft', open: 'Open', closed: 'Closed' } as const;
export type PostStatus = keyof typeof POST_STATUS_LABELS;
export const POST_STATUSES = options(POST_STATUS_LABELS);

export const CATEGORY_LABELS = {
  hackathon: 'Hackathon',
  conference: 'Conference',
  meetup: 'Meetup',
  workshop: 'Workshop',
  festival: 'Festival',
  other: 'Other',
} as const;
export type Category = keyof typeof CATEGORY_LABELS;
export const CATEGORIES = options(CATEGORY_LABELS);

export const AUDIENCE_LABELS = {
  developers: 'Developers',
  students: 'Students',
  founders: 'Founders',
  designers: 'Designers',
  product: 'Product',
  data: 'Data',
  marketers: 'Marketers',
  executives: 'Executives',
  general: 'General public',
} as const;
export type AudienceType = keyof typeof AUDIENCE_LABELS;
export const AUDIENCES = options(AUDIENCE_LABELS);

export const ATTENDANCE_LABELS = {
  under_100: 'Under 100',
  '100_500': '100–500',
  '500_2000': '500–2,000',
  '2000_plus': '2,000+',
} as const;
export type AttendanceBand = keyof typeof ATTENDANCE_LABELS;
export const ATTENDANCE_BANDS = options(ATTENDANCE_LABELS);

export const BUDGET_LABELS = {
  under_1k: 'Under $1K',
  '1k_5k': '$1–5K',
  '5k_25k': '$5–25K',
  '25k_100k': '$25–100K',
  '100k_plus': '$100K+',
} as const;
export type BudgetBand = keyof typeof BUDGET_LABELS;
export const BUDGET_BANDS = options(BUDGET_LABELS);

export const GIVE_LABELS = {
  cash: 'Cash',
  in_kind: 'In-kind',
  credits: 'Credits',
  swag: 'Swag',
  venue: 'Venue',
  food: 'Food',
  speakers: 'Speakers',
  mentors: 'Mentors',
  prizes: 'Prizes',
} as const;
export type Give = keyof typeof GIVE_LABELS;
export const GIVES = options(GIVE_LABELS);

export const PROPOSAL_STATUS_LABELS = {
  new: 'New',
  shortlisted: 'Shortlisted',
  in_talks: 'In talks',
  won: 'Won',
  declined: 'Declined',
  completed: 'Completed',
} as const;
export type ProposalStatus = keyof typeof PROPOSAL_STATUS_LABELS;
export const PROPOSAL_STATUSES = options(PROPOSAL_STATUS_LABELS);

// ponytail: a short curated list for the beachhead (D-002); becomes a `regions` table when it needs admin editing.
export const REGION_LABELS = {
  online: 'Online',
  'new-york': 'New York',
  'san-francisco': 'San Francisco',
  boston: 'Boston',
  austin: 'Austin',
  seattle: 'Seattle',
  toronto: 'Toronto',
  london: 'London',
  berlin: 'Berlin',
  bangalore: 'Bangalore',
  singapore: 'Singapore',
  seoul: 'Seoul / Incheon',
  sydney: 'Sydney',
} as const;
export type Region = keyof typeof REGION_LABELS;
export const REGIONS = options(REGION_LABELS);

// What an event gives its sponsors. Keys match public.valid_deliverables() in the core migration.
export const DELIVERABLE_LABELS = {
  logo_site: 'Logo on the website',
  logo_merch: 'Logo on t-shirts and merch',
  logo_stage: 'Logo on stage and screens',
  booth: 'Booth or table',
  talk: 'Talk or keynote slot',
  workshop: 'Workshop slot',
  judging: 'Seat on the judging panel',
  track_prize: 'Own track or prize ("Best use of…")',
  recruiting: 'Recruiting access (CVs, with consent)',
  social_posts: 'Social media posts',
  newsletter: 'Newsletter mention',
  swag: 'Swag in attendee bags',
  demo: 'Product demo',
  naming: 'Naming rights',
} as const;
export type Deliverable = keyof typeof DELIVERABLE_LABELS;
export const DELIVERABLES = options(DELIVERABLE_LABELS);

export const CURRENCIES = [
  { value: 'USD', label: 'USD $' },
  { value: 'EUR', label: 'EUR €' },
  { value: 'GBP', label: 'GBP £' },
  { value: 'KRW', label: 'KRW ₩' },
  { value: 'JPY', label: 'JPY ¥' },
  { value: 'INR', label: 'INR ₹' },
  { value: 'SGD', label: 'SGD' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
] as const;

export const FILE_KIND_LABELS = {
  deck: 'Sponsorship deck',
  plan: 'Event plan',
  media_kit: 'Media kit',
  other: 'Document',
} as const;
export type FileKind = keyof typeof FILE_KIND_LABELS;
export const FILE_KINDS = options(FILE_KIND_LABELS);
