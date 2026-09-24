# Maple: Decision Log

> Every major product, business, and technical decision, with the reason for it. This stops us from re-arguing settled questions and shows what to revisit when facts change.

**How to use this log**
- Add one entry per decision. Never delete an entry. If a decision changes, add a new entry and mark the old one `Superseded by D-0XX`.
- **Status** is one of: `Proposed` (our current bet, still being tested) · `Accepted` · `Superseded`.
- Every entry has a **revisit when** trigger, so we know what evidence would reopen it.

---

## Index

| ID | Decision | Status | Date |
|---|---|---|---|
| D-001 | Copy LinkedIn's product and monetization model | Accepted | 2026-09-24 |
| D-002 | Beachhead: tech events and hackathons, English-speaking markets | Proposed | 2026-09-24 |
| D-003 | Treat sponsors as the scarce side; free for them during beta | Accepted | 2026-09-24 |
| D-004 | North-star metric: Matched Conversations per week | Accepted | 2026-09-24 |
| D-005 | Boost rules: flat price, labeled, max 2 per 10, relevance ≥ 0.3 | Accepted | 2026-09-24 |
| D-006 | One primary role per account in the MVP | Accepted | 2026-09-24 |
| D-007 | Stack: Next.js + Supabase + Stripe + Vercel | Superseded by D-015, D-016 | 2026-09-24 |
| D-008 | Search with Postgres full-text before adding a search engine | Accepted | 2026-09-24 |
| D-009 | Responsive web first, no native apps in the MVP | Superseded by D-015 | 2026-09-24 |
| D-010 | No transaction fee until Maple Deals (Phase 4) | Accepted | 2026-09-24 |
| D-011 | Pricing: $29 / $49 / $99 / $179 per month | Proposed | 2026-09-24 |
| D-012 | Sponsor budget bands visible to Premium Organizers only | Proposed | 2026-09-24 |
| D-013 | Validate with a concierge MVP before writing code | Accepted | 2026-09-24 |
| D-014 | One repo: `docs/` for planning, `apps/` for code, `supabase/` shared | Superseded by D-018 | 2026-09-24 |
| D-015 | One Expo codebase for the website, iOS app, and Android app | Accepted | 2026-09-24 |
| D-016 | Cloudflare for DNS, web hosting, and email forwarding | Accepted | 2026-09-24 |
| D-017 | Payments: Stripe on the web first, in-app purchases via RevenueCat before store launch | Accepted | 2026-09-24 |
| D-018 | Repo layout: `docs/`, `client/`, `supabase/` | Accepted | 2026-09-24 |
| D-019 | Foundation-only client work before the validation gate | Accepted | 2026-09-24 |
| D-020 | Checkpoint 6 event foundation schema | Accepted | 2026-09-24 |

---

## D-001: Copy LinkedIn's product and monetization model
- **Status:** Accepted · 2026-09-24
- **Context:** Organizers and sponsors already understand LinkedIn: profiles, connections, feed, jobs, InMail, Premium. LinkedIn proves professionals pay for visibility and search (Premium passed $2B a year; see [MARKET.md](../business/MARKET.md)).
- **Decision:** Mirror LinkedIn's objects and paid tiers one to one (see the table in [PLAN.md §3](../business/PLAN.md#3-the-solution-linkedins-model-mapped-to-sponsorship)). Add sponsorship-specific features on top: Boost, Verified Audience, Fit Score, deal pipeline.
- **Consequences:** Near-zero learning curve and an easy pitch ("LinkedIn for sponsorship"). The risk is feeling like a clone, so the sponsorship-specific depth is what differentiates us.
- **Revisit when:** Interviews show users want a workflow tool more than a network.

