# Maple: Ownership

> Who builds what, so two developers (and their AI coding sessions) can work in the same codebase at the same time without colliding or building two different Maples.

| | |
|---|---|
| Status | **Proposed**: fill in the names and confirm the split ([WEBSITE_PLAN §11](WEBSITE_PLAN.md#11-open-questions-to-decide-before-coding), Q9–Q10) |
| Decision | D-022 (feature folders + feature ownership, proposed) |
| Related | [WEBSITE_PLAN.md](WEBSITE_PLAN.md) · [SHARED_CONTRACTS.md](SHARED_CONTRACTS.md) · [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) |

---

## 1. The rule: own features, not platforms

The website, the iOS app, and the Android app are **one codebase**. So nobody owns "web" or "mobile". Each developer owns **features**, and builds each of them for all three platforms at once.

Each feature has its own folder, `client/src/features/<feature>/`, and **only its owner edits it**. Anything shared (§4) needs both developers to review.

## 2. People and roles

| Role | Person | Responsibility |
|---|---|---|
| **Dev A** | _your name_ | Features in §3 marked A |
| **Dev B** | _your colleague's name_ | Features in §3 marked B |
| **Design-system owner** | Dev B (proposed) | `src/ui/`, `constants/theme.ts`, the app shell and navigation, [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) |
| **Contracts keeper** | Both | [SHARED_CONTRACTS.md](SHARED_CONTRACTS.md): any change needs both approvals |
| **Release manager** | Dev A (mobile builds and stores), Dev B (website deploys) | Shipping |

## 3. Feature ownership

| Feature | Owner | Folder | Routes | Tables | Edge Functions | Stage |
|---|---|---|---|---|---|---|
| Design system + app shell | **B** | `src/ui/`, `constants/theme.ts`, `app/**/_layout.tsx` | — | — | — | 2+ |
| Public website (landing, legal, 404) | **B** | `features/site/` | `/`, `/legal/*`, 404 | — | — | v1 |
| Auth + onboarding | **B** | `features/auth/` | `/login`, `/auth/callback`, `/onboarding` | `organizations` (create) | — | 4 |
| Organizations + reviews + verification | **B** | `features/organizations/`, `features/reviews/` | `/org/*` | `organizations`, `reviews`, `org_views` | `verify-org-email` | 5–6 |
| Find + saved posts | **B** | `features/find/` | `/find` | `saved_posts`, `saved_searches` + `search_posts` | — | 5–6 |
| Pricing, Stripe, Boost purchase | **B** | `features/billing/` (web part) | `/pricing`, `/boost` | `subscriptions`, `boosts` | `stripe-*` | 7 |
| Settings + account deletion | **B** | `features/settings/` | `/settings` | `organizations` | `delete-account` | 8 |
| Posts + tiers + views | **A** | `features/posts/` | `/posts/*`, `/my-posts` | `posts`, `post_tiers`, `post_views` | — | 5–6 |
| Proposals + deals | **A** | `features/proposals/` | `/proposals` | `proposals` | — | 6 |
| Messaging | **A** | `features/messages/` | `/messages/*` | `threads`, `thread_participants`, `messages` | — | 6 |
| Notifications + push | **A** | `features/notifications/` | `/notifications` | `notifications`, `push_tokens` | `notify`, `digest` | 6 |
| In-app purchases (RevenueCat) | **A** | `features/billing/mobile/` | — | `subscriptions` (store sources) | `revenuecat-webhook` | 10 |
| Admin + moderation | **A** | `features/admin/` | `/admin` | `reports` | — | 8 |
| Shared client code | **A** | `src/lib/` (supabase, analytics, images) | — | — | — | 2 |
| Mobile builds + stores | **A** | `eas.json`, store listings | — | — | — | 2, 9–10 |
| Website deploy + CI | **B** | `wrangler.jsonc`, `.github/workflows/`, `public/` | — | — | — | 0, 2 |

## 4. Shared areas (both developers review)

These files affect everyone. The **author** is whoever needs the change, and the **other developer approves** before it's merged.

| Area | Files | Rule |
|---|---|---|
| Design system | `src/ui/*`, `constants/theme.ts`, [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md) | The design-system owner writes the change; the other dev approves |
| Enum values and taxonomy | `constants/taxonomy.ts` + the matching database enums | Change both in the same pull request, together with [SHARED_CONTRACTS §1](SHARED_CONTRACTS.md#1-vocabulary-and-enum-values) |
| Database migrations | `supabase/migrations/*` | One migration per pull request, written by the table's owner. Never edit a merged migration. |
| Shared contracts | [SHARED_CONTRACTS.md](SHARED_CONTRACTS.md) | Change the doc in the same pull request as the code |
| Routes | adding, renaming, or removing anything in `src/app/` | Needs a decision entry ([DECISIONS.md](../product/DECISIONS.md)) |
| Dependencies | `package.json` | Add with `npx expo install`, and say why in the pull request |
| Root layouts | `app/_layout.tsx`, `app/(app)/_layout.tsx`, `(tabs)/_layout.tsx` | The design-system owner |

## 5. Working rules

1. **One branch per task:** `a/<feature>-<what>` or `b/<feature>-<what>`, e.g. `a/proposals-status-picker`. Merge to `main` through a pull request.
2. **Small pull requests** (aim for under ~400 changed lines). CI must pass: typecheck, lint, tests, build.
3. **Don't edit the other developer's feature folder.** Ask, or open an issue. The one exception is fixing a broken `main` build; tell the owner right away.
4. **Import other features only through their `index.ts`** (their public API), never from deep paths inside them.
5. **Contracts first.** When a feature needs a new table, function, or cross-feature component, update [SHARED_CONTRACTS.md](SHARED_CONTRACTS.md) in the same pull request.
6. **UI from the design system only.** If something is missing, ask the design-system owner rather than making a local version.
7. **Weekly 30-minute sync:** demo what works, review contract changes, re-balance work.
8. **AI assistants (Claude Code, Codex):** start every session by telling it which developer it works for. It must read `CLAUDE.md` / `AGENTS.md`, [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md), this file, and [SHARED_CONTRACTS.md](SHARED_CONTRACTS.md), and only edit that developer's folders.

## 6. Parallel plan by stage

Nothing in this table starts before the Phase 0 **Go** decision ([WEBSITE_PLAN §0](WEBSITE_PLAN.md#0-current-state-and-freeze-rule)).

| Build Plan stage | Dev A | Dev B |
|---|---|---|
| **Phase 0** (Oct) | Company, store enrollment, Supabase project | Phase 0 website only: Home, Privacy, 404, waitlist, deploy |
| **2. Setup** | EAS development builds · `src/lib/` (Supabase client, analytics, images) | Restructure the draft into `features/` + `ui/` · design-system primitives · app shell · CI |
| **3. Backend** | Migrations + RLS + tests: posts (+ tiers, views), proposals, reviews, messages | Migrations + RLS + tests: organizations, search (2 functions), billing · taxonomy constants |
| **4. Sign-in** | Post screens against seed data | Login, callback, onboarding, session guard |
| **5. Content** | Posts, tiers, Find, saved posts | Organizations, Reviews tab, public pre-rendering, deep links |
| **6. Conversations** | Proposals, messaging, notifications + push | Find filters, follow + Following tab, who viewed |
| **7. Payments** | Boosted badge on PostCard · QA | Pricing, Stripe, Boost purchase |
| **8. Hardening** | Admin, reports, moderation | Settings, account deletion, legal pages |
| **9–11. Beta → launch** | RevenueCat, TestFlight, Play testing, store listings | Website launch (Home switches to sign-up), SEO checks |

## 7. When the split changes

Re-balance at the weekly sync. Moving a feature means changing the owner in §3 and in [WEBSITE_PLAN §3](WEBSITE_PLAN.md#3-pages-list) in the same pull request.
