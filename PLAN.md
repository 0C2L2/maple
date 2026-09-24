# Maple: Project Plan

> **Maple is the professional network for event sponsorship.** It works like LinkedIn, but its two sides are **event organizers** and **sponsors** instead of job seekers and employers.

| | |
|---|---|
| Status | Pre-build (concept + validation) |
| Last updated | 2026-09-24 |
| Companion docs | [RESEARCH.md](RESEARCH.md) · [MARKET.md](MARKET.md) · [MVP.md](MVP.md) |

---

## 1. Vision

Every event should be able to find the right sponsor, and every brand should be able to find the right audience, in minutes instead of months.

LinkedIn made hiring a searchable, always-on market. Sponsorship still runs on cold emails, PDF decks, personal networks, and agencies. Maple makes sponsorship searchable, visible, and trusted.

## 2. The problem (short version)

| Organizers | Sponsors |
|---|---|
| Don't know which companies sponsor events like theirs, or who decides | Get flooded with generic sponsorship decks they didn't ask for |
| Cold outreach has very low reply rates | Can't easily find niche events that match their target audience |
| Their audience data is self-reported, so sponsors don't trust it | Can't compare events, prices, or past results |
| Sponsor renewals are getting harder because ROI is hard to prove | There's no single place to say "we have budget for X, send us events" |

Full evidence and sources: [RESEARCH.md](RESEARCH.md).

## 3. The solution: LinkedIn's model, mapped to sponsorship

The platform, the network mechanics, and the monetization all mirror LinkedIn. We add sponsorship-specific features on top.

| LinkedIn | Maple | Notes |
|---|---|---|
| Member profile | **Organizer profile** / **Sponsor profile** | Structured fields: audience, budget bands, categories, regions |
| Company page | **Organization page** | Event companies, brands, agencies |
| Connections & Follow | **Connect & Follow** | Same mechanics |
| Feed & posts | **Feed** with 4 post intents: *Offering*, *Seeking*, *Update*, *Recap* | Posts say what you give or what you're looking for |
| Jobs | **Opportunities**: *Sponsorship Packages* (organizers) and *Calls for Events* (sponsors) | Both sides can post |
| Easy Apply | **Quick Pitch** | One-click interest, profile attached |
| Featured Applicant (Premium) | **Featured Pitch** | Premium pitches show at the top of the recipient's inbox |
| InMail | **PitchMail** | Message anyone, paid credits |
| Who viewed your profile | **Who viewed your profile / opportunity** | Viewer company shown on Premium |
| Recommendations / endorsements | **Partner reviews** | Only after a confirmed deal |
| LinkedIn Events | **Events** | Native event pages |
| Groups | **Communities** | Later phase |
| Premium Career | **Premium Organizer** | |
| Premium Business | **Premium Sponsor** | |
| Sales Navigator | **Maple Scout** | Sponsor prospecting for organizers |
| Recruiter | **Sponsor Suite** | Event sourcing for brand teams |
| Promoted Jobs | **Promoted Opportunities** | Pay per click / per pitch |
| Marketing Solutions (ads) | **Maple Ads** | Sponsored posts, sponsored PitchMail |
| LinkedIn Learning | **Maple Academy** | Later phase |
| *(new)* | **Boost**: paid search priority | Ranks your profile or opportunity higher in search, clearly labeled |
| *(new)* | **Verified Audience** | Attendance verified through ticketing integrations |
| *(new)* | **Fit Score** | Match % between an event's audience and a sponsor's target |
| *(new)* | **Deal pipeline + ROI reports** | Track deals, send post-event reports to sponsors |
| *(new, later)* | **Maple Deals** | Contracts and payments on-platform, with a small fee |

## 4. Users and roles

| Role | Who | Main job on Maple |
|---|---|---|
| **Organizer** | Conference founders, hackathon leads, festival producers, meetup hosts, university clubs, nonprofit galas, esports tournaments | Find sponsors, publish packages, prove audience value |
| **Sponsor** | Brand marketers, dev-rel and community teams, partnership managers, local businesses | Find events that reach their audience, post what they fund |
| **Agency** *(phase 3)* | Sponsorship agencies and brokers | Manage many clients on either side |
| **Admin** | Maple staff | Moderation, verification, support |

## 5. Monetization summary

Mirrors LinkedIn's four revenue lines and adds pay-as-you-go visibility. Full pricing rationale and projections: [MARKET.md](MARKET.md).

| Line | Product | Price (hypothesis) | LinkedIn equivalent |
|---|---|---|---|
| Premium subscriptions | Premium Organizer | $29/mo ($24/mo annual) | Premium Career ($39.99) |
| | Premium Sponsor | $49/mo ($39/mo annual) | Premium Business ($59.99+) |
| Sales tools | Maple Scout | $99/seat/mo | Sales Navigator Core ($99.99) |
| Talent tools | Sponsor Suite | $179/seat/mo | Recruiter Lite ($170) |
| Enterprise | Scout / Suite Enterprise | Custom | Sales Nav Advanced Plus / Recruiter Corporate |
| Listings | Promoted Opportunities | CPC, from $5/day | Promoted Jobs |
| Ads | Sponsored posts / PitchMail | CPM / CPC | Marketing Solutions |
| **New** | **Boost (search priority)** | From $19 / 7 days | none |
| **Later** | Maple Deals transaction fee | 3–5% of deal value | none |

## 6. Roadmap

Today is late September 2026. The dates assume a small team (see section 7).

