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
| D-019 | Public plans page is `/pricing`; `/premium` redirects to it | Proposed | 2026-09-24 |
| D-020 | One sign-in route `/login` for sign-in and sign-up; `/signup` redirects to it | Proposed | 2026-09-24 |
| D-021 | Keep the website draft but freeze it to Phase 0 pages until the Go decision | Proposed | 2026-09-24 |
| D-022 | Feature ownership and feature folders (`src/features/<feature>/`) | Proposed | 2026-09-24 |
| D-023 | Styling with React Native `StyleSheet` + theme tokens, not NativeWind | Proposed | 2026-09-24 |
| D-024 | Build the full v1 now: no waitlist, no Phase 0 gate | Accepted | 2026-09-24 |
| D-025 | Accounts are organizations, not people; LinkedIn's page structure | Accepted (structure replaced by D-026) | 2026-09-24 |
| D-026 | A sponsorship marketplace like Upwork/Wishket: posts, proposals, reviews | Accepted | 2026-09-24 |

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

## D-019: Public plans page is `/pricing`; `/premium` redirects to it
- **Status:** Proposed · 2026-09-24
- **Context:** MVP.md and BUILD_PLAN.md used `/premium`. The website plan needs a public, search-friendly plans page, and "pricing" is the URL people expect.
- **Decision:**
  - `/pricing` is the public plans and Boost page (pre-rendered).
  - `/premium` returns a 301 redirect to `/pricing`, so older links keep working.
  - The page isn't published or linked until D-011 prices are accepted (stage 7).
- **Consequences:** MVP §11 and BUILD_PLAN 7.4 now say `/pricing`.
- **Revisit when:** Never, unless marketing needs separate pages per audience.

## D-020: One sign-in route, `/login`, for sign-in and sign-up
- **Status:** Proposed · 2026-09-24
- **Context:** With email codes (and Google, Apple, LinkedIn), entering an email either signs you in or creates your account. Separate `/signup` and `/login` pages would do the same thing.
- **Decision:** `/login` handles both. `/signup` returns a 301 redirect to `/login`. New users continue to `/onboarding`.
- **Consequences:** Less code and one flow to test. Buttons still say "Sign up" or "Sign in" where that reads better.
- **Revisit when:** Sign-up needs extra steps before an account exists (for example invite codes).

## D-021: Keep the website draft, but freeze it to Phase 0 pages until "Go"
- **Status:** Proposed · 2026-09-24 · Refines D-013
- **Context:** D-013 says no product code before the Phase 0 Go decision. A website draft was written anyway, including placeholder product screens. Deleting correct work would waste it, and continuing would quietly abandon the validation gate.
- **Decision:**
  - Keep the draft.
  - Until Go, change only Home, Privacy, 404, branding, accessibility fixes, deploy setup, and one `waitlist` table.
  - No product screens, accounts, or other tables. Placeholder screens stay untouched.
