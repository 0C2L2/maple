# Maple: Website Plan

> The complete plan for the Maple website (mapleapp.tech): what it must do, the site map, every page and its functions, the folder structure, and the step-by-step order to build it. **Review and approve this before more code is written.**

| | |
|---|---|
| Status | **Draft v2 for review** (fixes the issues from the 2026-09-24 review) |
| Domain | mapleapp.tech |
| Last updated | 2026-09-24 |
| Companion docs | [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) (how it looks) · [OWNERSHIP.md](OWNERSHIP.md) (who builds what) · [SHARED_CONTRACTS.md](SHARED_CONTRACTS.md) (names, data, interfaces both devs must use) |
| Related | [MVP.md](../product/MVP.md) (features) · [BUILD_PLAN.md](BUILD_PLAN.md) (whole project) · [TECH_STACK.md](TECH_STACK.md) (tools) · [DECISIONS.md](../product/DECISIONS.md) |

**How the planning docs fit together**

| Doc | Answers |
|---|---|
| [MVP.md](../product/MVP.md) | What Maple must do |
| **WEBSITE_PLAN.md** (this doc) | Which pages exist, and what each does |
| [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) | How Maple must look everywhere |
| [OWNERSHIP.md](OWNERSHIP.md) | Who builds what |
| [SHARED_CONTRACTS.md](SHARED_CONTRACTS.md) | Which names, tables, functions, and components both developers must respect |

---

## What changed in v2

