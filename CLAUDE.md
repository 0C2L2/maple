# CLAUDE.md

Context and rules for AI coding assistants working on Maple.

## Project

Maple is a LinkedIn-style professional network for **event organizers** and **sponsors**. Both sides keep profiles, connect, post what they offer or seek, search each other, pitch, and message. Revenue comes from Premium plans and **Boost** (paid, labeled search priority).

**Status:** Phase 0 (validation). No application code exists yet. See [README.md](README.md).

## Source of truth

| Question | Where to look |
|---|---|
| What are we building? What's out of scope? | [MVP.md](docs/product/MVP.md). Don't build anything listed in MVP §5 "Out of scope" unless asked. |
| Why was X chosen? | [DECISIONS.md](docs/product/DECISIONS.md). Don't silently reverse a decision. Propose a new entry instead. |
| What does a term mean? | Glossary in [README.md](README.md#glossary) |
| Business context | [PLAN.md](docs/business/PLAN.md), [MARKET.md](docs/business/MARKET.md), [RESEARCH.md](docs/research/RESEARCH.md) |

## Repo layout (D-018)

| Path | Contents |
|---|---|
| `docs/` | Planning docs only (`business/`, `research/`, `product/`, `engineering/`). Never put code here. |
| `client/` | The Expo app: website + iOS + Android from one codebase |
| `supabase/` | Backend: migrations, pgTAP tests, Edge Functions, config. Schema changes go through migrations only. |

Don't add workspace tooling (pnpm workspaces, Turborepo) until a second app needs shared code.

## Stack (D-015 – D-017, details in [TECH_STACK.md](docs/engineering/TECH_STACK.md))

Expo (React Native + Expo Router) + TypeScript + NativeWind · Supabase (Postgres + RLS, Auth, Realtime, Storage, Edge Functions, Cron) · Cloudflare (web hosting, DNS) · EAS (builds, store uploads, updates) · Stripe (web) + RevenueCat (in-app) · Resend · Expo Push · PostHog · Sentry.

## Rules

- **Use the glossary names in code:** `opportunity` (type `package` | `call`), `pitch`, `boost`, `post.intent` (`offering` | `seeking` | `update` | `recap`), `profile.role` (`organizer` | `sponsor`).
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
