# CLAUDE.md

Context and rules for AI coding assistants working on Maple.

## Project

Maple is a LinkedIn-style professional network for **organizations**: **event organizers** and **sponsors**. Every account is an organization page, not a person (D-025). Organizations follow each other, post what they offer or seek, search, pitch, and message. Revenue comes from Premium plans and **Boost** (paid, labeled search priority).

**Status:** Building v1 (D-024 replaced the Phase 0 freeze). Maple is a sponsorship marketplace like Upwork or Wishket (D-026): organizations post, the other side sends proposals, and both sides review each other after the event.

## Source of truth

| Question | Where to look |
|---|---|
| What are we building? What's out of scope? | [MVP.md](docs/product/MVP.md). Don't build anything listed in MVP §5 "Out of scope" unless asked. |
| Why was X chosen? | [DECISIONS.md](docs/product/DECISIONS.md). Don't silently reverse a decision. Propose a new entry instead. |
| What does a term mean? | Glossary in [README.md](README.md#glossary) |
| Which pages exist, and what does each do? | [WEBSITE_PLAN.md](docs/engineering/WEBSITE_PLAN.md) |
| How must it look? | [DESIGN_SYSTEM.md](docs/product/DESIGN_SYSTEM.md). Use only its tokens and `src/ui/` components. |
| Who owns which folder? | [OWNERSHIP.md](docs/engineering/OWNERSHIP.md). Only edit the folders of the developer you're working for. |
| Enum values, table and function names, component props | [SHARED_CONTRACTS.md](docs/engineering/SHARED_CONTRACTS.md). Change them only in a pull request that updates that doc. |
| Business context | [PLAN.md](docs/business/PLAN.md), [MARKET.md](docs/business/MARKET.md), [RESEARCH.md](docs/research/RESEARCH.md) |

## Repo layout (D-018)

| Path | Contents |
|---|---|
| `docs/` | Planning docs only (`business/`, `research/`, `product/`, `engineering/`). Never put code here. |
| `client/` | The Expo app: website + iOS + Android from one codebase. Planned layout (D-022): `src/app/` holds route files only; `src/features/<feature>/` is one folder per feature, each with one owner; `src/ui/` holds design-system components. |
| `supabase/` | Backend: migrations, pgTAP tests, Edge Functions, config. Schema changes go through migrations only. |

Don't add workspace tooling (pnpm workspaces, Turborepo) until a second app needs shared code.

## Stack (D-015 – D-017, details in [TECH_STACK.md](docs/engineering/TECH_STACK.md))

Expo (React Native + Expo Router) + TypeScript + React Native `StyleSheet` with the theme tokens (D-023) · Supabase (Postgres + RLS, Auth, Realtime, Storage, Edge Functions, Cron) · Cloudflare (web hosting, DNS) · EAS (builds, store uploads, updates) · Stripe (web) + RevenueCat (in-app) · Resend · Expo Push · PostHog · Sentry.

## Rules

- **Use the glossary names in code:** `post` (kind `event` | `sponsor`), `proposal`, `review`, `boost`, `organization.role` (`organizer` | `sponsor`), `organization.kind`. There are no personal profiles (D-025) and no social feed (D-026).
- **Prefer built-in platform features over new services or dependencies:** Postgres full-text search + `pg_trgm` for search (D-008), Supabase Realtime for messaging, Stripe Customer Portal instead of a custom billing UI.
- **Row Level Security on every table.** Users write only their own rows. Messages, profile views, and billing are never public.
- **Money is stored as integer cents.** Timestamps are `timestamptz` in UTC.
- **Search ranking weights come from the `ranking_weights` table.** Never hard-code them.
- **Boost rules are product and legal requirements** (MVP §7.2): always label boosted results "Boosted", max 2 per 10 results, relevance ≥ 0.3.
- **Never commit secrets.** Keep them in `.env.local`.
- **Write each screen once for all three platforms.** Use `.web.tsx` / `.native.tsx` only where a platform truly differs.
- **The Supabase service-role key never goes in `client/`.** It lives only in Edge Functions.
- **Every purchase lands in `subscriptions`** (`source`: `stripe` | `app_store` | `play_store`). Feature gates read only that table.
- **Every analytics event listed in MVP §4.14 must fire.** `matched_conversation` is the north-star event.