| # | Review issue | Fix in this version |
|---|---|---|
| 1 | Code started before the validation gate | §0: **keep the draft, but freeze it**. Only Phase 0 website work is allowed until the Go decision (D-021, proposed). |
| 2 | Phase 0 dates were wrong | §1: Phase 0 is **October 2026**, and Phase 1 (build) is Nov 2026 – Jan 2027 |
| 3 | No ownership plan | New [OWNERSHIP.md](OWNERSHIP.md): owners split by **feature**, not platform. Owners added to §3. |
| 4 | `/pricing` vs `/premium` changed silently | Recorded as **D-019** (proposed). `/premium` redirects to `/pricing`. |
| 5 | `/signup` removed silently | Recorded as **D-020** (proposed). `/signup` redirects to `/login`. |
| 6 | Quick Pitch on the Event page | Removed. Pitches belong to **opportunities**, so sponsors open a package and pitch it (§4.6). |
| 7 | No table for saved opportunities | Added `opportunity_bookmarks` ([SHARED_CONTRACTS §2](SHARED_CONTRACTS.md#2-data-model-additions-and-fixes)) |
| 8 | Message attachments used the media-kit bucket | New private bucket **`message-attachments`**, readable only by thread participants (§4.17) |
| 9 | Search functions didn't cover all 4 tabs | Four functions: `search_opportunities`, `search_profiles`, `search_organizations`, `search_events` (§7.1) |
| 10 | `record_profile_view` also used for opportunities | Split into `record_profile_view` and `record_opportunity_view`, each with its own table |
| 11 | 90-day handle redirects had no backend | Removed for MVP. Handles are permanent; support can change one if really needed (§2). |
| 12 | Unvalidated prices would be public | `/pricing` is designed now but **not published until the prices are accepted** (D-011, stage 7) |
| 13 | The waitlist could grow into the production backend | Phase 0 backend is **one `waitlist` table**: no auth, no profiles, nothing else (§9, W3) |
| 14 | No design contract | New [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) |
| 15 | Folder layout caused Git conflicts | Code is organized by **feature folders** (`src/features/<feature>/`) that match ownership (D-022, proposed) |
| 16 | Too few open questions | §11 now lists 17 decisions to make before coding |
| — | Also fixed | Migration files are named by the Supabase CLI (timestamps), not `001_…`. Styling uses React Native `StyleSheet` plus theme tokens, not NativeWind (D-023, proposed), matching the draft. |

---

## Contents

0. [Current state and freeze rule](#0-current-state-and-freeze-rule)
1. [What the website must do](#1-what-the-website-must-do)
2. [Site map](#2-site-map)
3. [Pages list](#3-pages-list)
4. [Page specs: what each page shows and does](#4-page-specs-what-each-page-shows-and-does)
5. [Navigation and layout](#5-navigation-and-layout)
6. [Components](#6-components)
7. [Functions (backend and client)](#7-functions-backend-and-client)
8. [Folder structure](#8-folder-structure)
9. [Step-by-step build plan](#9-step-by-step-build-plan)
10. [Quality bar for every page](#10-quality-bar-for-every-page)
11. [Open questions to decide before coding](#11-open-questions-to-decide-before-coding)

---

## 0. Current state and freeze rule

A **first draft** of the website already exists in `client/` (not deployed, not committed). It was written before this plan.

| Area | Draft state |
|---|---|
| Project | Expo app (SDK 57) in `client/`, with the template's example files removed |
| Brand files | App icon, favicon, header logo, and link-preview image made from the maple-leaf logo |
| Pages with real content | Home (landing + waitlist form), Privacy notice (waitlist version), 404 |
| Placeholder screens | Most product pages exist as "coming in stage N" screens. They're hidden on the live website. |
| Hosting setup | Cloudflare config, security and cache headers, post-build script |
| Checked locally | Build, typecheck, lint, URL/status checks, desktop and phone, light and dark mode |
| Fixed in W2 (2026-09-24) | Screen readers now hear checked states. Headings follow h1 → h2 → h3. Errors show under each field. Touch targets are ≥ 44 px. Text styles match DESIGN_SYSTEM §3. `/pricing` exists (not linked), with `/premium` and `/signup` redirects. `robots.txt` and `sitemap.xml` added. |
| Still open | Folders don't follow §8 yet; that's the first Phase 1 step (W6) |

### Freeze rule: keep the draft, build only Phase 0 until "Go" (D-021, proposed)

Decision D-013 says **no product code before the Phase 0 Go decision**. The draft stays, but it's frozen to this list:

| Allowed now (Phase 0) | Not allowed until the Go decision |
|---|---|
| Home (landing), Privacy, 404 | Feed, Search, Pitches, Messages, Profiles, Events, Opportunities, and every other product screen |
| Branding and assets | Sign-in, onboarding, and accounts |
| Accessibility fixes on those pages | Any database table other than `waitlist` |
| Cloudflare and deploy setup | The restructure into `features/` (it happens in W6, the first Phase 1 step) |
| One `waitlist` table (or Tally, §11 Q14) | New dependencies for product features |

The placeholder screens stay in the repo untouched, as a record of the route plan.

## 1. What the website must do

The website and the iOS/Android apps are **one Expo codebase** (D-015). Every page below works on the web, and the logged-in pages also run in the apps.

| Period | Stage | The website's job | Pages live |
|---|---|---|---|
| **Oct 2026** | **Phase 0: Validation** | Explain Maple and collect the waitlist | Home, Privacy, 404 |
| **Nov 2026 – Jan 2027** | **Phase 1: MVP build** (only after the Phase 0 **Go**) | Nothing new public; the product is built behind the scenes | Still Home, Privacy, 404 |
| **Feb – Mar 2027** | **Private beta** | The full product for invited users | Everything in §2; sign-up is invite-only |
| **Apr 2027 →** | **Public launch** | The full product for everyone | Everything; Home switches from "Join the waitlist" to "Sign up" |

Development work in Nov–Jan is **Phase 1**, never "Phase 0". Phase 0 ends at the Go/No-Go meeting ([VALIDATION.md §8](../research/VALIDATION.md#8-synthesis-and-gono-go)).

## 2. Site map

```
mapleapp.tech  (marketplace model, D-026: posts, proposals, reviews; follow stays)
│
├── PUBLIC  (no login needed; pre-rendered so Google and link previews can read them)
│   ├── /                                   Marketplace landing: search hero, latest posts, how it works
│   ├── /find                               Browse posts (public; Following/Saved tabs need sign-in)
│   ├── /pricing                            Plans and Boost prices (published in stage 7, D-019)
│   ├── /org/[handle]                       Organization page (Posts + Reviews tabs)
│   ├── /posts/[id]                         Post page with Send proposal sidebar
│   └── /legal/privacy · /legal/terms · /legal/community
│
├── SIGN-IN  (D-020: one route for sign-in and sign-up)
│   ├── /login                              Email code (Google, Apple, LinkedIn in v1.1)
│   ├── /auth/callback                      Return point after OAuth sign-in (web)
│   └── /onboarding                         Pick a role, then create the organization page
│
├── APP  (login required; bottom tabs on phones, top bar on desktop)
│   ├── /find                               [tab] Browse posts
│   ├── /my-posts                           [tab] Your posts with proposal counts
│   ├── /proposals                          [tab] Proposals received and sent
│   ├── /messages                           [tab] Conversations
│   │   └── /messages/[threadId]            One conversation
│   ├── /notifications                      [tab] Notifications
│   ├── /posts/new · /posts/[id]/edit       Post wizard (event post or sponsor post)
│   ├── /boost?target=…                     Buy a Boost for a post or organization (v1.1)
│   └── /settings                           Account, notifications, billing, delete account
│
├── ADMIN  (Maple staff only)
│   └── /admin                              Reports, verification, featured posts
│
└── SYSTEM
    ├── 404 page                            Any unknown URL
    ├── /premium  → 301 → /pricing          (D-019)
    ├── /signup   → 301 → /login            (D-020)
    ├── /robots.txt · /sitemap.xml          For search engines
    ├── /og.png · favicon                   Link-preview image, browser icon
    └── /.well-known/…                      Makes mapleapp.tech links open the iOS/Android app
```

**URL rules**
- Static paths win over dynamic ones (`/events/new` is never treated as an event ID).
- URLs are lowercase with hyphens. Category and region values come from the taxonomy in [SHARED_CONTRACTS §1](SHARED_CONTRACTS.md#1-vocabulary-and-enum-values).
- **Handles are permanent in the MVP.** You choose one at onboarding and can't change it in the app. Support can change one on request, and old links then break. There are no redirect-history tables. Revisit after launch.
- Adding, renaming, or removing a route needs a decision entry. The route list is a shared contract.

## 3. Pages list

**Rendering:**
- **Pre-rendered:** HTML is built ahead of time, for Google and link previews.
- **Nightly:** pre-rendered pages are rebuilt every night from the database.
- **Browser:** built in the browser after login.

**Owner:** Dev A or Dev B, as proposed in [OWNERSHIP.md](OWNERSHIP.md). **Status** refers to the draft in `client/`.

| # | Page | URL | Who can see it | Rendering | Build stage | Owner | Status |
|---|---|---|---|---|---|---|---|
| 1 | Home | `/` | Everyone | Pre-rendered | v1 | B | Built (marketplace landing) |
| 2 | Privacy | `/legal/privacy` | Everyone | Pre-rendered | v1 | B | Built |
| 3 | 404 | any unknown URL | Everyone | Pre-rendered | v1 | B | Built |
| 4 | Terms | `/legal/terms` | Everyone | Pre-rendered | 8 | B | Not started |
| 5 | Community guidelines | `/legal/community` | Everyone | Pre-rendered | 8 | B | Not started |
| 6 | Pricing | `/pricing` | Everyone | Pre-rendered | 7 (not public before) | B | Placeholder (not linked) |
| 7 | Organization | `/org/[handle]` | Everyone | Nightly + browser | 5 | B | Built (Posts + Reviews) |
| 8 | Post | `/posts/[id]` | Everyone | Nightly + browser | 5 | A | Built |
| 9 | Find | `/find` | Everyone (Following/Saved need login) | Browser | 5 | A | Built |
| 10 | Sign in / sign up | `/login` | Logged-out | Browser | 4 | B | Built |
| 11 | Auth callback | `/auth/callback` | — | Browser | 4 | B | Not started |
| 12 | Onboarding | `/onboarding` | New users | Browser | 4 | B | Built |
| 13 | New / edit post | `/posts/new`, `/posts/[id]/edit` | Logged-in | Browser | 5 | A | Built |
| 14 | My posts | `/my-posts` | Logged-in | Browser | 5 | A | Built |
| 15 | Proposals | `/proposals` | Logged-in | Browser | 6 | A | Built |
| 16 | Messages | `/messages` | Logged-in | Browser | 6 | A | Built |
| 17 | Conversation | `/messages/[threadId]` | Participants | Browser | 6 | A | Built |
| 18 | Notifications | `/notifications` | Logged-in | Browser | 6 | A | Placeholder |
| 19 | Buy a Boost | `/boost` | Logged-in | Browser | 7 | B | Not started |
| 20 | Settings | `/settings` | Logged-in | Browser | 8 | B | Placeholder |
| 21 | Admin | `/admin` | Staff | Browser | 8 | A | Placeholder |

## 4. Page specs: what each page shows and does

> **D-026 (marketplace) superseded the LinkedIn-era specs below** (feed, opportunities, pitches, events, network, search, person profiles, Explore). They stay as history; do not build from them. The live spec is the site map in §2, [MVP §10–11](../product/MVP.md#10-data-model-core-tables), [SHARED_CONTRACTS](SHARED_CONTRACTS.md), and `client/src/`.

Each page lists:
- **Shows:** the sections, top to bottom
- **Actions:** what the user can do, and what happens
- **Data:** tables read (R) or written (W), from [MVP §10](../product/MVP.md#10-data-model-core-tables) plus [SHARED_CONTRACTS §2](SHARED_CONTRACTS.md#2-data-model-additions-and-fixes)
- **Rules:** who can do what, limits, and Premium features
- **Events:** analytics events from [MVP §4.14](../product/MVP.md#414-product-analytics)

Visual details (sizes, colors, states) come from [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md).

### 4.1 Home: `/`
- **Shows:**
  1. Header: logo, **Join the waitlist**. After launch: **Sign in** and **Join**.
  2. Hero: headline "Where events and sponsors find each other", one-sentence explanation, two buttons: **I'm organizing an event** and **I'm a sponsor**.
  3. "Like LinkedIn, built for sponsorship": 4 cards (Sponsorship Packages, Calls for Events, Search built for sponsorship, Quick Pitch).
  4. How it works: 3 steps for organizers, 3 steps for sponsors.
  5. Questions: 3–5 FAQs.
  6. Waitlist form (fields below).
  7. Footer: Privacy, Terms (from stage 8), hello@mapleapp.tech, ©.
- **Actions:**
  - Hero button → pre-selects the role and scrolls to the form.
  - **Submit:** the form checks the fields, saves them to `waitlist`, and shows "You're on the list".
  - An email already on the list also shows success, without saying whether it was new.
  - If the save fails, a message shows the contact email.
  - After launch, the buttons go to `/login?role=…`.
- **Data:** W `waitlist` (insert only; nobody can read the list through the website).
- **Rules:**
  - Phase 0 has no accounts: the waitlist is the only backend.
  - No link to `/pricing` until stage 7.
  - Signed-in users (from stage 4) go to `/feed`.
  - The iOS/Android app skips this page.
- **Events:** Phase 0 counts rows in `waitlist`. From stage 4: `signup_completed`.
- **SEO:** title "Maple", a description, and the link-preview image `og.png`.

**Waitlist form fields** (the waitlist uses coarser bands than the product; see [SHARED_CONTRACTS §1](SHARED_CONTRACTS.md#1-vocabulary-and-enum-values))

| Field | Required | Values | Check |
|---|---|---|---|
| I am… | Yes | Organizer / Sponsor | One selected |
| Name | Yes | Text | 1–120 characters |
| Email | Yes | Email | Valid format, ≤254 characters, unique (case-insensitive) |
| Organization | No | Text | ≤160 characters |
| Expected attendance (organizers) | No | Under 100 · 100–500 · 500–2,000 · 2,000+ | One of the list |
| Typical budget per event (sponsors) | No | Under $1K · $1–5K · $5–25K · $25K+ | One of the list |
| OK to contact me for a 20-minute call | No | Yes / No | — |

The database enforces the same checks, so a bad request can't bypass the form.

### 4.2 Pricing: `/pricing` (D-019)
- **Published in stage 7**, and only after the prices in D-011 are accepted. Until then the route isn't linked, isn't in `sitemap.xml`, and shows a placeholder.
- **Shows:**
  - Monthly/annual switch
  - Plan cards: Free, Premium Organizer, Premium Sponsor. Scout and Sponsor Suite are marked "coming later".
  - Boost prices
  - FAQ: cancel anytime, refunds, taxes
- **Actions:**
  - **Choose plan**, logged out → `/login?next=/pricing`.
  - **Choose plan**, logged in on the web → Stripe Checkout.
  - **Choose plan**, logged in on iOS/Android → in-app purchase (stage 10).
  - Current subscribers see **Manage billing** (Stripe portal).
- **Data:** R `subscriptions`.
- **Events:** `checkout_started`, `subscription_started`.

### 4.3 Explore: `/explore` and `/explore/[category]/[region]`
- **Shows:**
  - `/explore`: a grid of categories × top regions.
  - The list page: a title like "Hackathons seeking sponsors in New York", filter chips, opportunity cards (boosted ones labeled **Boosted**), and a sign-up call to action.
- **Actions:** open an opportunity, change category or region, sign up.
- **Data:** R through `search_opportunities`.
- **Rules:** pre-rendered nightly for every category × region that has at least one open opportunity. Empty combinations aren't published.

### 4.4 Person profile: `/in/[handle]`
- **Shows:**
  - Header: photo, name, headline, role badge, location, Verified company badge, organization link.
  - Action buttons.
  - About.
  - **Organizers:** audience (size band, audience types, regions), past events, past sponsors.
  - **Sponsors:** what they sponsor, what they give, timing, past sponsorships, and budget band (**Premium Organizers only**).
  - Recent posts and open opportunities.
- **Actions:** Connect (with a note), Follow, Message (connections, or PitchMail), Share, Report, Block. On your own profile: **Edit**.
- **Data:**
  - R `profiles`, `organizations`, `events`, `opportunities`, `posts`, `connections`, `follows`.
  - W `profile_views` through `record_profile_view` (signed-in visitors only).
- **Rules:** logged-out visitors see public fields and "Sign up to connect". Private fields never appear in pre-rendered HTML.

### 4.5 Organization: `/org/[slug]`
- **Shows:**
  - Logo, cover, name, type, Verified badge, about, website, team members, followers.
  - **Event companies:** events.
  - **Brands:** sponsorship history and open Calls for Events.
- **Actions:** Follow, Share, Report. Org admins can also **Edit** and **Invite teammates**.
- **Data:** R `organizations`, `organization_members`, `events`, `opportunities`, `follows`.

### 4.6 Event: `/events/[id]`
- **Shows:** name, dates, city or online, category, expected attendance, audience profile, organizer and organization, website or ticket link, status, and this event's Sponsorship Packages.
- **Actions:**
  - Everyone: open a package, Save the event's packages, Share, Report.
  - Sponsors: **open a package to pitch it**. There's no Quick Pitch on the event itself, because a pitch always belongs to an opportunity: Event → Sponsorship Package → Quick Pitch.
  - The owner: Edit, **Add a Sponsorship Package**.
- **Data:** R `events`, `opportunities` (packages for this event).

### 4.7 Opportunity: `/opportunities/[id]`
- **Shows:**
  - **Sponsorship Package:** event summary, tiers table (name, price or in-kind, benefits, slots left), what they're looking for, deadline.
  - **Call for Events:** sponsor and company, budget band, categories, audience wanted, regions, date window, what they give, deadline.
- **Actions:**
  - **Quick Pitch** (optional note of up to 300 characters) creates a pitch and a conversation.
  - **Save** (bookmark), Share, Report.
  - The owner: Edit, Close, **Boost**, and **See pitches** (goes to `/pitches`).
- **Data:**
  - R `opportunities`, `opportunity_tiers`.
  - W `pitches`, `threads`, `opportunity_bookmarks`, and `opportunity_views` (through `record_opportunity_view`).
- **Rules:**
  - Free users get 5 Quick Pitches a month; Premium is unlimited, and a Premium pitch shows as a **Featured Pitch** at the top of the recipient's inbox.
  - One pitch per person per opportunity.
  - You can't pitch your own opportunity.
- **Events:** `quick_pitch_sent`.

### 4.8 Post: `/posts/[id]`
- **Shows:** the author, an intent tag (Offering / Seeking / Update / Recap), text, images, a linked event or opportunity, the like count, and comments.
- **Actions:** Like, Comment, Share, Report. On your own post: Delete.
- **Data:** R/W `posts`, `reactions`, `comments`.

### 4.9 Legal pages: `/legal/privacy`, `/legal/terms`, `/legal/community`
- **Privacy:** the Phase 0 waitlist version now. A full policy, reviewed by a lawyer, before beta (stage 8).
- **Terms:** Maple isn't a party to sponsorship deals, plus acceptable use, paid plans and refunds, and account termination.
- **Community guidelines:** no fake events, no inflated audience numbers, no spam pitches, respectful messaging. The App Store requires these rules for apps with user content.

### 4.10 Sign in or sign up: `/login` (D-020)
- **Shows:**
  - Step 1: email field plus **Continue with Google / Apple / LinkedIn**.
  - Step 2: a 6-digit code field, with **Resend** after 60 seconds.
- **Actions:**
  - A correct code signs you in, or creates the account if the email is new.
  - New users go to `/onboarding`; returning users go to `?next=` or `/feed`.
- **Rules:**
  - Supabase limits how often codes can be requested.
  - Turnstile (bot check) is switched on only if bots show up.
  - During beta, only invited emails can sign up.
- **Events:** `signup_completed` for new users.

### 4.11 Auth callback: `/auth/callback`
- Finishes Google or LinkedIn sign-in on the web, then routes the user the same way as `/login`. It shows only a spinner.

### 4.12 Onboarding: `/onboarding`
- **Shows:** a progress bar plus four steps:
  - **Step 0:** pick a role, **I organize events** or **I sponsor events**.
  - **Step 1:** name, photo, headline, location, and **handle** (permanent; the page says so).
  - **Step 2 (organizers):** event categories, audience types, typical attendance, regions.
  - **Step 2 (sponsors):** categories, audience wanted, budget band per event, what you give, regions.
  - **Step 3:** your organization. Join the one suggested by your email domain, create one, or skip.
- **Actions:** Next, Back, Skip (for optional steps), Finish (goes to `/feed`).
- **Data:** W `profiles`, `organizations`, `organization_members`.
- **Events:** `role_selected`, `profile_completed`.

### 4.13 Feed: `/feed`
- **Shows:**
  - A "Offering or seeking something?" prompt (opens `/posts/new`).
  - The post list: posts from connections and follows first, then posts matching your categories and regions, newest first.
  - Right panel (wide screens): suggested people and organizations, and at most one **Boosted** opportunity card.
- **Actions:** Like, Comment, Open, Share, Report, pull to refresh, infinite scroll.
- **Data:** R through the `feed` function, plus `follows`, `connections`.
- **Empty state:** "Follow organizers and sponsors in your category", with suggestions.

### 4.14 New post: `/posts/new`
- **Shows:**
  - An intent picker (Offering, Seeking, Update, Recap)
  - Text, up to 3,000 characters
  - Up to 4 images, resized before upload
  - Optionally a linked event or opportunity
  - Category and region tags
- **Actions:** Post, Cancel (asks before throwing away a draft).
- **Data:** W `posts`, plus the `event-photos` storage bucket.
- **Events:** `post_created`.

### 4.15 Search: `/search`
- **Shows:**
  - A search box.
  - Tabs: **Opportunities** (the default), People, Organizations, Events.
  - A filter bar per tab ([MVP §4.7](../product/MVP.md#47-search)).
  - A sort option: best match, newest, or deadline.
  - Results as cards. Boosted results sit in slots 1 and 6 and are always labeled **Boosted**.
- **Actions:** Search, Filter, Open a result, Quick Pitch from an opportunity card, **Save this search** (email alerts are Premium).
- **Data:** each tab has its own function: `search_opportunities`, `search_profiles`, `search_organizations`, `search_events` ([SHARED_CONTRACTS §3](SHARED_CONTRACTS.md#3-database-functions-rpc)). W `saved_searches`.
- **Rules:**
  - Premium-only filters (sponsor budget band, verified-only) show a lock and an upgrade link.
  - Only `search_opportunities` returns boosted rows in the MVP.
- **Events:** `search_performed`, `search_result_clicked`, `boost_impression`, `boost_click`.

### 4.16 Pitches: `/pitches`
- **Shows:**
  - **Received:** grouped by your opportunities.
  - **Sent.**
  - Each pitch: the person's card, their note, a Featured badge if Premium, and a status of new, shortlisted, in talks, won, or declined.
- **Actions:**
  - Change the status. Marking a pitch **Won** asks for the deal size and creates a deal.
  - **Message** opens the conversation.
- **Data:** R/W `pitches`, W `deals`.
- **Events:** `pitch_status_changed`, `deal_won`.

### 4.17 Messages: `/messages` and `/messages/[threadId]`
- **Shows:**
  - **List:** conversations with the other person, last message, and unread count, plus a search box.
  - **Conversation:**
    - Messages arrive live.
    - A text box with PDF and image attachments.
    - Read receipts (Premium).
    - The linked opportunity, when a pitch started the thread.
- **Actions:** Send, Attach, Block, Report.
- **Data:**
  - R/W `threads`, `thread_participants`, `messages`.
  - Attachments go to the private **`message-attachments`** bucket, which only that thread's participants can read ([SHARED_CONTRACTS §5](SHARED_CONTRACTS.md#5-storage-buckets)).
- **Rules:** you can message connections, anyone in a pitch conversation, or anyone else with PitchMail (Premium credits).
- **Events:** `message_sent`. `matched_conversation` fires on the server when both sides have replied (the north-star metric).

### 4.18 Me: `/me`, `/me/edit`, `/me/views`
- **`/me`:** your profile preview plus a menu:
  - Edit profile
  - My organization
  - My events
  - My opportunities
  - Saved
  - Network
  - Who viewed me
  - Settings
  - Sign out
  - (Pricing appears from stage 7.)
- **`/me/edit`:** every profile field ([MVP §4.2](../product/MVP.md#42-profiles)) except the handle, a media-kit PDF upload, and a profile-strength meter.
- **`/me/views`:**
  - Free: the view count plus the last 3 viewers.
  - Premium: the full list for 90 days, with company and role.
  - Opportunity owners see opportunity views on the opportunity itself.
- **Data:** R/W `profiles`. R `profile_views`.

### 4.19 Network: `/network`
- **Tabs:** Connections, Requests (Accept / Ignore), Suggestions (same category and region), Following.
- **Rules:** free users can send 20 connection requests a week.
- **Data:** R/W `connections`, `follows`.

### 4.20 Notifications: `/notifications`
- **Shows:** a list grouped by day (new pitch, pitch status change, message, connection request or accept, comment or like, new match for a saved search, profile view).
- **Actions:** tap to open, **Mark all as read**.
- **Data:** R/W `notifications`.

### 4.21 Saved: `/saved`
- **Tabs:**
  - Opportunities: your bookmarks, from `opportunity_bookmarks`.
  - Searches: from `saved_searches`, with an alert frequency of off, weekly, or instant (Premium).
- **Data:** R/W `opportunity_bookmarks`, `saved_searches`.

### 4.22 Create and edit: events, opportunities, organizations
- **Event form:** the fields in [MVP §4.3](../product/MVP.md#43-events). **Import from link** fills the form from an Eventbrite, Luma, or Meetup URL.
- **Opportunity form:**
  - Choose the type: a Sponsorship Package (organizers, linked to an event) or a Call for Events (sponsors).
  - Tiers editor: add, remove, and reorder tiers.
  - Deadline.
  - It checks the plan limit before publishing (Free: 1 active).
- **Organization form:** name, URL slug (permanent, like handles), type, website domain, logo, about. **Verify** sends a code to your work email on that domain.
- **After publishing:** offers "Boost this for 7 days?" (from stage 7).
- **Data:** W `events`, `opportunities`, `opportunity_tiers`, `organizations`, `organization_members`.
- **Events:** `event_created`, `opportunity_created`.

### 4.23 Buy a Boost: `/boost?target=…`
- **Shows:**
  - Product choice: Search Boost, Opportunity Boost, or Profile Boost, each for 7 days, with prices from D-011 once accepted.
  - Category and region.
  - Start date.
  - Credits available.
- **Actions:** use a credit, or pay (Stripe on the web, in-app purchase in the apps from stage 10).
- **Data:** W `boosts`.
- **Events:** `boost_purchased`.

### 4.24 Settings: `/settings`
- **Sections:**
  - Account: email, sign-in methods, and your handle (shown, not editable).
  - Notifications: email digest frequency, push on/off.
  - Privacy: blocked users, and whether you appear in others' "who viewed" lists.
  - Billing: your plan, **Manage billing**.
  - **Delete account**: asks you to confirm, then deletes everything.
  - Sign out.
- **Data:** R/W `profiles`, `subscriptions`. The `delete-account` function does the deleting.

### 4.25 Admin: `/admin`
- **Tabs:**
  - **Reports:** hide the content, suspend the user, or dismiss the report.
  - **Verification:** approve or remove organization badges.
  - **Featured:** pick the opportunities shown on Home.
  - **Waitlist:** view and export to CSV. In Phase 0, use the Supabase dashboard instead.
- **Rules:** only the admin role can open it, and that's enforced by the database (RLS), not just by hiding the page.

### 4.26 404
- "This page doesn't exist" and a link to Home. Served with a real 404 status code.

## 5. Navigation and layout

The visual rules (breakpoints, widths, header, tabs, sidebar) live in [DESIGN_SYSTEM §5 and §7](../product/DESIGN_SYSTEM.md#5-layout-and-breakpoints). The structure is:

| Where | Navigation |
|---|---|
| Public pages on the web | **Header:** logo + main call to action (later also Explore, Pricing, Sign in). **Footer:** legal links, contact email. |
| App on phones and in the iOS/Android apps | Bottom tabs: **Feed, Search, Pitches, Messages, Me** |
| App on desktop | Left sidebar with the same 5 items plus Notifications, Network, and a **Post** button. Right panel on wide screens. |
| Links on phones | `mapleapp.tech/...` links open the app when it's installed (stage 5.6) |

## 6. Components

| Kind | Where it lives | Defined in |
|---|---|---|
| **Design-system primitives** (Button, TextField, ChoiceChips, Checkbox, Card, Badge, Avatar, Tabs, Modal, Toast, EmptyState, Skeleton, ErrorState, Paywall…) | `src/ui/` (one owner) | [DESIGN_SYSTEM §6](../product/DESIGN_SYSTEM.md#6-components) |
| **Cross-feature components** (OpportunityCard, EventCard, ProfileCard, OrgCard, PostCard, QuickPitchButton, PaywallGate…) | Their feature folder, exported through the feature's `index.ts` | [SHARED_CONTRACTS §6](SHARED_CONTRACTS.md#6-cross-feature-components) (props contract) |
| **Feature-only components** (TierEditor, MessageBubble, FilterBar…) | `src/features/<feature>/components/` | The feature owner decides |

## 7. Functions (backend and client)

Exact signatures and return shapes are in [SHARED_CONTRACTS §3–4](SHARED_CONTRACTS.md#3-database-functions-rpc).

### 7.1 Database functions (SQL in Supabase, callable from the app)

| Function | Does | Used by | Owner |
|---|---|---|---|
| `search_opportunities(q, filters, page)` | Ranks opportunities ([MVP §7](../product/MVP.md#7-search-ranking-and-boost)), places Boost slots, flags them | Search, Explore, Feed panel | B |
| `search_profiles(q, filters, page)` | Searches people | Search (People tab) | B |
| `search_organizations(q, filters, page)` | Searches organizations | Search (Organizations tab) | B |
| `search_events(q, filters, page)` | Searches events | Search (Events tab) | B |
| `feed(before, limit)` | Posts for the signed-in user in feed order | Feed | A |
| `record_profile_view(profile_id)` | Saves a profile view (at most once a day per viewer) | Profile | B |
| `record_opportunity_view(opportunity_id)` | Saves an opportunity view (at most once a day per viewer) | Opportunity | A |
| Plan-limit triggers | Block actions past the Free limits (opportunities, pitches, connection requests) | Forms, Quick Pitch, Network | Table owner |
| Matched-conversation trigger | Sets `threads.matched_at` when both sides have replied | Messages, analytics | A |
| Deal trigger | Creates a `deals` row when a pitch is marked Won | Pitches | A |

### 7.2 Edge Functions (server code with secret keys)

| Function | Does | Stage | Owner |
|---|---|---|---|
| `verify-org-email` | Sends and checks a code sent to a work email | 5 | B |
| `notify` | Sends push notifications and email for new proposals, messages, follows, and reviews | 6 | A |
| `digest` | Sends email digests and saved-search alerts | 6 | A |
| `stripe-checkout`, `stripe-portal`, `stripe-webhook` | Web payments | 7 | B |
| `revenuecat-webhook` | App Store and Google Play purchases | 10 | A |
| `delete-account` | Deletes a user and all their data | 8 | B |

### 7.3 Client code

| Where | Does |
|---|---|
| `src/lib/supabase.ts` | One shared database client |
| `src/lib/database.types.ts` | Types generated from the database schema |
| `src/lib/analytics.ts` | `track(event, props)` with the event names from MVP §4.14 |
| `src/lib/images.ts` | Pick, resize (≤1600 px), and upload images |
| `src/features/<feature>/queries.ts` · `mutations.ts` | Reads and writes for that feature, wrapped in TanStack Query (conventions in SHARED_CONTRACTS §7) |
| `src/features/<feature>/schemas.ts` | zod schemas: the same checks as the database, with friendly error text |

## 8. Folder structure

Organized by **feature**, so each developer mostly works in their own folders (D-022, proposed).

```
maple/
├── README.md · CLAUDE.md
├── docs/                                   planning only (no code)
│
├── client/                                 THE WEBSITE + iOS + ANDROID APP (one Expo project)
│   ├── app.json · eas.json · package.json · wrangler.jsonc · .env.example
│   ├── assets/images/                      icon, favicon, logo, splash, Android icons, original leaf art
│   ├── public/                             copied to the website root: og.png, _headers, _redirects, robots.txt, .well-known/
│   ├── scripts/finalize-web-export.mjs     after build: 404 pages, fallbacks for dynamic URLs
│   └── src/
│       ├── app/                            ROUTES ONLY: each file re-exports a screen from features/
│       │   ├── _layout.tsx · +html.tsx · +not-found.tsx
│       │   ├── (public)/                   /, /pricing, /explore/…, /in/…, /org/…, /events/[id], /opportunities/[id], /posts/[id], /legal/…
│       │   ├── (auth)/                     /login, /auth/callback, /onboarding
│       │   ├── (app)/                      logged-in routes; (tabs)/ holds the 5 tabs
│       │   └── (admin)/                    /admin
│       │
│       ├── features/                       ONE FOLDER PER FEATURE (owner in OWNERSHIP.md)
│       │   ├── site/                       landing, legal pages, waitlist form, site header/footer   (B)
│       │   ├── explore/                                                                             (B)
│       │   ├── auth/                       login, callback, onboarding, session                    (B)
│       │   ├── profiles/                   profile, me, edit, who viewed                            (B)
│       │   ├── organizations/                                                                        (B)
│       │   ├── network/                                                                              (B)
│       │   ├── search/                     search screen, saved searches                            (B)
│       │   ├── billing/                    pricing, Stripe, Boost (RevenueCat part: A)              (B)
│       │   ├── settings/                                                                             (B)
│       │   ├── events/                                                                               (A)
│       │   ├── opportunities/              opportunity pages, forms, bookmarks, /saved              (A)
│       │   ├── posts/                      feed, posts, comments                                    (A)
│       │   ├── pitches/                                                                              (A)
│       │   ├── messaging/                                                                            (A)
│       │   ├── notifications/              in-app list, push                                        (A)
│       │   └── admin/                                                                                (A)
│       │       each feature folder contains:
│       │       ├── screens/                full screens that route files re-export
│       │       ├── components/             feature components
│       │       ├── queries.ts · mutations.ts · schemas.ts · hooks.ts
│       │       └── index.ts                the feature's public API: the only file other features import
│       │
│       ├── ui/                             design-system primitives (DESIGN_SYSTEM.md; one owner)
│       ├── constants/                      theme.ts (tokens) · site.ts · taxonomy.ts (enum values = database)
│       ├── hooks/                          use-theme · use-color-scheme · use-session
│       └── lib/                            supabase · database.types · analytics · images
│
└── supabase/                               THE BACKEND
    ├── config.toml
    ├── migrations/                         created with `npx supabase migration new <name>` (timestamped)
    ├── functions/                          Edge Functions (§7.2), one folder each
    ├── tests/                              pgTAP tests: security rules, search and Boost, plan limits
    └── seed.sql                            fake data for development
```

**Planned migrations, in order** (the CLI adds the timestamp prefix):

| Order | Migration | Tables | Phase |
|---|---|---|---|
| 1 | `waitlist` | waitlist | **Phase 0** (the only one) |
| 2 | `profiles_organizations` | enums, profiles, organizations, organization_members | 1 |
| 3 | `events_opportunities` | events, opportunities, opportunity_tiers, opportunity_bookmarks | 1 |
| 4 | `social` | posts, comments, reactions, follows, connections | 1 |
| 5 | `pitches_messages` | pitches, threads, thread_participants, messages, deals | 1 |
| 6 | `search` | search columns, ranking_weights, the 4 search functions | 1 |
| 7 | `billing` | subscriptions, boosts | 1 |
| 8 | `activity_safety` | notifications, profile_views, opportunity_views, saved_searches, reports, push_tokens | 1 |

**Storage buckets:**

| Bucket | Access |
|---|---|
| `avatars`, `logos`, `event-photos` | Public |
| `media-kits` | Private, signed links |
| `message-attachments` | Private, thread participants only |

Details are in [SHARED_CONTRACTS §5](SHARED_CONTRACTS.md#5-storage-buckets).

## 9. Step-by-step build plan

### Phase 0 website (October 2026): only what the freeze rule allows

**Progress (2026-09-24):**
- **W2 code is done.** Checked with typecheck, lint, the production build, 11 URL/redirect checks on a local Cloudflare server, and a browser check of headings, checked states, and inline errors.
- **W3 code is done.** Migration `supabase/migrations/20260924084441_waitlist.sql` + test `supabase/tests/waitlist_test.sql`. All 10 rule checks pass on real Postgres (PGlite), because Docker wasn't running, so `supabase test db` hasn't run yet.
- **Waiting on you:** W0 (Cloudflare domain), W1 (§11 answers), creating the Supabase project for W3 (`npx supabase link` + `npx supabase db push` + `client/.env.local`), and W4–W5.

| Step | Who | What | Done when |
|---|---|---|---|
| **W0. Domain on Cloudflare** | You | 1. Cloudflare → Add a domain → `mapleapp.tech` → Free plan. 2. At the registrar where you bought it, replace the nameservers with Cloudflare's two. 3. SSL/TLS **Full (strict)**, **Always Use HTTPS** on. 4. Email Routing: `hello@mapleapp.tech` → your Gmail. 5. Redirect rule: `www.mapleapp.tech/*` → `https://mapleapp.tech/$1`. | Cloudflare shows the domain **Active**, and an email to hello@ reaches Gmail |
| **W1. Approve the plan** | Both devs | Answer §11. Approve this doc, DESIGN_SYSTEM, OWNERSHIP, and SHARED_CONTRACTS. Accept or reject decisions D-019 – D-023. Fill in the owner names. | Every doc marked **Approved** in its header |
| **W2. Finish the Phase 0 pages** | B | Only Home, Privacy, 404: final copy, screen-reader fixes (checked states), DESIGN_SYSTEM tokens, `robots.txt`, `_redirects` (`/premium`, `/signup`). No product screens. | Typecheck, lint, and build pass. Pages match DESIGN_SYSTEM on desktop and phone, light and dark. |
| **W3. Waitlist storage** | B + you | **One** table, `waitlist`: a Supabase project with one migration (insert-only for the public) plus a pgTAP test, **or** Tally → Google Sheet (§11 Q14). No auth, profiles, or other tables. | A test signup is stored. A repeat email is handled. The public can't read the list. |
| **W4. Deploy** | B + you | You run `npx wrangler login` once. B runs `npm run deploy:web` and connects the custom domain. Push the repo to GitHub, and add an Action (checks on every PR, deploy on `main`) with a Cloudflare API token secret. | **https://mapleapp.tech** is live with a padlock. A push to `main` redeploys it. |
| **W5. Launch checks** | B | Link preview tested on LinkedIn Post Inspector and opengraph.xyz. Lighthouse (performance, accessibility, SEO) ≥ 90. Privacy notice re-read. Analytics choice applied (§11 Q6). | Sharing the link shows the preview card, and scores are ≥ 90 |
| **Gate** | Both | Go/No-Go meeting ([VALIDATION §8](../research/VALIDATION.md#8-synthesis-and-gono-go)) | **Go** → Phase 1. Iterate or Stop → no product code. |

### Phase 1 → launch (November 2026 → April 2027, only after "Go")

Owners work in parallel on their own features ([OWNERSHIP §6](OWNERSHIP.md#6-parallel-plan-by-stage) has the full split).

| Step | Build Plan stage | Dev A | Dev B | Done when |
|---|---|---|---|---|
| **W6. Foundations** | 2–3 | EAS dev builds, `lib/` (Supabase client, analytics, images), migrations for events, opportunities, social, pitches, messages | Restructure the draft into `features/` + `ui/`, primitives per DESIGN_SYSTEM, app shell and navigation, taxonomy constants, migrations for profiles, organizations, search, billing, CI | Both features build on the shared shell. Every migration has RLS + pgTAP tests. |
| **W7. Sign-in and first content** | 4–5 | Events, opportunities (+ bookmarks), posts, feed | Login, callback, onboarding, profiles, organizations, public pre-rendering | MVP Flow A works on web, iOS, and Android |
| **W8. Conversations** | 6 | Pitches, messages, notifications + push, `/saved` | Search (4 tabs), network, who viewed | Flows B and C work. A pitch triggers a push notification and an email. |
| **W9. Payments** | 7 | QA support, Boost display in the feed panel | Pricing (published once D-011 is accepted), Stripe, Boost purchase | Flow D works with a real card on the web |
| **W10. Hardening** | 5.5, 8 | Admin, reports, moderation | Settings, account deletion, legal pages, Explore | App-store rules met, security pass done |
| **W11. Beta, then launch** | 9–11 | RevenueCat, store listings, TestFlight and Play testing | Website launch: Home switches to sign-up | Live on web, App Store, and Google Play |

## 10. Quality bar for every page

| Area | Requirement |
|---|---|
| **Design** | Built only from DESIGN_SYSTEM tokens and `src/ui/` primitives. No hard-coded colors or sizes. |
| **Platforms** | Works on desktop and phone browsers and on iOS and Android, in light and dark mode |
| **Accessibility** | Every control has a label and role. Selected and checked states are announced (`aria-checked`). Logical focus order. Contrast ≥ 4.5:1. Touch targets ≥ 44 px. Works with large text. |
| **States** | Every data screen has loading, empty, and error states ([DESIGN_SYSTEM §8](../product/DESIGN_SYSTEM.md#8-states)) |
| **Speed** | Public pages pre-rendered. Lighthouse performance ≥ 90 on mobile. Images resized before upload. |
| **SEO** (public pages) | Unique title and description, canonical URL, link-preview image, listed in `sitemap.xml`. App pages excluded in `robots.txt`. |
| **Security** | Database rules (RLS) on every table and bucket. No secret keys in `client/`. Security headers on. Inputs checked in the app *and* the database. |
| **Contracts** | Names, enum values, function signatures, and component props match SHARED_CONTRACTS |
| **Analytics** | The page's events from MVP §4.14 fire (from stage 4) |

## 11. Open questions to decide before coding

Items marked **"in v2"** are already written into this plan as proposals; confirm or reject them.

| # | Question | Options | Recommendation |
|---|---|---|---|
| Q1 | Draft code in `client/` | Keep and freeze · Delete and rebuild | **Keep and freeze** (§0, D-021) *(in v2)* |
| Q2 | Pages live in Phase 0 | Home + Privacy + 404 · also "For organizers" / "For sponsors" | **Home + Privacy + 404** |
| Q3 | Publish prices before they're validated | Yes · No, from stage 7 once D-011 is accepted | **No** *(in v2)* |
| Q4 | Landing copy and waitlist fields (§4.1) | Approve · Edit | Your call |
| Q5 | Brand color maple red `#C8331B` | Approve · Other | **Approve** (passes contrast checks) |
| Q6 | Visitor analytics in Phase 0 | Cloudflare Web Analytics (free, no cookies) · None | **Cloudflare Web Analytics** |
| Q7 | Public plans URL | `/pricing` (+ `/premium` redirect) · `/premium` | **`/pricing`** (D-019) *(in v2)* |
| Q8 | Sign-in routes | `/login` only (+ `/signup` redirect) · separate `/signup` | **`/login` only** (D-020) *(in v2)* |
| Q9 | Who owns the shared UI (`src/ui/`, theme, app shell)? | Dev A · Dev B | **Dev B** (already owns the landing page) |
| Q10 | Feature ownership split | As in OWNERSHIP §3 · Change | Review OWNERSHIP §3 and fill in the names |
| Q11 | Saved opportunities | Add `opportunity_bookmarks` · Drop `/saved` from the MVP | **Add the table** *(in v2)* |
| Q12 | Message attachments storage | Separate `message-attachments` bucket · Reuse `media-kits` | **Separate bucket** *(in v2)* |
| Q13 | Code layout | Feature folders (D-022) · Folders by component type | **Feature folders** *(in v2)* |
| Q14 | Phase 0 waitlist storage | One Supabase table (the draft form) · Tally → Google Sheet | **One Supabase table**, since the form exists, but nothing more (§0) |
| Q15 | Styling | React Native `StyleSheet` + tokens (D-023) · NativeWind | **StyleSheet + tokens**: the draft already uses it, with no extra dependency *(in v2)* |
| Q16 | Handles | Permanent in MVP · Changeable, with redirect history | **Permanent in MVP** *(in v2)* |
| Q17 | AI assistant rules for Codex | Add a root `AGENTS.md` that points to the same rules as `CLAUDE.md` · Only `CLAUDE.md` | **Add `AGENTS.md`** if either of you uses Codex |
