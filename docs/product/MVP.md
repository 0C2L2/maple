# Maple: MVP Specification

> The smallest version of Maple that proves organizers and sponsors will find each other here, talk, close deals, and pay for visibility.

| | |
|---|---|
| Last updated | 2026-09-24 |
| Build window | 12 weeks (Nov 2026 – Jan 2027): website, iOS, and Android from one codebase |
| Step-by-step plan | [BUILD_PLAN.md](../engineering/BUILD_PLAN.md) |
| Companion docs | [PLAN.md](../business/PLAN.md) · [RESEARCH.md](../research/RESEARCH.md) · [MARKET.md](../business/MARKET.md) |

---

## 1. MVP goal

**The one loop that must work:**

> An organizer posts what they offer → a relevant sponsor finds it in search or the feed within 14 days → they message → they close a deal → one of them pays for more visibility.

The MVP proves four things:
1. **Supply:** organizers create profiles and post sponsorship packages
2. **Demand:** sponsors search, post what they're looking for, and respond
3. **Liquidity:** the two sides meet (matched conversations → deals)
4. **Monetization:** people pay for Premium and Boost (search priority)

## 2. Beachhead

**Tech events, hackathons, dev meetups, and university tech clubs in English-speaking markets.**

Sponsors (SaaS, dev tools, cloud, fintech) have recurring budgets and dedicated dev-rel teams, deals close in weeks, and both sides are online. See [MARKET.md](../business/MARKET.md#4-segments-and-beachhead). Categories are data, not code, so switching niche later is a config change.

## 3. Roles

| Role | Can do |
|---|---|
| **Organizer** | Profile, events, Sponsorship Packages, posts, pitch to Calls for Events, message, Premium Organizer |
| **Sponsor** | Profile, Calls for Events, posts, pitch to Sponsorship Packages, message, Premium Sponsor |
| **Org admin** | Edit organization page, invite teammates |
| **Maple admin** | Moderation, verification, featuring, user support |

Users pick one primary role at signup. Dual-role accounts come later (see §15).

## 4. Features in the MVP

### 4.1 Auth and onboarding
- Sign up with an email code (6 digits), Google, Apple, or **Sign in with LinkedIn**. LinkedIn imports name, photo, and headline to cut onboarding time. Apple sign-in is required on iOS when other social logins are offered.
- Pick a role: **"I organize events"** or **"I sponsor events"**
- Guided profile setup in 3 steps, under 3 minutes. The progress bar shows profile strength.
- Optional: create or join an Organization (auto-suggested by email domain)

### 4.2 Profiles
**Organizer profile**
- Name, photo, headline, location, bio, links
- Event categories (e.g. hackathon, conference, meetup, workshop, festival)
- **Audience block:** typical attendance band, audience types (developers, students, founders…), seniority, regions
- **Past events:** title, date, attendance, short recap, photos
- **Past sponsors:** company names or logos (self-reported, with a "confirmed" badge once the sponsor confirms)
- Media kit upload (PDF)

**Sponsor profile**
- Name, photo, title, company (linked Organization)
- **What we sponsor:** categories, audience types we want, regions
- **Budget band per event:** `Under $1K` · `$1–5K` · `$5–25K` · `$25K+` (D-022)
- **What we give:** cash, in-kind (product, credits), swag, venue, speakers, mentors, prizes
- **Timing:** budget cycle (e.g. "planning Q1 now")
- Past sponsorships

**Organization page**
- Logo, cover, about, website, type (event company / brand / agency / university club)
- Team members, followers, events or sponsorship history
- **Verified company** badge when a member verifies a work email on the org's domain

### 4.3 Events
- Fields: name, dates, city or online, category, expected attendance, audience profile, website or ticket link, status (planning / confirmed / done)
- **Import from URL:** paste an Eventbrite, Luma, or Meetup link and the form fills from the page's Open Graph tags
- Events belong to an organizer and optionally to an organization

### 4.4 Opportunities (Maple's "Jobs")
Opportunities come in two types. Both sides can post.

**Sponsorship Package** (posted by an organizer, attached to an event)
- Tiers, each with a name, price or in-kind value, benefits list, and slots available
- Deadline, what we're looking for (cash / in-kind / both)

**Call for Events** (posted by a sponsor)
- "We want to sponsor N events like X"
- Budget band, categories, audience wanted, regions, date window, what we give, deadline

**Actions on an opportunity**
- **Quick Pitch** (like Easy Apply): one click sends the pitcher's profile and an optional 300-character note
- The poster gets a **Pitches inbox** per opportunity with statuses: `new → shortlisted → in talks → won / declined`
- Marking a pitch **Won** records a deal. It feeds metrics and, later, partner reviews.
- Save / bookmark, share link, report

### 4.5 Posts and feed
- A post has an **intent**: `Offering` · `Seeking` · `Update` · `Recap`
  - Organizer + Offering: "Booth + keynote slot at our 2K-dev conference"
  - Organizer + Seeking: "Need a food sponsor for our 300-person hackathon"
  - Sponsor + Offering: "$10K + cloud credits for 5 student hackathons this spring"
  - Sponsor + Seeking: "Looking for fintech meetups in London"
- Text, up to 4 images, optional link to an Event or Opportunity, and tags (category, region)
- **Feed ranking (simple, no ML):** posts from connections and follows first, then posts matching your categories and regions, ordered by recency with a small boost for engagement
- Like and comment. Repost comes later.

### 4.6 Network
- **Follow** (one-way) people and organizations
- **Connect** (two-way) with an optional note. Free users can send 20 connection requests a week.
- "People you may know / Suggested sponsors / Suggested organizers" panel (rule-based: same category + region)

### 4.7 Search
- Search across **People, Organizations, Events, and Opportunities**
- **Opportunity filters:** type, category, region or online, date window, audience size band, budget band, what's offered (cash / in-kind), deadline, *verified only* (Premium)
- **People filters:** role, category, region, company, budget band (Premium for sponsor budget)
- **Saved searches with email alerts** (Premium)
- Ranking and Boost are described in §7

### 4.8 Messaging
- 1:1 threads with text and PDF/image attachments
- Who can message whom: connections, **or** anyone inside a Quick Pitch thread, **or** anyone via **PitchMail** (Premium credits)
- Unread counts and realtime delivery
- **Read receipts** (Premium)
- Block and report inside a thread

### 4.9 Notifications
- In-app bell plus an email digest (daily, or instant for pitches and messages)
- **Push notifications** on iOS and Android for new pitches, messages, and connection requests. The website uses in-app notifications and email.
- Triggers: connection request or accept, new pitch, pitch status change, new message, comment or like, **new opportunity matching a saved search**, and "someone viewed your profile" (identity shown on Premium)

### 4.10 Who viewed
- Free: count plus the last 3 viewers
- Premium: full list for 90 days, including viewer company and role, for both profiles and opportunities

### 4.11 Payments and plans
- **Website:** Stripe Checkout for subscriptions and one-off Boost purchases
- Stripe Customer Portal for upgrade, downgrade, cancel, and invoices. We don't build a billing UI.
- **iOS and Android apps:** App Store and Google Play purchases through RevenueCat, added before the public store launch. During beta, purchases happen on the website (D-017).
- Stripe and RevenueCat webhooks both update the `subscriptions` and `boosts` tables, so Premium works on every platform, wherever it was bought

### 4.12 Trust and safety
- Email verification is required before posting
- Work-email domain verification gives the **Verified company** badge
- Rate limits: connection requests, Quick Pitches, and PitchMail per day
- Report user, post, opportunity, or message, which goes to the admin moderation queue
- Block user
- New accounts can't send PitchMail for 48 hours (anti-spam)

### 4.13 Admin (minimal)
- Moderation queue (reports): hide content, suspend user
- Verify or unverify organizations manually
- Feature an opportunity on the home page
- Refunds and billing go through the Stripe dashboard, not a custom UI

### 4.14 Product analytics
Track these events (PostHog):
`signup_completed` · `role_selected` · `profile_completed` · `event_created` · `opportunity_created` · `post_created` · `search_performed` · `search_result_clicked` · `quick_pitch_sent` · `pitch_status_changed` · `message_sent` · `matched_conversation` (both sides replied) · `deal_won` · `checkout_started` · `subscription_started` · `boost_purchased` · `boost_impression` · `boost_click`

## 5. Out of scope for the MVP

| Feature | Why not now | Add when |
|---|---|---|
| Web push notifications | In-app notifications and email cover the website. iOS and Android get push in the MVP. | Web users ask for it |
| Maple Scout / Sponsor Suite team plans | Need individual usage first | ≥20 teams ask for shared pipelines |
| Promoted Opportunities (CPC) and Ads | Need traffic first | ≥50K monthly active users |
| AI Fit Score / recommendations | Rule-based matching is enough to learn | ≥1,000 pitches to train on |
| Ticketing integrations (verified attendance) | Needs partner APIs | Phase 3 |
| Partner reviews / endorsements | Need completed deals first | ≥100 deals won |
| Contracts, escrow, payouts (Maple Deals) | Legal and financial complexity | Phase 4 |
| Groups / Communities, newsletters, live | Not core to the loop | Phase 4 |
| Dual-role accounts | Edge case | Users ask for it |
| Multi-language | One region first | Second region |

## 6. Key user flows

### Flow A: Organizer lists a package (target: under 5 minutes)
1. Sign up → pick **Organizer** → import profile from LinkedIn
2. Add an event (paste a Luma or Eventbrite URL to auto-fill)
3. Create a **Sponsorship Package**: add tiers (e.g. Gold $5K, Silver $2K, In-kind)
4. Publish. The package appears in search and in the feed of sponsors who follow that category.
5. Prompt: *"Boost this package to the top of sponsor searches for 7 days: $19"*

### Flow B: Sponsor posts a Call for Events
1. Sign up → pick **Sponsor** → verify work email → Verified company badge
2. Create a **Call for Events**: "$1–5K per event, 5 student hackathons, US, Feb–Apr"
3. Matching organizers get notified (category + region match)
4. Quick Pitches arrive in the Pitches inbox. The sponsor shortlists and messages.

### Flow C: Search → pitch → deal
1. A sponsor searches "hackathon" with filters: developers, 200–1,000 attendees, US
2. Results show boosted items (labeled) in slots #1 and #6, organic results elsewhere
3. The sponsor opens a package and clicks **Interested**, which opens a thread with the organizer
4. Both reply, which counts as a **matched conversation**
5. The organizer marks the pitch **Won**, which records a deal

### Flow D: Upgrade
1. The user hits a limit (e.g. the 6th Quick Pitch this month, or clicks a blurred "who viewed" list)
2. The paywall shows the plan comparison → Stripe Checkout
3. The webhook activates Premium and grants the monthly Boost credit

## 7. Search ranking and Boost

### 7.1 Organic score
```
score = 0.55 × relevance + 0.25 × fit + 0.10 × quality + 0.10 × freshness
```
| Signal | How it's computed (MVP) |
|---|---|
| **relevance** | Postgres full-text `ts_rank_cd`, normalized 0–1, plus `pg_trgm` similarity on names |
| **fit** | Share of the searcher's profile preferences the result matches: category, region, audience band, budget band |
| **quality** | Profile completeness, Verified company badge, pitch response rate (replied within 72h) |
| **freshness** | Exponential decay since last update, 14-day half-life |

The weights live in one config table so they can be tuned without a deploy.

### 7.2 Boost (paid search priority)
| Rule | Why |
|---|---|
| A boosted item must have **relevance ≥ 0.3** for the query | Paying can't make you show up for unrelated searches |
| Boosted items fill **fixed slots #1 and #6** of every 10 results, **max 2 per page** | Organic results keep 80% of the page |
| Always labeled **"Boosted"** | Trust and FTC-style disclosure |
| When several boosts compete for a slot, the **higher organic score wins** | Flat price in the MVP, no auction yet |
| Boost scope is **1 category + 1 region**, for **7 days** | Simple to sell and to explain |
| Unused boosted slots fall back to organic results | No filler |

### 7.3 Boost products in the MVP
| Product | Price | Placement |
|---|---|---|
| Search Boost | $19 / 7 days | Boost slots in search for the chosen category + region |
| Opportunity Boost | $29 / 7 days | Search boost slots **plus** one "Boosted" feed card per session for matching users |
| Profile Boost | $15 / 7 days | "Suggested organizers / sponsors" panel |

Premium plans include **1 Boost credit per month**.

### 7.4 Featured Pitch (Premium)
Quick Pitches from Premium users sort to the top of the recipient's Pitches inbox with a Premium badge. This mirrors LinkedIn's "Featured Applicant".

## 8. Plans and limits in the MVP

| Limit / feature | Free | Premium Organizer ($29) | Premium Sponsor ($49) |
|---|---|---|---|
| Active opportunities | 1 | 3 | 3 Calls for Events |
| Quick Pitches / month | 5 | Unlimited | Unlimited |
| Featured Pitch | – | ✅ | ✅ |
| PitchMail / month | 0 | 10 | 15 |
| Message connections | ✅ | ✅ | ✅ |
| Who viewed | Last 3 | Full 90 days | Full 90 days |
| Advanced filters | – | Sponsor budget band + history | Audience details + verified-only |
| Early access to new opportunities | – | – | 24h head start |
| Saved searches + alerts | 1, weekly | 10, instant | 10, instant |
| Read receipts | – | ✅ | ✅ |
| Boost credits / month | – | 1 | 1 |
| Insights (views, pitch rates) | Basic | Full | Full |

Annual pricing: $24/mo (Organizer) and $39/mo (Sponsor). Early beta users get founder pricing (see [PLAN.md](../business/PLAN.md#phase-0-validate-oct-2026-4-weeks)).

## 9. Tech stack

The full tech plan (what each tool does, why we chose it, how we use it, free tiers, and costs) is in [TECH_STACK.md](../engineering/TECH_STACK.md). Summary:

| Layer | Choice |
|---|---|
| Website + iOS + Android | One **Expo** (React Native + Expo Router) codebase, TypeScript, NativeWind |
| Web hosting, DNS, email forwarding | **Cloudflare** (free) |
| Database, auth, storage, realtime, server functions, cron | **Supabase** (Postgres + Row Level Security, Edge Functions) |
| Search | **Postgres full-text + `pg_trgm`** (D-008) |
| App builds, store uploads, instant updates | **Expo EAS** |
| Payments | **Stripe** on the website, **RevenueCat** for App Store / Google Play purchases |
| Email / push | **Resend** / **Expo Push** |
| Analytics / errors | **PostHog** / **Sentry** |

Expected cost: **$0 during the build**, about **$25–70 a month from beta** ([TECH_STACK.md §7](../engineering/TECH_STACK.md#7-what-it-costs-stage-by-stage)).

## 10. Data model (core tables)

| Table | Key columns |
|---|---|
| `profiles` | id (= auth user), role (`organizer`/`sponsor`), handle, name, headline, bio, photo_url, location, categories[], regions[], audience_types[], audience_band, budget_band, gives[], completeness, is_premium |
| `organizations` | id, slug, name, type, domain, logo_url, about, verified |
| `organization_members` | org_id, profile_id, role (`admin`/`member`), verified_email |
| `events` | id, owner_id, org_id, name, starts_at, ends_at, city, online, category, attendance_band, audience_types[], url, status |
| `opportunities` | id, type (`package`/`call`), owner_id, event_id (nullable), title, body, categories[], regions[], budget_band, audience_band, gives[], wants[], deadline, status, search_vector |
| `opportunity_tiers` | id, opportunity_id, name, price_cents, in_kind, benefits[], slots |
| `pitches` | id, opportunity_id, from_id, note, status (`new`/`shortlisted`/`in_talks`/`won`/`declined`), featured, thread_id |
| `posts` | id, author_id, intent (`offering`/`seeking`/`update`/`recap`), body, images[], opportunity_id, event_id, categories[], regions[] |
| `comments`, `reactions` | post_id, author_id, … |
| `connections` | requester_id, addressee_id, status, note |
| `follows` | follower_id, target_profile_id / target_org_id |
| `threads`, `thread_participants`, `messages` | standard 1:1 messaging, read_at |
| `profile_views` | viewer_id, viewed_profile_id / viewed_opportunity_id, viewed_at |
| `saved_searches` | owner_id, query, filters (jsonb), alert_frequency |
| `subscriptions` | profile_id, stripe_customer_id, plan, status, current_period_end, pitchmail_credits |
| `boosts` | id, owner_id, kind (`search`/`opportunity`/`profile`), target_id, category, region, starts_at, ends_at, stripe_payment_id |
| `deals` | pitch_id, organizer_id, sponsor_id, value_band, won_at |
| `reports` | reporter_id, target_type, target_id, reason, status |
| `notifications` | recipient_id, type, payload (jsonb), read_at |
| `ranking_weights` | key, value (the tunable search weights from §7) |

Row Level Security on every table: users can write only their own rows, and all content is public-read except messages, views, and billing.

## 11. Pages and screens

| Route | Screen |
|---|---|
| `/` | Landing page (logged out) / Feed (logged in) |
| `/signup`, `/login`, `/onboarding` | Auth + role pick + 3-step profile |
| `/feed` | Feed with composer (intent picker) |
| `/search` | Unified search with tabs and filters |
| `/in/[handle]` | Person profile |
| `/org/[slug]` | Organization page |
| `/events/[id]`, `/events/new` | Event page, create or import |
| `/opportunities/[id]`, `/opportunities/new` | Package / Call for Events page, create |
| `/pitches` | Pitches inbox (sent and received) with statuses |
| `/messages`, `/messages/[threadId]` | Messaging |
| `/notifications` | Notifications |
| `/network` | Connections, requests, suggestions |
| `/premium` | Plan comparison + Boost store |
| `/settings` | Account, privacy, billing (links to Stripe Portal) |
| `/admin` | Moderation queue, verification, featuring |
| `/explore/[category]/[region]` | Public SEO pages (e.g. "Hackathons seeking sponsors in NYC") |

## 12. Build timeline (12 weeks, 2-week sprints)

The step-by-step version, with setup commands, app store steps, and beta, is in [BUILD_PLAN.md](../engineering/BUILD_PLAN.md).

| Sprint | Weeks | Deliverables |
|---|---|---|
| **S1** | 1–2 | Repo, CI, Supabase project, design system basics, auth (email code, Google, Apple, LinkedIn), role pick, onboarding, profiles, organizations + domain verification |
| **S2** | 3–4 | Events (with URL import), Opportunities (packages + calls + tiers), posts, feed, likes and comments |
| **S3** | 5–6 | Search (FTS + filters + organic ranking), follow and connect, suggestions panel, public SEO pages |
| **S4** | 7–8 | Quick Pitch, Pitches inbox + statuses + deals, messaging (realtime), notifications (in-app + email) |
| **S5** | 9–10 | Stripe (plans, Checkout, Portal, webhooks), Premium gating and limits, Boost purchase + slot logic, who viewed, saved searches + alerts |
| **S6** | 11–12 | Admin and moderation, rate limits, analytics events, QA, performance pass, seed 100 opportunities, beta invites |

**Definition of done for the MVP:** Flows A–D in §6 work end to end in production with live Stripe payments, and every event in §4.14 fires.

## 13. Launch plan

1. **Weeks −4 to 0 (Phase 0):** waitlist + "Maple Weekly" concierge newsletter + 40 interviews
2. **Seed content:** founders onboard 100 tech events and hackathons personally, and post packages with their permission
3. **Private beta (Feb 2027):** invite 150 organizers + 40 sponsors on the website, TestFlight (iOS), and Google Play closed testing. Sponsors get Premium Sponsor free for 6 months.
4. **Weekly feedback loop:** 5 user calls a week, ship fixes every Friday
5. **Public launch (Apr 2027)** on the website, App Store, and Google Play: Product Hunt, Show HN, dev-rel communities, a hackathon network partnership

## 14. Success metrics (first 90 days after beta)

| Metric | Target | Pivot / rethink if below |
|---|---|---|
| Organizer profiles completed | 500 | 150 |
| Active opportunities | 300 | 80 |
| Weekly active sponsors | 60 | 15 |
| Calls for Events posted by sponsors | 30 | 5 |
| % of opportunities with ≥1 sponsor interaction in 14 days | ≥30% | <10% |
| Matched conversations / week (north star) | 50 by day 90 | <10 |
| Deals won (self-reported) | 25 | 5 |
| Free → paid conversion | ≥3% | <1% |
| Boosts sold | 20 | 3 |
| Sponsor week-4 retention | ≥25% | <10% |

If liquidity (interactions per opportunity) misses badly, the problem is the sponsor side. Double down on concierge matching and sponsor sales before building more features.

## 15. Open decisions (defaults chosen, change if needed)

| Question | Default for MVP |
|---|---|
| Can one account be both organizer and sponsor? | No. One primary role, dual role later. |
| Are sponsor budget bands public? | Visible to Premium Organizers only (a paid feature) |
| Is the sponsor side free during beta? | Yes, free Premium Sponsor for 6 months for beta sponsors |
| Boost pricing: flat or auction? | Flat price. Auction once there are more than 5 boosts per slot. |
| Can a Free user post a Call for Events? | Yes, 1 active (it grows the demand side) |
| Take-rate on deals? | No, not until Maple Deals (Phase 4) |
