# Maple: Build Plan (0 → 100%)

> Every step from an empty folder to Maple live on the **web**, the **App Store**, and **Google Play**.

| | |
|---|---|
| Last updated | 2026-09-24 |
| Timeline | Oct 2026 → public launch Apr 2027 |
| What we use and why | [TECH_STACK.md](TECH_STACK.md) |
| What we build | [MVP.md](../product/MVP.md) |
| Team assumption | 2 full-time developers. With one, the build stages (2–8) take roughly twice as long. |

---

## Overview

| Progress | Stage | When | Done when |
|---|---|---|---|
| 0 → 5% | [0. Accounts, company, and domain](#stage-0-accounts-company-and-domain) | Oct, weeks 1–2 | Domain on Cloudflare, accounts created, store enrollment started |
| 5 → 10% | [1. Validation](#stage-1-validation) | Oct | Go decision in [VALIDATION.md](../research/VALIDATION.md) |
| 10 → 15% | [2. Dev environment and repo](#stage-2-dev-environment-and-repo) | Nov, week 1 | "Hello Maple" runs on web, Android, and your iPhone |
| 15 → 25% | [3. Backend foundation](#stage-3-backend-foundation) | Nov, weeks 1–2 | Schema, security, and sign-in work, and tests pass in CI |
| 25 → 30% | [4. App shell](#stage-4-app-shell-all-3-platforms) | Nov, week 2 | Sign up + onboarding on all 3 platforms, web auto-deploys |
| 30 → 45% | [5. Organizations, posts, Find](#stage-5-organizations-posts-find) | Nov, week 3 – Dec, week 1 | MVP Flow A works |
| 45 → 60% | [6. Proposals, messaging, notifications](#stage-6-proposals-messaging-notifications) | Dec, week 2 – Jan, week 1 | MVP Flows B + C work, push arrives on phones |
| 60 → 70% | [7. Payments, Premium, Boost](#stage-7-payments-premium-boost-web) | Jan, weeks 1–2 | Flow D works with a real card |
| 70 → 80% | [8. Hardening](#stage-8-hardening) | Jan, weeks 3–4 | Store rules, security, analytics, and legal pages done |
| 80 → 88% | [9. Private beta](#stage-9-private-beta) | Feb – Mar 2027 | Beta running on web, TestFlight, and Play closed testing |
| 88 → 95% | [10. Store readiness](#stage-10-store-readiness) | Mar 2027 | In-app purchases work, both stores approve |
| 95 → 100% | [11. Public launch](#stage-11-public-launch) | Apr 2027 | Live on web, App Store, and Google Play |
| 100%+ | [12. Operate and grow](#stage-12-operate-and-grow) | Apr 2027 → | Steady release rhythm, upgrades as triggers hit |

---

## Stage 0: Accounts, company, and domain

**0 → 5% · October, weeks 1–2.** Start early: store enrollment can take weeks.

- [ ] **0.1 Student Pack.** Get verified at https://education.github.com/pack. Your GitHub account becomes GitHub Pro.
- [ ] **0.2 Name check first.** Do the trademark check in [VALIDATION.md §0](../research/VALIDATION.md#0-setup-checklist-before-day-1) before claiming a domain.
- [ ] **0.3 Claim the free domain.** Pick one:

  | Registrar (via Pack) | Free for 1 year | Note |
  |---|---|---|
  | **Name.com** | One of `.app`, `.dev`, `.live`, `.studio`, `.software` | **Recommended:** `.app` suits the product. Card required, so turn off auto-renew or budget the renewal. |
  | Namecheap | `.me` | Cheap renewal (~$5/yr) |
  | get.tech | `.tech` | Renewal is pricey |

- [ ] **0.4 Put the domain on Cloudflare:**
  1. Cloudflare → *Add a domain* → Free plan
  2. Copy the 2 nameservers into your registrar's DNS settings
  3. SSL/TLS mode **Full (strict)**, and turn on **Always Use HTTPS**
- [ ] **0.5 Email addresses.** Cloudflare → *Email Routing*: forward `hello@`, `support@`, and `legal@` to a founder's Gmail. Free.
- [ ] **0.6 Create accounts** (free, with 2-factor auth on each):
  - GitHub organization + private repo `maple`
  - Supabase
  - Expo
  - Resend
  - Stripe
  - PostHog
  - Sentry
  - Firebase and RevenueCat can wait until stages 6 and 10
- [ ] **0.7 Company and store enrollment.** This is slow, so start now:
  1. Form the legal entity (open decision in [DECISIONS.md](../product/DECISIONS.md#open-decisions-to-make-before-or-during-phase-0))
  2. Get a free **D-U-N-S number** (Apple has a lookup and request tool). It can take days to weeks.
  3. **Apple Developer Program as an organization** ($99/yr). The App Store then shows the company as the seller, not your personal name.
  4. **Google Play Console as an organization** ($25 once). Organization accounts **skip the "12 testers for 14 days" rule** that new personal accounts must pass before publishing.
  5. If the company isn't ready by January, enroll as individuals and start Google's 12-tester closed test on day 1 of beta (Stage 9).
- [ ] **0.8 Password vault.** Put every login in one shared vault (1Password is in the Student Pack).

**Done when:** `https://mapleapp.tech` resolves through Cloudflare, `hello@` forwards to Gmail, and Apple and Google enrollment is submitted.

---

## Stage 1: Validation

**5 → 10% · October.** Follow [VALIDATION.md](../research/VALIDATION.md). No product code. The only tech tasks are the Phase 0 website in [WEBSITE_PLAN.md §9](WEBSITE_PLAN.md#9-step-by-step-build-plan) (W0–W5), under its freeze rule (D-021):

- [ ] Landing page, Privacy, and 404 from the existing draft in `client/`, deployed on Cloudflare
- [ ] Waitlist: one Supabase `waitlist` table (or Tally → Google Sheet). No other tables, no accounts.
- [ ] Verify the domain in Resend. Add its DNS records (SPF, DKIM) plus a DMARC record in Cloudflare, so confirmation emails don't land in spam.

**Done when:** the go/no-go meeting says **Go**. If it says Iterate or Stop, don't start Stage 2.

---

## Stage 2: Dev environment and repo

**10 → 15% · November, week 1**

- [ ] **2.1 Install on Windows:**
  - Node.js LTS, Git, VS Code
  - **Docker Desktop** with the WSL 2 backend (runs Supabase locally)
  - **Android Studio** (Android emulator)
  - Stripe CLI
- [ ] **2.2 Your phone:** use **Expo Go** for the first days. You'll switch to a **development build** in 2.8, once native modules like Google Sign-In are added. iOS simulators need a Mac, so on Windows you test iOS on a real iPhone.
- [ ] **2.3 Repo:** `git init` → push to the private GitHub repo → protect `main` (changes go through a pull request, and CI must pass).
- [ ] **2.4 Create the app:**
  ```bash
  npx create-expo-app@latest client
  ```
  In `client/app.json`, set:
  - `web.output: "static"` (pre-rendered web pages)
  - `ios.supportsTablet: false` (skips iPad screenshots and iPad review)
  - `ios.bundleIdentifier` / `android.package` = `tech.mapleapp.app` (already set in the draft)
  - `scheme: "maple"`
- [ ] **2.5 Add libraries:** TanStack Query, `@supabase/supabase-js`, react-hook-form, zod. Styling uses `StyleSheet` + the tokens in [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) (D-023). Restructure the draft into `src/features/` + `src/ui/` ([WEBSITE_PLAN §8](WEBSITE_PLAN.md#8-folder-structure), D-022).
- [ ] **2.6 Local backend:**
  ```bash
  npx supabase init      # at the repo root → creates supabase/
  npx supabase start     # local Postgres, Auth, Storage, Studio (needs Docker)
  ```
- [ ] **2.7 Cloud projects:** create `maple-dev` and `maple-prod` in Supabase (the free plan allows two).
- [ ] **2.8 EAS:**
  ```bash
  npm install -g eas-cli
  eas login
  cd client && eas init && eas build:configure
  eas device:create                                          # register your iPhone
  eas build --profile development --platform all             # dev builds for iPhone + Android
  ```
- [ ] **2.9 CI (GitHub Actions)**, on every pull request:
  ```bash
  npx tsc --noEmit && npx expo lint && npm test && npx supabase test db
  ```
- [ ] **2.10 Spike (1 day): prove web hosting.** Deploy `npx expo export --platform web` to Cloudflare. Confirm three things:
  1. A pre-rendered public page shows its content and Open Graph tags in "view source"
  2. Dynamic URLs that weren't pre-rendered (e.g. `/org/any-handle`) load their page template through the per-folder `404.html` fallback (`client/scripts/finalize-web-export.mjs`; already verified locally with Wrangler)
  3. The custom domain works

  If any of these fails, pick the fallback in [TECH_STACK.md §4.2](TECH_STACK.md#42-website-delivery-expo-web-export--cloudflare) **now**, not later.

**Done when:** "Hello Maple" runs on the Cloudflare URL, the Android emulator, and your iPhone.

---

## Stage 3: Backend foundation

**15 → 25% · November, weeks 1–2**

- [ ] **3.1 Schema:** `npx supabase migration new core_tables`. Create the tables from [MVP.md §10](../product/MVP.md#10-data-model-core-tables), with enums named after the glossary (`organizer`/`sponsor`, `package`/`call`, `offering`/`seeking`/`update`/`recap`).
- [ ] **3.2 Security (RLS):** add policies to **every** table, with pgTAP tests in `supabase/tests/`. For example:
  - "User A can't edit user B's profile"
  - "Only participants can read a thread"
  - "Nobody can read another user's billing"
- [ ] **3.3 Search:** add a `tsvector` column, a GIN index, and `pg_trgm`. Write `search_posts()` (plus `search_organizations()`, signatures in [SHARED_CONTRACTS §3](SHARED_CONTRACTS.md#3-database-functions-rpc)) with the score from [MVP.md §7.1](../product/MVP.md#71-organic-score) and the Boost slots from [§7.2](../product/MVP.md#72-boost-paid-search-priority), and seed the `ranking_weights` table. Test the Boost rules: max 2 per 10 results, relevance ≥ 0.3, flagged as boosted.
- [ ] **3.4 Plan limits:** write SQL functions and triggers for active posts, proposals per month, and follows per week.
- [ ] **3.5 Storage buckets:**
  - `org-media`: public read (logos, banners)
  - `post-media`: public read (post images)
  - `message-attachments`: private, readable only by the thread's participants ([SHARED_CONTRACTS §5](SHARED_CONTRACTS.md#5-storage-buckets))
- [ ] **3.6 Auth settings:**
  - Email **6-digit code** (OTP)
  - Google, Apple, and LinkedIn (OIDC) providers
  - **Custom SMTP = Resend**
  - Redirect URLs for the website and the `maple://` scheme
- [ ] **3.7 Seed data:** `supabase/seed.sql` with categories, regions, and 20 fake posts for development.
- [ ] **3.8 Types:** generate them, and re-run after every migration:
  ```bash
  npx supabase gen types typescript --local > client/types/database.ts
  ```
- [ ] **3.9 Deploy to dev:**
  ```bash
  npx supabase link --project-ref <maple-dev-ref> && npx supabase db push
  ```

**Done when:** the pgTAP tests pass in CI, and you can sign in with an email code against `maple-dev`.

---

## Stage 4: App shell (all 3 platforms)

**25 → 30% · November, week 2**

- [ ] **4.1 Navigation:** route groups `(public)`, `(auth)`, and `(app)`. Bottom tabs on phones (Feed, Search, Pitches, Messages, Me) and a sidebar layout on desktop web.
- [ ] **4.2 Design basics:**
  - Color, type, and spacing tokens in the Tailwind config
  - Core components: Button, Input, Card, Avatar, Badge, Modal, EmptyState
  - Light and dark mode through the theme tokens ([DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md))
- [ ] **4.3 Sign-in screens:**
  - Email → code
  - Google
  - Apple (iOS + web)
  - LinkedIn
  - The session stays saved on every platform
- [ ] **4.4 Onboarding:** role pick → create the organization page ([MVP.md §4.1](../product/MVP.md#41-auth-and-onboarding)).
- [ ] **4.5 Website auto-deploy:** a GitHub Action runs on every merge to `main`:
  ```bash
  npx expo export --platform web && npx wrangler deploy
  ```
  Then attach the custom domain in Cloudflare.
- [ ] **4.6 Monitoring from day one:** add the Sentry and PostHog SDKs on all platforms.

**Done when:** a new user can sign up and finish onboarding on the website, Android, and iPhone.

---

## Stage 5: Organizations, posts, Find

**30 → 45% · November, week 3 – December, week 1** (MVP sprints S1–S2)

- [ ] **5.1** Organization pages (organizer + sponsor roles) and work-email domain verification (Verified company badge)
- [ ] **5.2** Posts: event posts (plan, dates, place inside) and sponsor posts, with tiers and images (pick → resize → upload)
- [ ] **5.3** Find: browse + filters + Following/Saved tabs, backed by `search_posts()`
- [ ] **5.4 Public SEO pages:**
  - Pre-render `/org/[handle]` and `/posts/[id]` with Open Graph tags
  - Add a **nightly** GitHub Action that rebuilds and redeploys the website
- [ ] **5.5 Deep links:**
  - Serve `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` from the domain
  - Set `associatedDomains` (iOS) and `intentFilters` (Android) in `app.json`
  - Tapping a Maple link on a phone then opens the app

**Done when:** [MVP Flow A](../product/MVP.md#6-key-user-flows) (an organizer posts their event) works on all 3 platforms.

---

## Stage 6: Proposals, messaging, notifications

**45 → 60% · December, week 2 – January, week 1** (MVP sprints S3–S4)

- [ ] **6.1** Find filters + saved searches; organization search via `search_organizations()`
- [ ] **6.2** Follow organizations + Following tab
- [ ] **6.3** Proposals inbox with statuses, "mark Won", "mark Completed", and post-event reviews
- [ ] **6.4** Messaging with Supabase Realtime: attachments, unread counts, block and report
- [ ] **6.5 Notifications:**
  - In-app list
  - **Push:** `expo-notifications` saves tokens to `push_tokens`. Create a Firebase project and upload its FCM key to EAS for Android; EAS handles the iOS key. A database webhook calls the `notify` Edge Function.
  - Email through Resend
  - Digests through `pg_cron` → the `digest` function
- [ ] **6.6** "Who viewed your post / page"

**Done when:** Flows B and C work on all 3 platforms, and a new proposal triggers a push on the phone plus an email.

---

## Stage 7: Payments, Premium, Boost (web)

**60 → 70% · January, weeks 1–2** (MVP sprint S5)

- [ ] **7.1 Stripe products** (test mode):
  - Premium Organizer and Premium Sponsor, monthly and annual
  - Boost products as one-time payments
- [ ] **7.2 Edge Functions:** `stripe-checkout`, `stripe-portal`, and `stripe-webhook`. To test webhooks locally:
  ```bash
  stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
  ```
- [ ] **7.3** The `subscriptions` and `boosts` tables drive everything. Plan limits read the user's plan from there.
- [ ] **7.4 Paywall and `/pricing` page (D-019; published only once D-011 prices are accepted):**
  - **Website:** buy with Stripe
  - **iOS/Android during beta:** show Premium status and features, but no purchase buttons. People buy on the web until Stage 10 adds in-app purchases.
- [ ] **7.5** Boost purchase, monthly Boost credits, and the "Boosted" label in results
- [ ] **7.6** Switch Stripe to **live mode**. This needs the company's bank account and business details.

**Done when:** Flow D works on the website with a real card, and Premium unlocks on all 3 platforms.

---

## Stage 8: Hardening

**70 → 80% · January, weeks 3–4** (MVP sprint S6)

- [ ] **8.1 Admin:** moderation queue, organization verification, and featuring, behind an admin role in RLS.
- [ ] **8.2 Rules Apple and Google require:**
  - [ ] **In-app account deletion** (`delete-account` function)
  - [ ] **Report and block** for user content (already built in Stage 6)
  - [ ] Terms acceptance at signup
  - [ ] A support contact link inside the app
  - [ ] **Legal pages** on the website: `/legal/privacy`, `/legal/terms`, `/legal/community`
- [ ] **8.3 Security pass:**
  - [ ] Every table has RLS policies and tests
  - [ ] **No service-role key in `client/`**
  - [ ] Rate limits verified
  - [ ] Stripe webhook signature checked
  - [ ] Secrets only in the EAS, Supabase, GitHub, and Cloudflare secret stores
- [ ] **8.4 Analytics:**
  - [ ] Every event in [MVP.md §4.14](../product/MVP.md#414-product-analytics) fires
  - [ ] PostHog funnels for Flows A–D
  - [ ] A north-star dashboard (matched conversations per week)
- [ ] **8.5 Performance and accessibility:**
  - [ ] Feed and search respond in under 300 ms (p95) at production data sizes
  - [ ] Screen-reader labels
  - [ ] Text scaling
  - [ ] Color contrast
- [ ] **8.6 App assets:** icon, splash screen, final app name.
- [ ] **8.7 Production:**
  - [ ] Upgrade `maple-prod` to **Supabase Pro** ($25/mo) for daily backups and no pausing
  - [ ] Deploy migrations and functions
  - [ ] Set the production environment variables in EAS and Cloudflare
- [ ] **8.8 Seed content:** 100 real posts, published with the organizations' permission.

**Done when:** the [MVP definition of done](../product/MVP.md#12-build-timeline-12-weeks-2-week-sprints) is met.

---

## Stage 9: Private beta

**80 → 88% · February – March 2027**

- [ ] **9.1 Website:** turn off open signups in Supabase and **invite beta users by email** (a built-in Supabase feature).
- [ ] **9.2 iOS → TestFlight:**
  ```bash
  eas build -p ios --profile production && eas submit -p ios
  ```
  Internal testers (up to 100 team members) need no review. External testers (up to 10,000) need a short beta review first, after which you can share a public TestFlight link.
- [ ] **9.3 Android → Play closed testing:**
  ```bash
  eas build -p android --profile production && eas submit -p android
  ```
  Invite testers through an email list or Google Group. **With a personal account:** keep at least 12 testers opted in for 14 days in a row, and make sure they actually use the app, or production access won't unlock.
- [ ] **9.4 Release rhythm:**
  - Website: deploys on every merge
  - JavaScript fixes: `eas update --channel preview` (minutes, no review)
  - Native changes: a new build
- [ ] **9.5 Feedback:** a "Send feedback" link in the app, 5 user calls a week, and daily checks of Sentry and PostHog.
- [ ] **9.6 Metrics:** track [MVP §14](../product/MVP.md#14-success-metrics-first-90-days-after-beta) weekly.

**Done when:** beta metrics are trending toward their targets, and no critical bug has been open for 2 weeks.

---

## Stage 10: Store readiness

**88 → 95% · March 2027**

- [ ] **10.1 In-app purchases (D-017):**
  1. Create the same plans as Stripe as subscriptions in App Store Connect and Play Console, plus Boosts as one-time products
  2. Add RevenueCat (`react-native-purchases`) and connect both stores
  3. The `revenuecat-webhook` function writes to `subscriptions`
  4. Test with sandbox accounts
- [ ] **10.2 App Store listing:**
  - [ ] Name, subtitle, description, keywords
  - [ ] **iPhone 6.9-inch screenshots** (no iPad set needed, because `supportsTablet` is false)
  - [ ] Privacy policy URL and support URL
  - [ ] **App Privacy** questionnaire
  - [ ] Age rating
  - [ ] Review notes, including a **demo login for the reviewer**
- [ ] **10.3 Google Play listing:**
  - [ ] Descriptions
  - [ ] Feature graphic (1024×500) and phone screenshots
  - [ ] **Data safety** form
  - [ ] Content rating questionnaire
  - [ ] Target audience: adults
  - [ ] **Account deletion URL**
  - [ ] Demo login
- [ ] **10.4 Submit** the production builds for review. Answer rejections fast; common ones are a missing demo account, moderation for user content, and in-app purchase wording.
- [ ] **10.5 Google production access:** organization accounts get it right away. Personal accounts get it after the 12-tester requirement is met and Google approves.

**Done when:** both stores have approved Maple.

---

## Stage 11: Public launch

**95 → 100% · April 2027**

- [ ] **11.1** Turn open signups back on. Release in both stores (optionally a phased release on iOS), and open the website.
- [ ] **11.2** Launch through the channels in [MARKET.md §9](../business/MARKET.md#9-go-to-market): Product Hunt, Show HN, and dev-rel communities.
- [ ] **11.3** Watch:
  - Crash-free sessions ≥ 99.5% (Sentry)
  - The signup funnel (PostHog)
  - Daily email sends (Resend's 100/day limit)
  - Supabase usage
- [ ] **11.4** Upgrade services as their triggers hit ([TECH_STACK.md §8](TECH_STACK.md#8-when-to-upgrade)).

**Done when:** Maple is live on the web, App Store, and Google Play. **100%.**

---

## Stage 12: Operate and grow

**100%+ · April 2027 onward**

- **Release rhythm:**
  - Website: continuous
  - JavaScript updates: weekly through EAS Update
  - Native builds: every 2–4 weeks
- **Monthly:**
  - Update dependencies
  - Stay no more than one Expo SDK version behind (Expo releases a few SDKs a year)
- **Quarterly:**
  - Test restoring from a backup
  - Audit RLS
  - Review costs against [TECH_STACK.md §7](TECH_STACK.md#7-what-it-costs-stage-by-stage)
- **Next features:** Phase 3 in [PLAN.md](../business/PLAN.md#phase-3-growth-may--dec-2027): Scout, Sponsor Suite, verified audiences, AI Fit Score, and more.