- **Consequences:** The Phase 0 website can launch for outreach, and product work waits for evidence ([WEBSITE_PLAN §0](../engineering/WEBSITE_PLAN.md#0-current-state-and-freeze-rule)).
- **Revisit when:** The Go/No-Go meeting happens.

## D-022: Feature ownership and feature folders
- **Status:** Proposed · 2026-09-24
- **Context:** Two developers build one codebase for web, iOS, and Android. Splitting by platform would make them edit the same components; splitting by component type spreads each feature across many folders.
- **Decision:**
  - Each developer owns **features** ([OWNERSHIP.md](../engineering/OWNERSHIP.md)).
  - Code lives in `client/src/features/<feature>/`, and route files in `src/app/` only re-export screens.
  - Shared primitives live in `src/ui/`, with one owner.
  - Shared names and interfaces are in [SHARED_CONTRACTS.md](../engineering/SHARED_CONTRACTS.md).
- **Consequences:** Fewer Git conflicts. The draft is restructured at the start of Phase 1 (WEBSITE_PLAN W6).
- **Revisit when:** A third developer joins, or ownership keeps crossing folders.

## D-023: Styling with React Native `StyleSheet` + theme tokens
- **Status:** Proposed · 2026-09-24
- **Context:** TECH_STACK listed NativeWind. The Expo template and the draft already use `StyleSheet` with a token file (`constants/theme.ts`), which works the same on web, iOS, and Android with no extra setup.
- **Decision:** Use `StyleSheet` + the tokens in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). No styling library.
- **Consequences:** One less dependency and its build configuration. Styles are a bit more verbose than utility classes.
- **Revisit when:** Styling speed becomes a real bottleneck for both developers.

## D-024: Build the full v1 now, with no waitlist and no Phase 0 gate
- **Status:** Accepted · 2026-09-24 · Supersedes D-013 and D-021
- **Context:** The founders decided to ship a working v1 by 2026-09-25 instead of validating with a waitlist first.
- **Decision:**
  - Drop the waitlist.
  - v1 = the core loop: email-code sign-in, onboarding, profiles, organizations, events, opportunities (packages with tiers, calls) with Quick Pitch, feed (posts, likes, comments), search, pitches inbox, live messages, and in-app notifications.
  - Later (v1.1): Stripe/Premium/Boost, Google/Apple/LinkedIn sign-in, push notifications, admin, Explore SEO pages, who-viewed, and saved searches.
- **Consequences:** No demand evidence before building, so interviews (VALIDATION.md) run alongside the v1 launch instead of before it.
- **Revisit when:** v1 is live. Use the MVP §14 metrics to decide what comes next.

## D-025: Accounts are organizations, not people; the site follows LinkedIn's page structure
- **Status:** Accepted · 2026-09-24 · Changes the account model in D-024
- **Context:** The founders clarified that Maple does not register individual people. The members are organizations: event organizers (event companies, communities, university clubs, nonprofits) and sponsors (companies, agencies). They also asked for the same website structure as linkedin.com.
- **Decision:**
  - Every account is one organization page at `/org/<handle>`: name, kind, tagline, about, city, website, logo, banner, and matching data (event types, regions, audience or budget). One login per organization in v1; the person who signs in is never shown.
  - The database table is `organizations` (`role` organizer | sponsor, `kind`). The separate people `profiles` table and the old organizations-with-members table are gone. Logos and banners live in the `org-media` storage bucket.
  - Page structure mirrors LinkedIn: a top bar (search, Home, Network, Opportunities, Messaging, Notifications, Me) on desktop and bottom tabs on phones; a three-column home feed; company-style organization pages with Home · About · Posts · Opportunities · Events tabs; a Jobs-style Opportunities list with a detail pane; two-pane Messaging; search results with a tab per result type; a join/sign-in landing page.
  - We copy the structure only, never LinkedIn's name, logo, colors, or text.
- **Consequences:** Follows, pitches, and messages are between organizations. No teammates, roles, or invites yet, so each organization shares one login.
- **Revisit when:** Organizations ask for several teammates on one page (add a members table with admin/member roles and invites).

## D-026: A sponsorship marketplace like Upwork and Wishket: posts, proposals, and reviews
- **Status:** Accepted · 2026-09-24 · Keeps D-025's organization accounts; replaces its LinkedIn page structure, the feed, opportunities, and separate events
- **Context:** The founders want Maple to work like a freelance marketplace (Upwork, Wishket), not a social network: each side posts what it offers and needs, the other side applies.
- **Decision:**
  - **Post** is the one listing type, with `kind`:
    - `event` (organizers): the event plan (dates, place, attendance, audience), the sponsorship goal, the support they need, what sponsors get, and optional priced tiers.
    - `sponsor` (sponsors): the events they want, their budget, the support they give, and what they want in return.
  - **Proposal** (replaces Quick Pitch): the other side applies to a post with a message and, optionally, a tier or amount. The owner moves it new → shortlisted → in talks → won / declined.
  - **Deal and reviews** (replace likes and comments): after the event, either side marks a won proposal **completed**. Then each organization can leave the other one 1–5 star rating with a written review. Reviews are public on organization pages.
  - **Follow** stays: the Find page has a "Following" tab with posts from followed organizations.
  - Pages: Find (browse and filter posts or organizations; public), post page with a sticky summary and "Send proposal", post wizard, My posts, Proposals (received and sent), Messages, Notifications, organization page with Posts and Reviews tabs, and a marketplace landing page.
  - Removed: the social feed, likes, comments, the Opportunities page, the separate Events pages, and the Network and Search pages (Find covers them).
  - Analytics names change: `opportunity_created`/`event_created`/`post_created` → `post_created` (with `kind`); `quick_pitch_sent` → `proposal_sent`; `pitch_status_changed` → `proposal_status_changed`; new `deal_completed` and `review_left`.
- **Consequences:** Less social engagement between deals; trust comes from reviews instead. Search matches posts, not a feed.
- **Revisit when:** Organizations ask for a way to share updates outside of posts.

---

## Open decisions (to make before or during Phase 0)

| Question | Notes | Needed by |
|---|---|---|
| **Is the name "Maple" usable?** | Other companies already use "Maple" (for example Maplesoft math software, Maple Finance, and a Canadian telehealth service called Maple). Run a trademark search in classes 9, 35, 42, and 45, and check domains and social handles. | Before the landing page |
| Legal entity and jurisdiction | Decide with a lawyer. If you plan to raise from US investors, a Delaware C-corp is the usual default. | Before taking pre-sale money |
| Domain | Depends on the name check | Before the landing page |
| Founder roles and equity split | Write it down early | Before Phase 1 |
| Beta region (which English-speaking market first) | Pick where the founders' network is strongest | Week 1 of Phase 0 |