### Phase 0: Validate (Oct 2026, 4 weeks)
- 40 interviews: 20 organizers and 20 sponsors (script in [RESEARCH.md](RESEARCH.md#8-interview-plan))
- Landing page with a waitlist and two CTAs: "I'm organizing" and "I'm sponsoring"
- **Concierge MVP:** a weekly "Maple Weekly" email of 20 hand-picked events seeking sponsors, sent to sponsors. Introductions are made manually.
- Pre-sell Premium at a founder price ($99/year lifetime-locked) to test willingness to pay
- **Exit criteria:** ≥300 waitlist signups, ≥15 paid pre-sales or letters of intent, ≥5 sponsors who ask for intros from the newsletter

### Phase 1: MVP build (Nov 2026 – Jan 2027, 12 weeks)
- Build the scope in [MVP.md](MVP.md): profiles, organizations, events, opportunities, feed, search with Boost, messaging, Quick Pitch, Premium, and Stripe billing
- **Exit criteria:** all MVP flows work end to end, Stripe runs in live mode, 100 seeded opportunities are ready

### Phase 2: Private beta, then public launch (Feb – Apr 2027)
- Private beta: 150 organizers and 40 sponsors in the beachhead niche (tech events and hackathons)
- Weekly releases driven by feedback. Instrument the funnel.
- Public launch: Product Hunt, Show HN, and dev-rel communities
- **Exit criteria:** see the MVP success metrics in [MVP.md](MVP.md#14-success-metrics-first-90-days-after-beta)

### Phase 3: Growth (May – Dec 2027)
- Maple Scout and Sponsor Suite (team plans)
- Promoted Opportunities (CPC)
- Ticketing integrations (Eventbrite, Luma) for Verified Audience
- AI Fit Score and recommendations
- Partner reviews after confirmed deals
- Mobile apps (iOS and Android)
- Second niche (for example university/student events or music and culture festivals)

### Phase 4: Scale (2028+)
- Maple Ads (self-serve)
- Maple Deals (contracts, escrow, payouts, fee)
- Communities, Maple Academy
- Agency accounts, API, CRM integrations (HubSpot, Salesforce)
- International expansion and localization

## 7. Team

| Phase | Team |
|---|---|
| 0: Validate | Founder(s). No engineers needed; use no-code for the landing page and newsletter. |
| 1: MVP | 1–2 full-stack engineers, 1 part-time product designer, founder as PM and sales |
| 2: Launch | + 1 growth/community lead (focused on the sponsor side) |
| 3: Growth | + 2 engineers, 1 data/ML engineer, 1 sales rep for Scout/Suite, 1 support/trust & safety person |

## 8. Lean budget (first 6 months)

| Item | Monthly | Notes |
|---|---|---|
| Hosting and infra (Vercel, Supabase, Resend, PostHog, Sentry) | $100–$250 | Free tiers cover early beta |
| Stripe | 2.9% + 30¢ per charge | Paid only on revenue |
| Design tools, domain, email | ~$60 | |
| Marketing experiments | $1,000–$3,000 | Community sponsorships, which also let us dogfood the product |
| Legal (ToS, privacy policy, company setup) | $1,500–$3,000 one-time | |
| Team | Depends on founder and contractor setup | The largest cost by far |

## 9. KPIs

**North-star metric: Matched Conversations per week.** A matched conversation is a thread between an organizer and a sponsor where both sides have replied at least once. It measures real two-sided liquidity, which a signup count doesn't.

| Stage | Metric | Target by end of Phase 2 |
|---|---|---|
| Supply | Active opportunities (organizers) | 500 |
| Demand | Weekly active sponsors | 60 |
| Liquidity | % of opportunities with ≥1 sponsor interaction in 14 days | ≥30% |
| Outcome | Self-reported deals won | 50 cumulative |
| Revenue | Free → paid conversion | ≥3% |
| Revenue | MRR | $5k |
| Retention | Sponsor week-4 retention | ≥25% |

## 10. Top risks

| Risk | Mitigation |
|---|---|
| **Cold start.** Organizers are plentiful and sponsors are scarce. | Go deep in one niche, keep the sponsor side free early, run concierge matching, and have founders do sponsor sales directly |
| **Disintermediation.** Users meet, then leave the platform. | Keep value ongoing: discovery every season, reviews, pipeline, ROI reports, and later Maple Deals |
| **Fake or inflated events** | Domain verification, ticketing-verified audiences, partner reviews, reporting and moderation |
| **Boost feels pay-to-win** | Label boosted results, cap them at 2 per 10 results, and require a minimum relevance score |
| **Organizers have low willingness to pay** | Monetize the sponsor side and teams more heavily; offer cheap one-off Boosts for organizers |
| **LinkedIn adds a sponsorship feature** | Depth: structured sponsorship data, verified audiences, and deal tools a horizontal network won't build |

## 11. Legal and policy notes

- **Paid placement disclosure:** boosted and promoted results must be clearly labeled, following FTC guidance on search advertising
- **Privacy:** GDPR/CCPA-ready privacy policy, data export and deletion, and an opt-in for showing viewer identity
- **Content policy:** no fake events, no misrepresented audience numbers, no spam PitchMail. Rate limits and reporting enforce it.
- **Marketplace terms:** Maple is not a party to sponsorship contracts until Maple Deals launches

## 12. Next 14 days

- [ ] Buy the domain and set up a landing page with a waitlist (two role CTAs)
- [ ] Write the interview script (see [RESEARCH.md](RESEARCH.md#8-interview-plan)) and book the first 10 interviews
- [ ] Build a list of 100 tech events and hackathons looking for sponsors in the beachhead region
- [ ] Build a list of 50 dev-rel and community managers at SaaS, dev-tool, and cloud companies
- [ ] Send the first "Maple Weekly" to 20 sponsors
- [ ] Set up Stripe and a pre-sale payment link for founder pricing
- [ ] Decide the stack and repo (see [MVP.md](MVP.md#9-tech-stack))
