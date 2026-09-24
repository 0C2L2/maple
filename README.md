# Maple

> **The professional network for event sponsorship.** LinkedIn's model, rebuilt for **event organizers** and **sponsors**.

| | |
|---|---|
| Status | **Phase 0: Validation** (no code yet) |
| Last updated | 2026-09-24 |
| Owner | _add founder name(s)_ |

---

## What Maple is

Organizers and sponsors keep a profile, connect, follow, and post in a feed, just like LinkedIn. The difference is that every post and listing says **what you give** or **what you're looking for**:

- **Organizers** post *Sponsorship Packages*, like "Gold tier, $5K, keynote slot + booth at our 1,500-person dev conference".
- **Sponsors** post *Calls for Events*, like "$1–5K each for 5 student hackathons this spring".
- Both sides search each other with structured filters (audience, budget, region, category), pitch in one click, and message.
- Monetization mirrors LinkedIn (Premium, a Sales Navigator-style tool, a Recruiter-style tool, promoted listings, ads) plus **Boost**, which is paid, clearly labeled priority in search.

## Project structure

Planning docs and code are kept apart. Code folders don't exist yet; each one is created by its setup tool when its phase starts.

```
maple/
├── README.md             ← you are here
├── CLAUDE.md             ← rules for AI coding assistants
├── docs/                 ← planning docs only, no code
│   ├── business/         ← PLAN.md, MARKET.md
│   ├── research/         ← RESEARCH.md, VALIDATION.md
│   ├── product/          ← MVP.md, DECISIONS.md
│   └── engineering/      ← TECH_STACK.md, BUILD_PLAN.md
│
│   ── created when the build starts (Build Plan Stage 2) ──
├── client/               ← the Expo app: website + iOS + Android, one codebase
└── supabase/             ← the backend: database migrations, tests, server functions
```

- New docs go in `docs/business`, `docs/research`, `docs/product`, or `docs/engineering`.
- Anything with personal data (interview notes, contact lists) stays **out of the repo**. Keep it in the tracker sheet or a shared drive.

## Documents

| Doc | What it covers | Read it when |
|---|---|---|
| [PLAN.md](docs/business/PLAN.md) | Vision, LinkedIn → Maple mapping, roadmap, team, budget, KPIs, risks | You want the big picture |
| [RESEARCH.md](docs/research/RESEARCH.md) | Problem evidence, personas, hypotheses, competitor comparison, interview scripts | You're doing user research or questioning the idea |
| [MARKET.md](docs/business/MARKET.md) | Market size, competitors, pricing, revenue projections, go-to-market | You're pitching, pricing, or planning growth |
| [MVP.md](docs/product/MVP.md) | The full MVP spec: features, flows, search and Boost rules, data model, screens, 12-week build plan | You're designing or building |
| [VALIDATION.md](docs/research/VALIDATION.md) | The Phase 0 playbook: setup, templates, tracker, go/no-go | **Now.** This is the current phase. |
| [DECISIONS.md](docs/product/DECISIONS.md) | Log of every major decision and why | Before you change a major choice |
| [TECH_STACK.md](docs/engineering/TECH_STACK.md) | What we build with, why, how, free tiers, costs | You're choosing tools or checking costs |
| [BUILD_PLAN.md](docs/engineering/BUILD_PLAN.md) | Every step from an empty folder to live on web, App Store, and Google Play | You're building |
| [CLAUDE.md](CLAUDE.md) | Project rules for AI coding assistants | Automatically, by Claude Code |

**First read:** README → PLAN → VALIDATION. Read MVP before any build work.

## Glossary

Use these exact terms in docs, UI copy, and code.

| Term | Meaning |
|---|---|
| **Organizer** | A user who runs events and looks for sponsors |
| **Sponsor** | A user at a company that funds or supports events (cash or in-kind) |
| **Organization** | A company page: event company, brand, agency, or university club |
| **Event** | A single event with dates, location, audience, and attendance |
| **Opportunity** | A structured listing (Maple's version of a LinkedIn Job). It has two types: |
| ↳ **Sponsorship Package** | Posted by an organizer for an event, with tiers (price, benefits, slots) |
| ↳ **Call for Events** | Posted by a sponsor: "we want to sponsor events like X, budget Y" |
| **Post intent** | Every feed post is tagged `Offering`, `Seeking`, `Update`, or `Recap` |
| **Quick Pitch** | One-click interest in an Opportunity (like Easy Apply) |
| **Pitches inbox** | Where the poster manages pitches: new → shortlisted → in talks → won / declined |
| **Featured Pitch** | Premium perk: your pitches sort to the top of the recipient's inbox |
| **PitchMail** | A paid message to someone you're not connected to (like InMail) |
| **Boost** | Paid, labeled priority in search/feed for 7 days (max 2 per 10 results) |
| **Matched conversation** | A thread where both an organizer and a sponsor have replied. **This is the north-star metric.** |
| **Deal** | A pitch marked **Won** |
| **Verified company** | Badge earned by verifying a work email on the organization's domain |
| **Verified Audience** | *(Phase 3)* Attendance verified through ticketing integrations |
| **Fit Score** | *(Phase 3)* Match % between an event's audience and a sponsor's target |
| **Maple Scout** | *(Phase 3)* Team plan for organizers prospecting sponsors (like Sales Navigator) |
| **Sponsor Suite** | *(Phase 3)* Team plan for brands sourcing events (like Recruiter) |
| **Beachhead** | The first niche we win: tech events and hackathons |

## Current phase: what to do now

We're in **Phase 0: Validation (October 2026)**. No code gets written until the go/no-go at the end of Phase 0.

1. Work through the setup checklist in [VALIDATION.md](docs/research/VALIDATION.md#0-setup-checklist-before-day-1), starting with the **name/trademark check**
2. Claim the domain and start the slow setups (company, D-U-N-S number, Apple and Google developer accounts): [BUILD_PLAN.md Stage 0](docs/engineering/BUILD_PLAN.md#stage-0-accounts-company-and-domain)
3. Run 40 interviews (20 organizers, 20 sponsors)
4. Send the "Maple Weekly" concierge newsletter to sponsors
5. Open founder pre-sales
6. Make the go/no-go decision (see [VALIDATION.md](docs/research/VALIDATION.md#8-synthesis-and-gono-go))

## When the build starts (Phase 1)

Maple is **one Expo (React Native) codebase** that ships the website, the iOS app, and the Android app. Supabase is the backend and Cloudflare hosts the website (D-015 – D-018).

- The what and why: [TECH_STACK.md](docs/engineering/TECH_STACK.md)
- Every step from 0 to 100%: [BUILD_PLAN.md](docs/engineering/BUILD_PLAN.md)
