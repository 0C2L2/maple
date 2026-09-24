# Maple: Tech Stack

> What we use to build the Maple website, iOS app, and Android app, why we chose each tool, how we use it, and what's free.

| | |
|---|---|
| Last updated | 2026-09-24 |
| Decisions | D-008, D-015 – D-018 in [DECISIONS.md](../product/DECISIONS.md) |
| Step-by-step plan | [BUILD_PLAN.md](BUILD_PLAN.md) |
| Scope | [MVP.md](../product/MVP.md) |

> **Free-tier numbers are as of September 2026**, from vendor pages and pricing guides (see [Sources](#11-sources)). Vendors change them, so re-check before relying on one.

---

## 1. The short version

**One codebase, three platforms.** The Maple website, iPhone app, and Android app are the same Expo (React Native) project. Each screen is written once.

| Layer | Tool | Cost to start |
|---|---|---|
| Website + iOS app + Android app | **Expo** (React Native + Expo Router), TypeScript | Free |
| Web hosting, DNS, CDN, email forwarding | **Cloudflare** (you already have it) | Free |
| Domain | **GitHub Student Developer Pack** | Free for year 1 |
| Database, login, file storage, live chat, server code | **Supabase** | Free (Pro $25/mo from beta) |
| App builds, store uploads, instant updates | **Expo Application Services (EAS)** | Free |
| Payments on the website | **Stripe** | No monthly fee, % per sale |
| Payments inside the iOS/Android apps | **RevenueCat** (on top of Apple and Google billing) | Free up to $2.5K/mo revenue |
| Email (login codes, notifications) | **Resend** | Free up to 100/day |
| Push notifications | **Expo Push** (delivers via Apple APNs and Google FCM) | Free |
| Product analytics | **PostHog** | Free up to 1M events/mo |
| Crash and error tracking | **Sentry** | Free up to 5K errors/mo |
| Code and CI | **GitHub** (Pro through the Student Pack) | Free |
| Store accounts | **Apple Developer Program**, **Google Play Console** | $99/year, $25 once |

## 2. Architecture

```
   Website           iPhone app          Android app     ← one Expo codebase (client/)
      │                   │                   │
 Cloudflare           App Store          Google Play     ← where each one is served from
      │                   │                   │
      └───────────────────┼───────────────────┘
                          ▼
  Supabase (the backend for all three)
  ├─ Postgres: all data · Row Level Security · search · plan limits
  ├─ Auth: email code · Google · Apple · LinkedIn
  ├─ Realtime: live chat · Storage: photos, PDFs · Cron: email digests
  └─ Edge Functions ─► Stripe · RevenueCat · Resend · Expo Push

  On every platform: PostHog (analytics) · Sentry (errors)
```

There is no server of our own to run. The apps talk straight to Supabase, and security is enforced inside the database by Row Level Security. Code that needs secret keys (payments, email, push) runs in Supabase Edge Functions.

## 3. Why this stack

1. **One codebase for web, iOS, and Android.** With 1–2 developers, separate web and mobile codebases would double the UI work for every feature. Upwork-style marketplaces (listings, proposals, messages on every platform) ship the same way from one Expo codebase.
2. **Works from Windows.** EAS builds the iOS app in the cloud, so you don't need a Mac to build or submit it.
3. **$0 until real users arrive.** Everything has a free tier that covers development and most of beta.
4. **Few moving parts.** No servers, no queues, no caches. Business rules sit in Postgres, next to the data.
5. **Low lock-in.** Supabase is plain Postgres. Expo is open-source React Native. The website is static files.

## 4. Each layer: what, why, how

### 4.1 The app: Expo + React Native + Expo Router
- **What:** Expo is a toolkit for building React Native apps. Expo Router maps files to screens, and the same files work as website pages.
- **Why:** You write each screen once. The same URL (`/posts/123`) is a web page and an app screen, and shared links open in the app.
- **How:**
  - Route files live in `client/src/app/` and re-export screens from `client/src/features/<feature>/` (D-022, [WEBSITE_PLAN §8](WEBSITE_PLAN.md#8-folder-structure)).
  - **Styling:** React Native `StyleSheet` with the tokens in [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) (D-023). No styling library.
  - **Data:** `supabase-js` + TanStack Query for caching, retries, and pagination. No separate state library.
  - **Forms:** react-hook-form + zod. The same zod schemas validate input in the app and in Edge Functions.
  - **Platform differences:** only where needed, using `file.web.tsx` / `file.native.tsx`.
  - **Libraries:**
    - `expo-image`
    - `expo-image-picker` + `expo-image-manipulator` (resize photos to ≤1600px before upload)
    - `expo-notifications`
    - `expo-apple-authentication` and `@react-native-google-signin/google-signin`
    - `expo-web-browser` (LinkedIn login)
  - **Layouts:** a top bar + content on wide desktop screens, and bottom tabs (Find · My posts · Proposals · Messages · Notifications) on phones.

### 4.2 Website delivery: Expo web export → Cloudflare
- **What:** `npx expo export --platform web` builds static files, and Cloudflare serves them from its global CDN.
- **Why:** Static hosting on Cloudflare is free with unlimited requests. There is no server to run or pay for.
- **How:**
  - **Public pages** that should appear in Google are **pre-rendered to HTML** at build time with Expo Router static rendering. That covers the landing page, Find, and post and organization pages. They include Open Graph tags, so shared links show a preview on LinkedIn, X, and WhatsApp.
  - **Logged-in pages** (my posts, proposals, messages) render in the browser. URLs that weren't pre-rendered (e.g. a new post) are served their route's template through a per-folder `404.html` fallback, written after each build by `client/scripts/finalize-web-export.mjs`.
  - A GitHub Action rebuilds and redeploys the site **on every merge to `main` and once a night**, so new public pages reach search engines within a day.
  - Cloudflare also serves `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`, so Maple links open in the app on phones.
  - **Fallback:** if nightly pre-rendering isn't fresh enough for SEO, switch public pages to Expo Router **server rendering** on EAS Hosting (free tier: 100K requests/month) or Cloudflare Workers. [BUILD_PLAN.md](BUILD_PLAN.md) has a 1-day spike in week 1 to confirm this.

### 4.3 Mobile delivery: EAS Build, Submit, Update
- **What:** Expo's cloud services for building, uploading, and updating the apps.
- **Why:** You get iOS builds without a Mac, one-command store uploads, and bug fixes that reach users without waiting for store review.
- **How:**

  | Command | What it does |
  |---|---|
  | `eas build` | Compiles the iOS and Android apps in the cloud. Free: 15 iOS + 15 Android builds a month. |
  | `eas submit` | Uploads builds to App Store Connect (TestFlight) and Google Play. |
  | `eas update` | Pushes **JavaScript-only** fixes to installed apps in minutes, with no store review. Free for 1,000 monthly active users. Native changes (a new native library, new permissions) still need a new build. |

  - Build profiles in `eas.json`: `development` (for your phone while coding), `preview` (testers), and `production` (stores).
  - EAS manages Apple certificates and the push key for you. Android push needs a free Firebase project for FCM.

### 4.4 Backend: Supabase
- **What:** Hosted Postgres with built-in auth, file storage, realtime, server functions, and scheduled jobs.
- **Why:** It replaces a custom backend. Rules live in the database, so web, iOS, and Android all get the same rules.
- **How:**

| Part | Used for | How |
|---|---|---|
| **Postgres** | All data ([MVP.md §10](../product/MVP.md#10-data-model-core-tables)) | Schema changes are SQL files in `supabase/migrations/`, applied with `supabase db push`. Never edit the production schema by hand. |
| **Row Level Security** | The security boundary | Every table has policies. Users write only their own rows, and messages, views, and billing are private. Tested with pgTAP (`supabase test db --local`). |
| **SQL functions (RPC)** | Search (`search_posts` with Boost slots, `search_organizations`), proposals (`send_proposal`, `complete_proposal`, `leave_review`), view recording, plan limits, matched-conversation detection | One implementation of each rule, used by all three platforms. Signatures in [SHARED_CONTRACTS §3](SHARED_CONTRACTS.md#3-database-functions-rpc). |
| **Full-text search** | Search | A `tsvector` column + GIN index + `pg_trgm` (D-008) |
| **Auth** | Sign-in | Email **6-digit code** (works on every platform without magic-link deep links), Google, Apple, LinkedIn (OIDC). On iOS, Apple requires a privacy-focused login option like Sign in with Apple when Google or LinkedIn login is offered. |
| **Realtime** | Live messages, unread counts | Subscribe to new rows in `messages` for the open thread |
| **Storage** | Logos, banners, post images, message attachments | Buckets protected by RLS: `org-media`, `post-media` (public), `message-attachments` (thread participants only). See [SHARED_CONTRACTS §5](SHARED_CONTRACTS.md#5-storage-buckets). The app resizes images before upload to stay inside the free 1 GB. |
| **Edge Functions** | Code that needs secret keys | See the table below |
| **Cron** (`pg_cron`) | Email digests, saved-search alerts | Scheduled SQL that calls the `digest` function |

**Edge Functions** (TypeScript on Deno, in `supabase/functions/`)

| Function | Triggered by | Does |
|---|---|---|
| `stripe-checkout` | The app | Creates a Stripe Checkout session for a plan or a Boost |
| `stripe-portal` | The app | Returns a Stripe Customer Portal link |
| `stripe-webhook` | Stripe | Verifies the signature, then updates `subscriptions` / `boosts` |
| `revenuecat-webhook` | RevenueCat | Records App Store / Google Play purchases (Build Plan Stage 10) |
| `notify` | Database webhook on a new proposal, message, follow, or review | Sends push (Expo) and email (Resend) |
| `digest` | Cron (daily / weekly) | Email digests and saved-search alerts |
| `delete-account` | The app | Deletes the user and their data (required by Apple and Google) |

Boosts expire because the search query filters by date, so no expiry job is needed.

**Environments:** there are two Supabase projects:
- `maple-dev` stays on the free plan, where pausing is fine.
- `maple-prod` moves to Pro from beta, for daily backups and no pausing.

Local development runs the whole stack in Docker with `supabase start`.

### 4.5 Payments: Stripe (web) + RevenueCat (apps)
- **Web:** Stripe Checkout (a hosted payment page) sells subscriptions and Boosts. Stripe Customer Portal handles upgrades, cancellations, and invoices, so we build no billing UI.
- **Apps:** in most countries, Apple and Google require their own billing for digital subscriptions sold inside apps. RevenueCat wraps both stores in one SDK (`react-native-purchases`) and sends a webhook on every purchase.
- **One source of truth:** both webhooks write to the `subscriptions` table with `source` = `stripe` | `app_store` | `play_store`. The app only reads that table, so Premium works everywhere, wherever it was bought.
- **Order (D-017):**
  1. During beta, payments happen on the web only. Testers use TestFlight and Play closed testing.
  2. In-app purchases are added before the public store launch.
- **Fees:**
  - Stripe: 2.9% + 30¢ per US card payment, plus 0.7% Stripe Billing on subscriptions
  - Apple and Google: 15% (Apple Small Business Program / Google's subscription rate)
  - RevenueCat: 1% above $2.5K monthly revenue
- **US note:** Apple currently lets US apps link to web checkout with 0% commission, but a court may set a fee. Google charges about 10% on externally linked subscriptions from October 2026. We start with in-app purchases everywhere and revisit link-out once the revenue is worth optimizing.

### 4.6 Email: Resend + Cloudflare Email Routing
- **Sending** (login codes, notifications, digests) goes through Resend. Supabase's built-in email is for testing only and is heavily rate-limited, so Resend is plugged into Supabase Auth as custom SMTP. Edge Functions call Resend's API for everything else.
- **Receiving:** Cloudflare Email Routing forwards `hello@`, `support@`, and `legal@` to your Gmail. To reply as `hello@mapleapp.tech`, add Resend's SMTP to Gmail's "Send mail as" setting.
- **DNS:** add Resend's SPF and DKIM records plus a DMARC record in Cloudflare, so emails don't land in spam.
- **Watch the limit:** the free plan allows 100 emails a day. Keep digests weekly during beta, and move to Resend Pro when daily sends pass about 80.

### 4.7 Push notifications
- `expo-notifications` asks for permission and gets a push token, which is saved in a `push_tokens` table.
- The `notify` Edge Function sends through the Expo Push API (free), which delivers through APNs (iOS) and FCM (Android).
- **Web:** no push in the MVP. In-app notifications and email cover it.

### 4.8 Analytics and monitoring
- **PostHog:** the product events in [MVP.md §4.14](../product/MVP.md#414-product-analytics) from all three platforms, plus funnels for the four MVP flows and the north-star dashboard.
- **Sentry:** crashes and errors on web, iOS, Android, and Edge Functions. Source maps upload during EAS builds, so stack traces are readable.
- **Supabase and Cloudflare dashboards:** slow queries, database size, and traffic.

### 4.9 Domain, DNS, and security (Cloudflare)
- **Domain:** claim one free domain through the GitHub Student Pack (options in §6), then point its nameservers to Cloudflare.
- **SSL:** Cloudflare "Full (strict)" plus "Always Use HTTPS".
- **Turnstile** (free CAPTCHA): ready to switch on for web signups if bots show up. Supabase Auth supports it natively.
- **Secrets:** each platform's own secret store (EAS, Supabase, GitHub, Cloudflare). The Supabase **service-role key never goes in `client/`**; it lives only in Edge Functions.

### 4.10 Code, CI/CD, and testing
- **GitHub:** a private repo. GitHub Pro (included in the Student Pack) gives 3,000 Actions minutes a month.
- **On every pull request:** typecheck, lint, unit tests, and `supabase test db` (pgTAP).
- **On merge to `main`:**
  - Deploy the website to Cloudflare
  - Deploy migrations and Edge Functions to production, with manual approval
  - `eas update` to the preview channel
- **Store releases:** `eas build --profile production` + `eas submit`, started manually.
- **Tests:**

  | Tool | What it tests |
  |---|---|
  | Jest + React Native Testing Library | Logic and key components |
  | pgTAP | RLS, search and Boost rules, and plan limits: the security- and money-critical parts |
  | Maestro (optional, free CLI) | The four MVP flows end to end on the Android emulator |

## 5. Repo layout

The full, current folder tree (feature folders, D-022) is in [WEBSITE_PLAN §8](WEBSITE_PLAN.md#8-folder-structure). In short:

```
maple/
├── docs/          ← planning only
├── client/        ← the Expo app: website + iOS + Android
│   └── src/
│       ├── app/          ← route files only (Expo Router)
│       ├── features/     ← one folder per feature, one owner each (OWNERSHIP.md)
│       ├── ui/           ← design-system components (DESIGN_SYSTEM.md)
│       ├── constants/    ← theme tokens, site constants, taxonomy
│       └── lib/          ← Supabase client, generated DB types, analytics, images
└── supabase/      ← migrations, Edge Functions, pgTAP tests, seed data
```

## 6. Free tiers

| Service | We use it for | Free tier (Sept 2026) | Limit that bites first |
|---|---|---|---|
| **GitHub** (Pro via Student Pack) | Code, pull requests, CI | Unlimited private repos, 3,000 Actions minutes/month | Actions minutes if CI gets heavy |
| **Domain** (Student Pack) | The Maple web address | **Namecheap:** 1 free `.me` for a year · **Name.com:** 1 free domain (`.app`, `.dev`, `.live`, `.studio`, `.software`) for a year · **get.tech:** 1 free `.tech` for a year | Renewal price after year 1. Name.com needs a card on file, so turn off auto-renew. |
| **Cloudflare Free** | DNS, CDN, SSL, website hosting, email forwarding, bot protection | Static hosting with unlimited requests · Workers 100K requests/day at 10 ms CPU each · R2 10 GB storage with zero egress fees · Email Routing free · Turnstile free | Workers CPU, only if we add server rendering |
| **Supabase Free** | Database, auth, storage, realtime, server functions | 500 MB database · 1 GB file storage · 50K monthly active users · 5 GB egress · 2 projects · Edge Functions 500K calls/month · Realtime 200 concurrent connections | **Pauses after 1 week idle, no backups**, so production moves to Pro |
| **Expo EAS Free** | Build and submit apps, instant updates | 15 iOS + 15 Android builds/month · updates to 1,000 monthly active users · Submit included | Builds in busy weeks. `eas build --local` on Android saves quota. |
| **Expo Push** + **Firebase Cloud Messaging** | Push notifications | Free | — |
| **Resend Free** | Login codes, notifications, digests | 3,000 emails/month, **max 100/day**, 1 domain | 100/day |
| **Stripe** | Web payments | No monthly fee. 2.9% + 30¢ per US card payment, +0.7% on subscriptions. | Fees only |
| **RevenueCat** | In-app purchases (iOS + Android) | Free up to $2,500 monthly tracked revenue, then 1% | — |
| **PostHog Free** | Product analytics, session replays | 1M events + 5,000 recordings/month | Recordings |
| **Sentry Developer** | Crash and error tracking | 5,000 errors/month, 1 user, 30-day history | 1 user seat. Check the Student Pack's Sentry offer. |
| **Tally** | Waitlist form (Phase 0) | Free forms and submissions | — |
| **Figma Education** | Design | Free for verified students | — |
| **1Password** (Student Pack) | Shared password vault | Free for 1 year | — |

**Not free (required to publish apps):**

| Item | Cost |
|---|---|
| Apple Developer Program | $99/year (needed for TestFlight and the App Store, and for installing test builds on your own iPhone) |
| Google Play Console | $25 one time |
| Store commission on in-app purchases | 15% (Apple Small Business Program, Google subscriptions) |

**In the Student Pack but not needed:** DigitalOcean $200 credit, Azure $100 credit, and Appwrite Education (a Supabase alternative). Keep them as backups.

## 7. What it costs, stage by stage

| Stage ([BUILD_PLAN.md](BUILD_PLAN.md)) | Monthly | One-time / yearly |
|---|---|---|
| Accounts + validation (Oct 2026) | $0 | Apple $99/year · Google $25 once · domain $0 in year 1 |
| Build (Nov 2026 – Jan 2027) | **$0** | — |
| Beta (Feb – Mar 2027) | **~$25** (Supabase Pro for production) | — |
| Launch (Apr 2027 →) | **~$25–70**: Supabase Pro $25, Resend Pro ~$20 when sends pass 100/day, Cloudflare Workers Paid $5 only if needed, an EAS paid plan only if builds run out | Domain renewal after year 1 |
| Per sale | Stripe 2.9% + 30¢ (+0.7% on subscriptions) · Apple / Google 15% · RevenueCat 1% above $2.5K/mo | — |

## 8. When to upgrade

| Service | Upgrade when | To |
|---|---|---|
| Supabase | Production goes live for beta (backups, no pausing) | Pro, $25/mo (8 GB database, 100 GB storage included) |
| Resend | Daily sends regularly pass ~80 | Pro, ~$20/mo |
| Expo EAS | More than 15 builds per platform a month, or more than 1,000 update users | A paid EAS plan (check expo.dev/pricing) |
| Cloudflare Workers | Only if we move to server rendering and pass 100K requests/day | Workers Paid, $5/mo |
| PostHog / Sentry | Free quotas run out | Pay-as-you-go / Team plan |
| Search | More than 1M documents, or p95 search above 300 ms | Typesense or Meilisearch (D-008) |

## 9. Deliberately not used (and when to add)

| Thing | Why not now | Add when |
|---|---|---|
| A backend server (Node, Express) | Supabase + Edge Functions cover everything | A job needs long runtimes or heavy CPU |
| Next.js / a separate marketing site | Expo's pre-rendered public pages cover the landing page and SEO | SEO needs live server rendering. Try Expo server rendering first. |
| Monorepo tooling (Turborepo, pnpm workspaces) | One app and one backend | A second app (admin tool, browser extension) needs shared code |
| Redis, job queues | Postgres + `pg_cron` handle limits and jobs | Measured contention |
| Redux / Zustand | TanStack Query holds server state | Real client-only state appears |
| Algolia / Typesense | Postgres full-text is enough (D-008) | More than 1M documents, or search is slow |
| Web push | Email + in-app notifications cover the web | Web users ask for it |
| Cloudflare R2 for files | Supabase Storage is simpler because RLS is built in | Files outgrow Supabase's included storage |
| Stripe Tax / a merchant of record | Beta revenue is small | Selling in many countries. Ask an accountant about sales tax and VAT. |
| Doppler / secret managers | Each platform has its own secret store | More than ~3 developers |

## 10. Known limits of this stack

- **Desktop web polish:** React Native Web needs deliberate responsive layouts, and a few web niceties (like a rich text editor) need web-specific components (`.web.tsx`). Bluesky solves this the same way.
- **SEO freshness:** public pages refresh nightly. If that's not enough, switch to server rendering (see §4.2).
- **Supabase free tier** pauses after 7 days of inactivity. That's fine for dev, but it's why production moves to Pro at beta.
- **Resend free tier** allows 100 emails a day.
- **App review:** every native release goes through Apple and Google review (usually 1–2 days). JavaScript fixes through `eas update` skip review.

## 11. Sources

- GitHub Student Developer Pack (domains): https://education.github.com/pack · Namecheap education: https://nc.me/landing/github · https://aistudentdiscount.com/blog/free-domain-names-for-students/
- Student Pack offers (DigitalOcean, Azure, Appwrite, Sentry, Copilot): https://creditforstartups.com/students/github-student-developer-pack · https://perkstack.co/blog/github-student-pack-guide
- Supabase free plan: https://uibakery.io/blog/supabase-pricing · https://makerkit.dev/blog/saas/supabase-pricing
- Expo EAS plans: https://expo.dev/pricing · https://docs.expo.dev/billing/plans/
- Expo Router static and server rendering: https://docs.expo.dev/router/web/static-rendering/ · https://docs.expo.dev/router/web/server-rendering/
- Cloudflare Workers limits and pricing: https://developers.cloudflare.com/workers/platform/pricing/ · https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing · Email Routing: https://www.cloudflare.com/products/email-routing/ · Turnstile: https://www.cloudflare.com/products/turnstile/
- Resend limits: https://resend.com/docs/knowledge-base/account-quotas-and-limits
- PostHog pricing: https://posthog.com/pricing · Sentry free plan: https://costbench.com/software/developer-tools/sentry/free-plan/
- RevenueCat pricing: https://www.revenuecat.com/pricing · Stripe Billing vs RevenueCat fees: https://adamarant.com/en/blog/stripe-billing-vs-revenuecat-picking-the-right-billing-layer
- Apple US external payment links: https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy · https://tiun.io/blog/ios-external-payments-us-cost-2026
- Google Play US billing changes: https://support.google.com/googleplay/android-developer/answer/15582165 · https://www.coda.co/blog/epic-v-google-policy-update-2026/
- Google Play 12-tester rule: https://support.google.com/googleplay/android-developer/answer/14151465
- Bluesky (one Expo codebase for web, iOS, Android): https://github.com/bluesky-social/social-app