## D-002: Beachhead: tech events and hackathons, English-speaking markets
- **Status:** Proposed · 2026-09-24 (Phase 0 validates this)
- **Context:** A two-sided marketplace needs density in one niche before it can go broad. Tech sponsors (SaaS, dev tools, cloud) have recurring budgets and dev-rel teams, deals are small and close fast, and both sides live online.
- **Decision:** Launch only for tech events, hackathons, dev meetups, and university tech clubs.
- **Consequences:** Categories, seed content, and marketing all target this niche. The data model stays generic, so switching niches means changing data, not code.
- **Revisit when:** Phase 0 shows weak sponsor interest in tech, or the founders' network is much stronger in another niche.

## D-003: Treat sponsors as the scarce side; free for them during beta
- **Status:** Accepted · 2026-09-24
- **Context:** There are many more organizers looking for money than sponsors with money. Without sponsors, organizers churn.
- **Decision:** Beta sponsors get Premium Sponsor free for 6 months. Founders sell to sponsors directly. The concierge newsletter goes to sponsors.
- **Consequences:** Early revenue comes from organizers (Premium and Boost). Sponsor revenue comes later, through Sponsor Suite.
- **Revisit when:** Active sponsors outnumber active opportunities by more than 1 to 5.

## D-004: North-star metric is Matched Conversations per week
- **Status:** Accepted · 2026-09-24
- **Context:** Signups and posts can grow while nobody actually meets. What proves value is two-sided contact.
- **Decision:** The north star is threads where **both** an organizer and a sponsor have replied, counted weekly.
- **Consequences:** The `matched_conversation` analytics event is required in the MVP ([MVP.md §4.14](MVP.md#414-product-analytics)).
- **Revisit when:** We have enough deal data to switch the north star to deals won.

## D-005: Boost rules
- **Status:** Accepted · 2026-09-24
- **Context:** Paid search priority is a key revenue feature, but pay-to-win results destroy trust. Paid placement must also be disclosed (FTC guidance on search advertising).
- **Decision:** Flat price ($19–$29 for 7 days). Always labeled "Boosted". Fixed slots #1 and #6, so max 2 per 10 results. Relevance must be ≥ 0.3. When several boosts compete, the higher organic score wins. Full rules are in [MVP.md §7.2](MVP.md#72-boost-paid-search-priority).
- **Consequences:** Less short-term revenue than an auction, but more trust.
- **Revisit when:** More than 5 boosts regularly compete for the same slot, which would justify an auction.

## D-006: One primary role per account in the MVP
- **Status:** Accepted · 2026-09-24
- **Context:** Some people both organize and sponsor, but supporting dual roles doubles the complexity of the UI and permissions.
- **Decision:** Users pick Organizer or Sponsor at signup.
- **Revisit when:** More than 5% of users ask for both roles, or create a second account.

## D-007: Stack is Next.js + Supabase + Stripe + Vercel
- **Status:** Superseded by D-015 (Next.js → Expo) and D-016 (Vercel → Cloudflare). Supabase, Stripe, Resend, PostHog, and Sentry still stand. · 2026-09-24
- **Context:** A 1–2 engineer team has 12 weeks. Managed services beat custom infrastructure.
- **Decision:** Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth, Realtime, Storage), Stripe (Billing, Checkout, Portal), Resend, PostHog, Sentry, Vercel. See [MVP.md §9](MVP.md#9-tech-stack).
- **Consequences:** Infra costs about $100–250 a month during beta, with some vendor dependence on Supabase. Postgres stays portable.
- **Revisit when:** Hitting Supabase limits, or costs exceed $2K a month.

## D-008: Search with Postgres full-text before adding a search engine
- **Status:** Accepted · 2026-09-24
- **Context:** Search is core, but at MVP scale Postgres full-text search plus `pg_trgm` is enough, and it saves running a separate service.
- **Decision:** Use Postgres full-text search, `pg_trgm`, and a weighted score. Weights live in the `ranking_weights` table.
- **Revisit when:** More than 1M searchable documents, or p95 search latency above 300ms. Then move to Typesense or Meilisearch.

## D-009: Responsive web first, no native apps in the MVP
- **Status:** Superseded by D-015 · 2026-09-24
- **Decision:** One responsive Next.js web app. Native apps come in Phase 3.
- **Revisit when:** More than 50% of sessions are on mobile **and** retention is proven.

## D-010: No transaction fee until Maple Deals
- **Status:** Accepted · 2026-09-24
- **Context:** A fee on deals invites people to take the deal off-platform and adds legal and financial complexity (contracts, escrow).
- **Decision:** Pure subscription and Boost revenue until Maple Deals (Phase 4), which will add real value: contracts, escrow, payouts.
- **Revisit when:** Users ask Maple to handle contracts or payments.

## D-011: Pricing is $29 / $49 / $99 / $179 per month
- **Status:** Proposed · 2026-09-24 (tested in Phase 0 interviews and pre-sales)
- **Context:** The LinkedIn benchmarks are $39.99 / $59.99 / $99.99 / $170. Organizers have less money than job seekers.
- **Decision:** Premium Organizer $29, Premium Sponsor $49, Scout $99 per seat, Sponsor Suite $179 per seat. Annual plans are about 20% off. See [MARKET.md §6](../business/MARKET.md#6-pricing).
- **Revisit when:** Phase 0 willingness-to-pay answers cluster far from these numbers.

## D-012: Sponsor budget bands visible to Premium Organizers only
- **Status:** Proposed · 2026-09-24
- **Context:** Budget visibility is valuable to organizers and a strong reason to upgrade, but sponsors may hesitate to share it.
- **Decision:** Sponsors enter a budget band. Only Premium Organizers can see it.
- **Revisit when:** Sponsors in interviews refuse to share budget bands at all.

## D-013: Validate with a concierge MVP before writing code
- **Status:** Accepted · 2026-09-24
- **Context:** The biggest risk is whether sponsors show up, not whether we can build it. We can test that manually for close to $0.
- **Decision:** Run a 4-week Phase 0 (interviews, newsletter, manual intros, pre-sales) with a go/no-go gate before any code. See [VALIDATION.md](../research/VALIDATION.md).
- **Revisit when:** Not applicable. This gate runs once.

## D-014: One repo, with docs, apps, and the database kept apart
- **Status:** Superseded by D-018 · 2026-09-24
- **Context:** Planning docs, web code, mobile code, and the database schema shouldn't be mixed together. But they belong to one product and often change together: one schema change affects both web and mobile.
- **Decision:** Use a single repository:
  - `docs/` for planning, split into `business/`, `research/`, and `product/`
  - `apps/<name>/` for each app: `web` in Phase 1, `mobile` in Phase 3
  - `supabase/` at the root, because every app shares the database
  - No workspace tooling (pnpm workspaces, Turborepo) until the mobile app needs to share code with web
- **Consequences:** Each code folder is created by its own setup tool. No placeholder files, which would make `create-next-app` refuse the folder. Personal data (interview notes, contacts) stays out of the repo.
- **Revisit when:** A third app or a shared package appears, or CI builds get slow.

## D-015: One Expo codebase for the website, iOS app, and Android app
- **Status:** Accepted · 2026-09-24 · Supersedes the Next.js part of D-007, and D-009
- **Context:** We want a website, an iOS app, and an Android app. With 1–2 developers, separate web and mobile codebases would double the UI work for every feature. Bluesky, a social network much like Maple, ships all three from one Expo codebase.
- **Decision:** Build the whole client as one Expo app (React Native + Expo Router) in `client/`. It exports to the web and builds for iOS and Android. Public web pages are pre-rendered for SEO. Details: [TECH_STACK.md](../engineering/TECH_STACK.md).
- **Consequences:**
  - Every screen is built once, and the mobile apps ship with the MVP instead of in Phase 3.
  - Desktop web needs deliberate responsive layouts.
  - SEO pages refresh nightly.
  - iOS builds run in the cloud (EAS), so no Mac is needed.
- **Revisit when:** Beta feedback shows desktop web falling clearly short, or SEO needs live server rendering (try Expo server rendering first).

## D-016: Cloudflare for DNS, web hosting, and email forwarding
- **Status:** Accepted · 2026-09-24 · Supersedes the Vercel part of D-007
- **Context:** We already have Cloudflare's free plan. Vercel's free Hobby plan is for non-commercial use only. Our website exports to static files, which Cloudflare serves free with unlimited requests.
- **Decision:** Use Cloudflare's free plan for DNS, CDN, SSL, static web hosting, and Email Routing. Scheduled jobs run on Supabase Cron instead of Vercel Cron.
- **Revisit when:** We add server rendering and exceed the free Workers limits (Workers Paid is $5/mo).

## D-017: Payments: Stripe on the web first, in-app purchases via RevenueCat before store launch
- **Status:** Accepted · 2026-09-24
- **Context:** In most countries, Apple and Google require their own billing for digital subscriptions sold inside apps, and US rules on linking to web checkout are still changing. Beta testers use TestFlight and Play closed testing, not the public stores.
- **Decision:**
  - During beta: Stripe on the website only.
  - Before the public store launch: App Store and Google Play subscriptions and Boosts through RevenueCat.
  - Both write to the `subscriptions` table with a `source` column.
  - Same prices everywhere at first.
- **Consequences:** A 15% store commission on mobile purchases, and one entitlement table for all platforms.
- **Revisit when:** Mobile revenue is significant. Then consider US web link-out (Apple is currently 0%, pending a court-set fee) or different in-app prices.

## D-018: Repo layout is `docs/`, `client/`, `supabase/`
- **Status:** Accepted · 2026-09-24 · Supersedes D-014
- **Context:** With one Expo app for all platforms (D-015), separate `apps/web` and `apps/mobile` folders are no longer needed.
- **Decision:**
  - `docs/` for planning: `business/`, `research/`, `product/`, `engineering/`
  - `client/` for the Expo app (website + iOS + Android)
  - `supabase/` for the backend (migrations, tests, Edge Functions)
  - No workspace tooling
- **Revisit when:** A second app (an admin tool or browser extension, for example) needs to share code.

---

## D-019: Foundation-only client work before the validation gate
- **Status:** Accepted · 2026-09-24
- **Context:** Build Checkpoint 1 explicitly authorizes a limited foundation exception to D-013 while Phase 0 validation continues.
- **Decision:** Permit only low-risk, reversible technical foundation work before the validation gate: the shared Expo client foundation, design primitives, static build verification, and similar reversible infrastructure. No marketplace or product functionality may be built under this exception.
- **Consequences:** Phase 0 continues. The Go/Iterate/Stop validation gate still controls whether the full MVP proceeds. D-013 remains unchanged; this is a narrow exception, not approval of the full product build. Each later checkpoint requires its own explicit scope.
- **Revisit when:** The Phase 0 validation outcome is recorded or a proposed checkpoint exceeds this foundation-only boundary.

---
## Open decisions (to make before or during Phase 0)

| Question | Notes | Needed by |
|---|---|---|
| **Is the name "Maple" usable?** | Other companies already use "Maple" (for example Maplesoft math software, Maple Finance, and a Canadian telehealth service called Maple). Run a trademark search in classes 9, 35, 42, and 45, and check domains and social handles. | Before the landing page |
| Legal entity and jurisdiction | Decide with a lawyer. If you plan to raise from US investors, a Delaware C-corp is the usual default. | Before taking pre-sale money |
| Domain | Depends on the name check | Before the landing page |
| Founder roles and equity split | Write it down early | Before Phase 1 |
| Beta region (which English-speaking market first) | Pick where the founders' network is strongest | Week 1 of Phase 0 |

## D-020: Checkpoint 6 event foundation schema
- **Status:** Accepted · 2026-09-24
- **Decision:** Events require an organization (`org_id`); its Organizer admins manage them. `created_by` replaces `owner_id` as immutable provenance, `title` replaces `name`, `website` replaces `url`, and `format` (in_person / online / hybrid) replaces `online`. Add an immutable unique `slug` for /events/[slug]. Keep `attendance_band` using the CP4 audience_band vocabulary; use canonical categories[] and audience_types[]. Status is draft/published. Store timestamptz start/end plus a PostgreSQL-validated IANA timezone.
- **Consequences:** This scoped checkpoint overrides MVP sections 4.3, 10 and 11 where they describe optional organizations, historical field names/statuses, and ID routes. Organization and creator deletion use RESTRICT. Packages, calls, import, search and production static event prerendering remain deferred. No broader MVP authorization is implied.

## D-021: Checkpoint 7A shared opportunity foundation
- **Status:** Accepted · 2026-09-24, explicit Checkpoint 7A instruction.
- **Decision:** Use opportunities with type package/call, implementing package only. created_by replaces MVP owner_id as provenance; ownership derives through event_id to events.org_id. description replaces body; immutable Event-scoped slug supports nested Event routes. Common status is draft/published. Tier price_minor bigint plus currency replaces price_cents: currency-aware minor units supersede the universal cents wording in CLAUDE.md. Cash prices are public only when Event and Opportunity are published; in-kind has null price/currency. Slots are optional positive integers.
- **Consequences:** No duplicated org_id, no budget or targeting/search fields in this checkpoint. Atomic SECURITY INVOKER RPCs retain tier IDs. Deferred database constraints require a tier for published packages. Client-supported currencies are USD/KRW/JPY/EUR; DB validates uppercase three-letter shape, not complete ISO membership. Prices are capped at JavaScript's safe integer ceiling for reliable JSON transport. Future Calls share opportunities.id; private Sponsor budgets and arbitrary production static prerendering remain deferred.

## D-022: Checkpoint 7B Calls and private budget bands
- **Status:** Accepted · 2026-09-24 · corrected uncommitted Checkpoint 7B.
- **Decision:** One opportunities identity and immutable owner_org_id; package owners derive from Events. Only Sponsor organization admins manage Calls. Public targeting reuses canonical taxonomy and optional gives.
- **Budget:** Follow D-012's band representation. The correction explicitly selects Under $1K, $1–5K, $5–25K, $25K+. No preexisting machine vocabulary or implemented waitlist form was found. Canonical keys are under_1k, 1k_5k, 5k_25k, 25k_plus in client/src/constants/budgetBands.ts, with a parity-tested SQL CHECK. This resolves MVP's historical split of the top band into $25–100K/$100K+. No exact amount or currency is stored for Calls.
- **Privacy:** Optional private opportunity_call_budgets row, Sponsor owner admins only. Premium Organizer visibility remains DEFERRED; no Organizer read policy. Public queries never request budgets. Create/edit RPCs are SECURITY INVOKER with RLS active and atomic set/change/clear. Package-tier money handling is unchanged.


## D-023: Checkpoint 8A Quick Pitch foundation
- **Status:** Accepted by explicit Checkpoint 8A scope · 2026-09-25.
- **Decision:** pitches uses id, opportunity_id, from_id, optional note and created_at. Note is trimmed plain text, at most 300 Unicode characters; blank becomes NULL. Text is never interpreted as HTML or Markdown. Sponsor pitches published packages on published Events; Organizer pitches published Calls. Any member of the owning organization is excluded from pitching its opportunities. UNIQUE(opportunity_id, from_id) alone enforces duplicates. Direct INSERT and private sender/owner-admin SELECT use RLS; no UPDATE/DELETE for clients.
- **Deferrals:** status belongs to pitch inbox/workflow; featured to Premium; thread_id to messaging. All three fields, the inbox and monthly quota are deferred. Monthly Quick Pitch limit: DEFERRED TO PREMIUM / ENTITLEMENTS.
- **Messaging boundary:** A pitch note is not a message. Sending creates no conversation/thread/message and does not emit matched_conversation. Explore links to existing details; only details query pitch state. No private Sponsor budget is read or copied. No messaging, Deals, notifications, Premium, Boost, bookmarks or payments are implemented here.
