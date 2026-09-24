# Maple: Shared Contracts

> The names, data shapes, and interfaces both developers must use. **Change them only through a pull request that updates this file and is approved by both developers** ([OWNERSHIP §4](OWNERSHIP.md#4-shared-areas-both-developers-review)).

| | |
|---|---|
| Status | **Proposed**: approve with [WEBSITE_PLAN §11](WEBSITE_PLAN.md#11-open-questions-to-decide-before-coding) |
| Builds on | [MVP §10](../product/MVP.md#10-data-model-core-tables) (data model) and [MVP §4.14](../product/MVP.md#414-product-analytics) (analytics events) |
| Code that must match | `client/src/constants/taxonomy.ts`, `supabase/migrations/*`, the function signatures below |

> **Changed by [D-025](../product/DECISIONS.md) (accounts are organizations).** Where this file and the migrations disagree, the migrations win:
> - `profiles` → **`organizations`** (id = the login's user id; `role` `org_role` organizer | sponsor; `kind` `org_kind` event_company | community | university_club | nonprofit | company | agency; `handle` `^[a-z0-9-]{3,40}$`; `tagline`, `about`, `logo_url`, `banner_url`). There are no personal profiles and no separate organizations-with-members table.
> - `follows.profile_id` and `thread_participants.profile_id` → `org_id`. Pitches, posts, comments, likes, and messages are authored by organizations.
> - `search_profiles` → `search_organizations(q, filters {role, kind, category, region}, page)`; `search_opportunities` also returns `owner_handle` and `owner_logo_url`. Filters are single values.
> - Pages live at `/org/<handle>` (was `/in/<handle>`). Logos and banners are in the public `org-media` storage bucket, one folder per organization.
> - `useSession()` returns `{ session, org, isLoading, refreshOrg }`.

---

## 1. Vocabulary and enum values

The database enums and `constants/taxonomy.ts` must hold **exactly** these values. UI labels are separate and can be translated later.

| Enum | Values | Label examples |
|---|---|---|
| `org_role` | `organizer`, `sponsor` | Organizer, Sponsor |
| `org_kind` | `event_company`, `community`, `university_club`, `nonprofit`, `company`, `agency` | Event company, Community… |
| `post_kind` | `event`, `sponsor` | Event post, Sponsor post |
| `post_status` | `draft`, `open`, `closed` | Draft, Open, Closed |
| `proposal_status` | `new`, `shortlisted`, `in_talks`, `won`, `declined`, `completed` | New, Shortlisted, In talks, Won, Declined, Completed |
| `category` | `hackathon`, `conference`, `meetup`, `workshop`, `festival`, `other` | Hackathon, Conference… |
| `audience_type` | `developers`, `students`, `founders`, `designers`, `product`, `data`, `marketers`, `executives`, `general` | Developers, Students… |
| `attendance_band` | `under_100`, `100_500`, `500_2000`, `2000_plus` | Under 100, 100–500, 500–2,000, 2,000+ |
| `budget_band` | `under_1k`, `1k_5k`, `5k_25k`, `25k_100k`, `100k_plus` | Under $1K … $100K+ |
| `gives` (what sponsors give / organizers want) | `cash`, `in_kind`, `credits`, `swag`, `venue`, `food`, `speakers`, `mentors`, `prizes` | Cash, In-kind… |
| `boost_kind` | `search`, `post`, `org` | Search Boost… |
| `plan` | `free`, `premium_organizer`, `premium_sponsor` (later: `scout`, `sponsor_suite`) | — |
| `subscription_source` | `stripe`, `app_store`, `play_store` | — |
| `region` | `online` + a curated list of city slugs (`new-york`, `san-francisco`, `london`, `toronto`, …) kept in `taxonomy.ts` and a `regions` table | New York… |

**Waitlist exception:** the Phase 0 `waitlist` table uses coarser sponsor budget values (`under_1k`, `1k_5k`, `5k_25k`, `25k_plus`) to keep the form short. It isn't a product table, and the product uses `budget_band` above.

## 2. Data model additions and fixes

These change [MVP §10](../product/MVP.md#10-data-model-core-tables):

| Table | Columns | Why |
|---|---|---|
| `posts` **(replaces `opportunities` + `events` + social posts, D-026)** | `id`, `kind` (`event`/`sponsor`), `owner_id`, `title`, `body`, `categories[]`, `regions[]`, `budget_band`, `attendance_band`, `audience_types[]`, `supports[]` (`give` enum), `benefits` (text), `starts_on`, `ends_on`, `city`, `online`, `deadline`, `status` (`draft`/`open`/`closed`), `search` (tsvector) | One post = one event (event posts) or one sponsor listing |
| `post_tiers` **(renamed from `opportunity_tiers`)** | `id`, `post_id`, `position`, `name`, `price_cents`, `benefits`, `slots` | Priced tiers on event posts |
| `proposals` **(replaces `pitches`)** | `id`, `post_id`, `from_id`, `message`, `tier_id` (nullable), `amount_cents` (nullable), `status` (`new`/`shortlisted`/`in_talks`/`won`/`declined`/`completed`), `thread_id` · unique (`post_id`, `from_id`) | Applications to posts |
| `reviews` **(new, replaces likes/comments)** | `id`, `post_id`, `proposal_id`, `reviewer_id`, `reviewee_id`, `rating` (1–5), `body` · unique (`proposal_id`, `reviewer_id`) | Post-event ratings by deal participants only; public |
| `saved_posts` **(renamed from `opportunity_bookmarks`)** | `owner_id`, `post_id`, `created_at` · primary key (`owner_id`, `post_id`) | Bookmarked posts |
| `post_views` **(renamed from `opportunity_views`)** | `viewer_id`, `post_id`, `viewed_on` (date) · unique per viewer per day | Post views |
| `org_views` **(renamed from `profile_views`)** | `viewer_id`, `org_id`, `viewed_on` (date) · unique per viewer per day | Organization page views |
| `threads` **(changed)** | `post_id` (nullable, was `opportunity_id`), `matched_at` (nullable `timestamptz`) · `proposals.thread_id` is the proposal→thread link | Show the linked post; the north-star metric |
| `organizations.handle` | unique, lowercase, `^[a-z0-9-]{3,40}$`, **not editable by users in the MVP** | No redirect history needed |
| `organizations.terms_accepted_at` **(new)** | `timestamptz`, defaults to the time the page is created | Onboarding requires the "I agree to the Terms and Community guidelines" checkbox |
| `ranking_weights` **(new)** | `key` (`text`, `category`, `region`, `audience`), `weight` · read-only for the app | Search weights live in the database (CLAUDE.md), tuned with SQL |
| `reports` **(new, safety)** | `id`, `reporter_id`, `target_type` (`post`/`organization`/`review`), `target_id`, `reason` (`spam`/`scam`/`fake`/`offensive`/`other`), `details`, `status` (`open`/`removed`/`dismissed`), `created_at` · unique (`reporter_id`, `target_type`, `target_id`) | Report button; private to the reporter and staff |
| `blocks` **(new, safety)** | `blocker_id`, `blocked_id`, `created_at` · primary key (`blocker_id`, `blocked_id`) | A block stops messages, conversations, and proposals both ways |
| `posts` pitch fields **(new)** | `venue`, `cover_url`, `currency` (ISO code), `goal_cents` (smallest unit of `currency`), `needs[]`, `deliverables[]` (keys in `valid_deliverables()`), `exclusivity`, `custom_packages`, `audience` / `reach` / `past_stats` / `agenda` / `people` / `use_of_funds` (jsonb `[{label, value}]`), `past_sponsors[]`, `languages[]`, `registrations`, `decision_by`, `report_by`, `payment_terms` | The event page pitches sponsors: the ask, deliverables, packages, audience, plan, timeline |
| `post_tiers.deliverables` **(new)** | `text[]`, same keys | Package comparison table |
| `post_files` **(new)** | `id`, `post_id`, `kind` (`deck`/`plan`/`media_kit`/`other`), `name`, `path` (`<org id>/<file>` in the private `post-files` bucket), `size` · listed publicly, downloadable by signed-in organizations | Sponsorship decks and event plans (PDF ≤ 10 MB) |
| `staff` **(new)** | `user_id` · rows added with `supabase/scripts/make-admin.mjs` | Who can use `/admin` |
| `organizations.suspended_at/suspended_reason`, `posts.removed_at/removed_reason` **(new)** | set only by the admin functions | Suspended pages and taken-down posts are hidden from everyone but the owner and staff |
| `admin_actions` **(new)** | `staff_id`, `action`, `target_id`, `target_label`, `reason`, `created_at` · staff read only | Audit log of every admin action |
| `showcases` **(new, D-028)** | `id`, `org_id`, `post_id`, `title`, `summary`, `body`, `categories[]`, `starts_on`, `ends_on`, `city`, `venue`, `facts` (jsonb `[{label, value}]`), `highlights[]`, `sponsors[]` (names), `cover_url`, `gallery[]` (org-media URLs only), `link` · public read, owner writes | Past events, like Wishket's portfolio (`/showcase`) |

**General rules:**
- Primary keys are `uuid`, except the waitlist.
- Timestamps are `timestamptz` in UTC.
- Money is integer cents.
- Every table has RLS, plus pgTAP tests written by its owner.

## 3. Database functions (RPC)

Called with `supabase.rpc(name, args)`. The page size is **20**.

```sql
-- Posts: open posts only, ranked with ranking_weights (MVP §7.1). Public (security definer) so
-- proposal_count is the real total. Boost slots (MVP §7.2) arrive with Boost; boosted is false until then.
search_posts(q text, filters jsonb default '{}', page int default 0)
  returns table (id uuid, kind post_kind, title text, owner_id uuid, owner_name text,
                 owner_handle text, owner_logo_url text, categories category[], regions text[],
                 budget_band budget_band, attendance_band attendance_band, starts_on date, city text,
                 online boolean, deadline date, created_at timestamptz, proposal_count int,
                 score real, boosted boolean)

search_organizations(q text, filters jsonb default '{}', page int default 0)
  returns table (id uuid, handle text, name text, tagline text, role org_role, kind org_kind,
                 location text, logo_url text)

-- Find sponsors (D-028): sponsor-role organizations or ones with an open sponsor post. filters: category, region.
search_sponsors(q text default '', filters jsonb default '{}', page int default 0)
  returns table (id, handle, name, tagline, location, logo_url, categories, regions, gives, budget_band,
                 open_sponsor_posts int, completed_deals int, rating numeric, reviews int)
category_counts() returns table (category category, posts int)   -- open posts per event type (home page)
tier_slots(post uuid) returns table (tier_id uuid, taken int)      -- won + completed proposals per tier

-- Public totals for an organization page (deals are counted from private proposals).
org_stats(org uuid) returns table (open_posts int, completed_deals int, rating numeric, reviews int)

-- The deal
send_proposal(post uuid, message text, tier_id uuid default null, amount_cents int default null)
  returns uuid                                     -- the new thread; any organization but the owner (D-028)
complete_proposal(proposal uuid) returns void      -- a won deal, either side, after the event
leave_review(proposal uuid, rating int, body text default '') returns uuid
start_conversation(other uuid) returns uuid

record_post_view(post uuid) returns void           -- no-op for anonymous visitors or self-views
record_org_view(org uuid) returns void

-- Safety
blocked_with(other uuid) returns boolean           -- the signed-in org and `other` blocked each other
is_staff() returns boolean
open_reports() returns table (id, target_type, target_id, reason, details, created_at,
                              reporter_name, target_text, target_link)   -- staff only, else empty
resolve_report(report uuid, remove boolean) returns void  -- staff: take down / suspend / delete review, or dismiss
admin_set_suspended(org uuid, suspend boolean, reason text) returns void  -- staff: hide page + posts, ban login, sign out
admin_set_post_removed(post uuid, remove boolean, reason text) returns void  -- staff: take a post down or restore it
admin_delete(target_type text, target uuid, reason text) returns void  -- staff: organization or post, for good
admin_broadcast(audience text, orgs uuid[], body text) returns int  -- staff: DM all | organizers | sponsors | selected
admin_organizations(q) · admin_posts(q) · admin_log()  -- staff lists for /admin (empty for everyone else)
delete_account() returns void                      -- deletes the login; everything else cascades
```

`send_proposal` refuses after the post's `deadline`, after an event post's event ends, and for a sold-out tier. `search_posts` hides those posts and also returns `currency` and `goal_cents`. `send_proposal` and `start_conversation` refuse, and new messages are rejected, when the two organizations blocked each other. Internal helpers used by RLS: `owns_post`, `is_thread_participant`, `thread_blocked`, `org_media_urls`.

**`search_posts` `filters` keys** (all optional; a missing key means "any"):

| Key | Type |
|---|---|
| `kind` | `post_kind` (`event` \| `sponsor`) |
| `categories` | JSON array of `category`; matches posts with any of them |
| `category` | `category` |
| `region` | `text` |
| `budget_band` | `budget_band` |
| `attendance_band` | `attendance_band` |
| `match` | an organization id: rank by fit with its page and hide its own posts (Best matches) |
| `sort` | `recent` (newest first), `deadline` (closing soonest), or `fewest` (fewest proposals); otherwise by score |

**Boost rules** (only `search_posts`, D-005):
- Boosted rows appear only in positions 1 and 6 of each page.
- Relevance must be ≥ 0.3.
- `boosted = true` on those rows.
- The UI **must** show the Boosted badge whenever `boosted` is true.

## 4. Edge Function contracts

- **Auth:** send the user's Supabase session token. `stripe-webhook` and `revenuecat-webhook` instead verify the provider's signature.
- **Errors:** `{ "error": { "code": "limit_reached", "message": "…" } }` with a matching HTTP status.

| Function | Request | Response |
|---|---|---|
| `verify-org-email` | `POST { organization_id, email }`, then `POST { organization_id, code }` | `{ sent: true }`, then `{ verified: true }` |
| `stripe-checkout` | `POST { kind: "plan", plan, interval: "month" \| "year" }` or `{ kind: "boost", boost_kind, target_id, category, region, starts_on }` | `{ url }` (redirect the user there) |
| `stripe-portal` | `POST {}` | `{ url }` |
| `stripe-webhook` | Stripe event | `200`. Writes `subscriptions` / `boosts`. |
| `revenuecat-webhook` | RevenueCat event | `200`. Writes `subscriptions` (`source` = store). |
| `notify` | Database webhook (new proposal, message, follow, review) | Sends push + email |
| `digest` | Cron | Sends digests and saved-search alerts |

Account deletion is **not** an Edge Function: the app removes the organization's `org-media` files, then calls `delete_account()` (§3).

## 5. Storage buckets

| Bucket | Public? | Path | Who can upload | Who can read | Limits |
|---|---|---|---|---|---|
| `org-media` | Yes | `{organization_id}/{file}` | That organization | Anyone | Images ≤ 1600 px, ≤ 2 MB |
| `post-media` | Yes | `{organization_id}/{file}` | That organization (post images) | Anyone | Same |
| `message-attachments` | **No** | `{thread_id}/{file}` | Thread participants | **Only that thread's participants** (RLS checks `thread_participants`) | Images ≤ 1600 px, PDF ≤ 10 MB |

## 6. Cross-feature components

Components one feature exports for others to use, through its `index.ts`. The props below are the contract; the internals are up to the owner.

| Component | Owner | Props | Used by |
|---|---|---|---|
| `PostCard` | A | `{ post: PostCardData; boosted?: boolean }` | Find, Organization, Saved, Following |
| `SendProposalButton` | A | `{ postId: string }`. It handles limits and sign-in itself. | Post page, PostCard |
| `OrgCard` | B | `{ organization: OrgCardData }` | Find, Proposals |
| `ReviewCard` | B | `{ review: ReviewCardData }` | Organization Reviews tab |
| `PaywallGate` | B | `{ feature: PremiumFeature; children }`. It shows children, or a lock + **See plans**. | Find filters, who viewed, read receipts |
| `useSession()` | B | returns `{ session, org, isLoading, refreshOrg }` | Everyone |
| `Gate` | B | `{ isPublic: boolean; children }`. Waits for the session, sends accounts without a page to `/onboarding` and signed-out visitors to `/login` unless public. Used as a navigator's `screenLayout`, so navigators mount on the first render. | `(app)` and `(tabs)` layouts |
| `ReportLink` | B | `{ type: 'post' \| 'organization' \| 'review'; id: string }` → `/report` | Post page, Organization page, ReviewCard |
| `BlockButton` | B | `{ orgId: string }`. Hidden for your own page. | Organization page |
| `usePlan()` | B | returns `{ plan, isPremium, limits }` from `subscriptions` | Everyone |

`*CardData` types are the row shapes returned by the matching search functions in §3, exported from each feature's `index.ts`.

## 7. Client conventions

| Topic | Rule |
|---|---|
| Feature folder | `features/<name>/` containing `screens/`, `components/`, `queries.ts`, `mutations.ts`, `schemas.ts`, `hooks.ts`, `index.ts` |
| Imports | Other features import **only** from `@/features/<name>` (its `index.ts`) |
| Route files | `src/app/**` files only re-export a screen: `export { default } from '@/features/posts/screens/post-screen'` |
| Query keys | `[feature, kind, ...params]`, e.g. `['posts', 'detail', id]` or `['posts', 'list', filters]` |
| Hook names | Reads: `usePost(id)`, `usePosts(filters)`. Writes: `useCreatePost()`, `useUpdatePost()`. |
| Pagination | Infinite lists use a cursor (`created_at`, `id`). Search uses `page`. |
| Validation | zod schemas in `schemas.ts` repeat the database checks, with friendly messages |
| Database types | Generated into `src/lib/database.types.ts` after every migration. Never write them by hand. |
| Errors | Show ErrorState or Toast ([DESIGN_SYSTEM §8](../product/DESIGN_SYSTEM.md#8-states)). Never swallow an error silently. |
| Analytics | `track(event, props)` from `src/lib/analytics.ts`. Event names exactly as in MVP §4.14; property names in `snake_case`. |
| Secrets | Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the app. Everything else lives in Edge Functions. |

## 8. Routes and redirects

- The route list in [WEBSITE_PLAN §2](WEBSITE_PLAN.md#2-site-map) is a contract. Adding, renaming, or removing a route needs a decision entry.
- Redirects: `/premium` → `/pricing` (D-019).
- Auth routes (D-030): `/signup` (create an account; `?role=organizer|sponsor` carries on to onboarding), `/login` (sign in), `/reset-password` (forgot password). "Join" buttons go to `/signup`; actions that need an account go to `/login`.
- Public website pages (D-027, D-028): `/`, `/find`, `/sponsors`, `/showcase`, `/showcase/[id]`, `/posts/[id]`, `/org/[handle]`, `/how-it-works` (`?for=organizers|sponsors`), `/pricing`, `/about`, `/trust`, `/contact`, `/legal/terms`, `/legal/privacy`, `/legal/community`. `/find` accepts `?q=`, `?kind=event|sponsor`, and `?category=`.
- Signed-in only: `/report?type=&id=`, `/admin` (staff), plus the product routes in WEBSITE_PLAN §2.
- Link with typed routes (`href="/posts/123"`). Never build URLs by string concatenation in several places; use a helper exported by the owning feature, e.g. `postHref(id)`.

## 9. Migrations

1. Create with `npx supabase migration new <name>`. The CLI adds the timestamp, so both developers never clash on numbering.
2. One migration per pull request, written by the table's owner, with RLS policies and pgTAP tests in the same pull request.
3. Never edit a merged migration. Write a new one.
4. After merging, regenerate the types (`npx supabase gen types typescript …`).

## 10. Changing a contract

1. Open a pull request that edits this file **and** the code.
2. Both developers approve.
3. Mention it at the weekly sync.
