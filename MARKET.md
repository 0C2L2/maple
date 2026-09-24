# Maple: Market Analysis

> Market size, competition, pricing, revenue model, and go-to-market plan.

| | |
|---|---|
| Last updated | 2026-09-24 |
| Companion docs | [PLAN.md](PLAN.md) · [RESEARCH.md](RESEARCH.md) · [MVP.md](MVP.md) |

> **Note on figures:** top-down numbers come from third-party research firms that often disagree, so ranges are shown. Bottom-up numbers and projections are **our assumptions** and are labeled as such. Re-check any figure before it goes into an investor deck.

---

## 1. Summary

- **The events economy is huge and sponsorship is one of its main revenue lines.** Estimates put the global events industry at **~$1.5–1.8 trillion (2025)**, B2B events alone at **~$52.5B (2025), growing ~8.9% a year**, and sports sponsorship alone at **~$66–92B (2025)**.
- **LinkedIn proves the business model.** LinkedIn made **~$17.8B in FY2025**, and Premium subscriptions alone passed **$2B a year** in early 2025. Professionals pay for visibility, reach, and search.
- **No one owns sponsorship discovery for small and mid-size events.** Enterprise data tools serve sports and entertainment giants. Marketplaces are listing boards with low engagement.
- **Maple's wedge:** a LinkedIn-style network, specialized for sponsorship, starting with **tech events and hackathons** and then expanding niche by niche.

## 2. Top-down market context

| Metric | Value | Source |
|---|---|---|
| Global events industry (2025) | $1.48T – $1.84T | Expert Market Research; DataIntelo |
| Corporate share of events industry (2025) | ~39% | Industry reports via search summaries |
| Global B2B events market (2025 → 2033) | $52.5B → $103.9B (8.9% CAGR) | Metastat Insight |
| Global sports sponsorship (2025) | $65.7B – $91.7B | Straits Research; Fortune Business Insights |
| Eventbrite: creators (2024) | ~766K creators, 4.7M+ events | Eventbrite FY2024 shareholder letter |
| Eventbrite: events and tickets (2025) | ~4.6M events, 258M tickets, $3.0B+ gross ticket sales | Eventbrite 2025 10-K |
| LinkedIn revenue (FY2025) | ~$17.8B (+9%) | Microsoft reports via FourWeekMBA / Superstrat |
| LinkedIn Premium subscriptions | >$2B trailing 12 months (Jan 2025) | MediaPost |

**Takeaway:** Maple doesn't take a cut of sponsorship spend at first. It sells subscriptions, visibility, and tools to the people who move that spend. The sponsorship dollars show how valuable a match is, and that value is what users pay us for.

## 3. TAM / SAM / SOM (bottom-up, our assumptions)

### Assumptions
| Input | Value | Reasoning |
|---|---|---|
| Organizers worldwide who actively seek sponsors | ~2,000,000 | Eventbrite alone has ~766K creators. Add Luma, Meetup, universities, nonprofits, sports, and independents, then assume about half actively seek sponsors. |
| Companies worldwide that sponsor events regularly | ~500,000 | SponsorUnited alone tracks 403K brands and rights holders in sports and entertainment. Add B2B, tech, and local businesses. |
| Organizer ARPU (paying) | ~$480/yr | Blend of Premium Organizer, Scout, and Boosts |
| Sponsor ARPU (paying) | ~$1,500/yr | Blend of Premium Sponsor, Sponsor Suite seats, and Enterprise |

### Sizing
| Layer | Definition | Math | Size |
|---|---|---|---|
| **TAM** | All sponsor-seeking organizers and sponsoring companies worldwide, if all paid | 2M × $480 + 500K × $1,500 | **~$1.7B / yr** (+ ads and Boost upside) |
| **SAM** | English-speaking markets (US, UK, CA, AU, IE, IN, SG), business/tech/student/community events | 400K × $480 + 100K × $1,500 | **~$342M / yr** |
| **SOM (year 3)** | Share we can realistically capture | See §7 | **~$8.3M ARR (~2.4% of SAM)** |

**Upside not counted:** a 3–5% fee on deals closed through Maple Deals (phase 4). Facilitating even $300M a year of sponsorship at 3% would add ~$9M a year.

## 4. Segments and beachhead

| Segment | Sponsor density | Deal size | Sales cycle | Online-native | Verdict |
|---|---|---|---|---|---|
| **Tech events, hackathons, dev meetups** | High (SaaS, cloud, dev tools, fintech) | $500 – $50K | Weeks | Very | **Beachhead** |
| University / student events | Medium | $200 – $20K | Weeks | Very | Niche #2 candidate |
| B2B conferences (non-tech) | High | $5K – $250K | Months | Medium | Phase 3 |
| Music, culture, festivals | High (consumer brands) | $10K – $1M+ | Months | Medium | Phase 3–4 (needs Enterprise) |
| Local community events, charity runs | Low per event, many events | $100 – $5K | Days | Low | Phase 3 (local SEO play) |
| Esports and gaming | Medium–High | $1K – $500K | Weeks–months | Very | Niche #2 candidate |
| Pro sports | Very high | $100K+ | Long | Low | Not a target (SponsorUnited's turf) |

**Why tech first:** sponsors have recurring budgets and dedicated dev-rel teams, organizers and sponsors both live online, deals are small enough to close without procurement, and launch channels (Product Hunt, Hacker News, Devpost, MLH, Discord communities) are cheap and concentrated.

## 5. Competitive landscape

| Category | Players | Strength | Weakness Maple exploits |
|---|---|---|---|
| Horizontal professional network | **LinkedIn** | Everyone is already there, huge graph | No sponsorship objects, no intent signals, InMail noise |
| Sponsorship marketplaces | SponsorMyEvent, SponsorPitch, SponsorPark, LookingForSponsor, Sponseasy (pitch tool), OpenSponsorship (sports) | Purpose-built listings | Listing boards with no network or feed, few active sponsors, low engagement |
| Sponsorship intelligence | **SponsorUnited** | Deep data (2.2M+ deals), enterprise trust | Custom enterprise pricing, sports/entertainment focus, no marketplace for small events |
| Event management / sponsor fulfillment | Cvent, Bizzabo, Swapcard, Eventeny | Owns the event workflow | Only covers sponsors *after* a deal, doesn't do discovery |
| Networking / matchmaking | b2match | B2B meeting matchmaking | Matches attendees at events, not sponsors to events |
| Agencies / brokers | Many, fragmented | Relationships | Expensive, closed, don't scale to small events |

### Positioning
> **For** event organizers and brand sponsorship teams
> **who** waste months on cold outreach and irrelevant decks,
> **Maple is** the professional network for sponsorship
> **that** lets both sides post what they offer or seek, search each other with structured filters, and build lasting partnerships.
> **Unlike** LinkedIn (generic) or sponsorship marketplaces (static listings), Maple combines a live network, structured sponsorship data, and verified audiences.

## 6. Pricing

### 6.1 LinkedIn benchmark (2026 list prices, per third-party guides)
| LinkedIn plan | Monthly |
|---|---|
| Premium Career | $39.99 |
| Premium Business | $59.99 (new subscribers shown up to $69.99) |
| Sales Navigator Core | $99.99 |
| Sales Navigator Advanced | $149.99 |
| Recruiter Lite | $170 |
| Sales Nav Advanced Plus / Recruiter Corporate | Custom |

Annual billing gives roughly 17–50% off Premium and 6–25% off Sales Navigator.

### 6.2 Maple pricing (hypothesis, to be tested in Phase 0)
Organizers are more budget-constrained than job seekers, so organizer plans are priced below LinkedIn. Sponsor team plans are priced at LinkedIn level.

| Plan | For | Monthly | Annual (per mo) | Key paid features |
|---|---|---|---|---|
| **Free** | Everyone | $0 | – | Profile, posts, 1 active opportunity, 5 Quick Pitches/mo, message connections, basic search |
| **Premium Organizer** | Individual organizers | $29 | $24 | Unlimited Quick Pitches, **Featured Pitch** (top of sponsor inbox), 10 PitchMail/mo, full "who viewed", advanced sponsor filters (budget band, past sponsorships), 3 active opportunities, **1 Boost credit/mo**, media-kit builder, insights |
| **Premium Sponsor** | Individual sponsors | $49 | $39 | 15 PitchMail/mo, advanced event filters (audience size, demographics, verified-only), **24h early access** to new opportunities, 3 active Calls for Events, saved searches and alerts, who viewed, 1 Boost credit/mo |
| **Maple Scout** | Organizer sales teams, event companies | $99/seat | $79/seat | Everything in Premium Organizer + sponsor lead lists, intent signals (who is actively Seeking, who sponsored similar events), 50 PitchMail, pipeline (CRM-lite), CSV export, team sharing, 4 Boosts/mo |
| **Sponsor Suite** | Brand, dev-rel, and agency teams | $179/seat | $149/seat | Everything in Premium Sponsor + event pipeline, 100 PitchMail, unlimited Calls for Events, competitor sponsorship tracking, ROI reports from organizers, team seats, 4 Boosts/mo |
| **Enterprise** | Large brands, agencies, event groups | Custom | Custom | SSO, API, CRM integrations, dedicated support, custom data |

### 6.3 Pay-as-you-go (the "more features" layer)
| Product | Price | What it does |
|---|---|---|
| **Search Boost** | $19 / 7 days | Priority placement in search results for 1 category + 1 region |
| **Profile Boost** | $15 / 7 days | Appear in "Suggested organizers / sponsors" panels |
| **Opportunity Boost** | $29 / 7 days | Priority in search **and** feed for one opportunity |
| **Promoted Opportunity** *(phase 3)* | CPC, from $5/day | Pay per click or per pitch received, like LinkedIn Promoted Jobs |
| **Sponsored post / Sponsored PitchMail** *(phase 4)* | CPM / per send | Ads product, like LinkedIn Marketing Solutions |
| **Maple Deals fee** *(phase 4)* | 3–5% of deal value | Contracts, escrow, and payouts on-platform |

**Boost integrity rules:** boosted items are labeled "Boosted", capped at 2 per 10 results, and must meet a minimum relevance score. The mechanics are in [MVP.md](MVP.md#7-search-ranking-and-boost).

## 7. Revenue projection (illustrative, our assumptions)

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Organizer accounts | 8,000 | 40,000 | 150,000 |
| Sponsor accounts | 2,000 | 8,000 | 25,000 |
| Organizer paid conversion | 3% (240) | 4% (1,600) | 5% (7,500) |
| Organizer blended ARPU / mo | $25 | $35 | $40 |
| Sponsor paid conversion | 6% (120) | 7% (560) | 8% (2,000) |
| Sponsor blended ARPU / mo | $60 | $90 | $120 |
| Subscription MRR | $13.2K | $106.4K | $540K |
| Boost + promoted + ads MRR | $3K | $30K | $150K |
| **Total MRR (end of year)** | **~$16.2K** | **~$136.4K** | **~$690K** |
| **ARR run-rate** | **~$194K** | **~$1.64M** | **~$8.28M** |

Sponsor ARPU rises over time as the mix shifts toward Sponsor Suite seats and Enterprise.

## 8. Unit economics targets

| Metric | Target | Notes |
|---|---|---|
| Organizer CAC | < $20 | Mostly organic: communities, SEO, and invites from sponsors |
| Sponsor CAC (self-serve) | < $150 | Founder-led and community sales early |
| Sponsor Suite CAC | < $1,500 | Sales-assisted |
| Gross margin | > 85% | Software plus low infra cost |
| Monthly churn (Premium) | < 6% | Event seasonality is a risk, so push annual plans |
| LTV : CAC | > 3 : 1 | |
| CAC payback | < 6 months (self-serve) | |

**Seasonality:** organizers need sponsors in bursts before each event. To reduce churn: offer annual plans, run Boosts on a pay-per-use model, and add a "pause subscription" option instead of cancel.

## 9. Go-to-market

### 9.1 Cold-start playbook (supply first, then demand)
Organizers are abundant and sponsors are scarce, so **sponsors are the constrained side**. Recruit them by hand and keep them free early.

1. **Concierge newsletter (Phase 0):** "Maple Weekly: 20 tech events seeking sponsors this month", sent to dev-rel managers. Make intros manually.
2. **Seed organizers:** personally onboard 100 hackathons and meetups. One-click import from an Eventbrite or Luma URL.
3. **Sponsor-side founder sales:** 50 hand-picked dev-rel and community leads get free Premium Sponsor for 6 months.
4. **Viral loop 1:** organizers "invite your past sponsors to endorse you". Every organizer brings sponsors.
5. **Viral loop 2:** sponsors post a Call for Events and share the link. Organizers sign up to apply.
6. **Public profiles and SEO:** indexable pages like "Hackathons seeking sponsors in Berlin" and "Companies that sponsor developer events".

### 9.2 Channels
| Channel | Side | Cost | Phase |
|---|---|---|---|
| Hackathon networks (Devpost, MLH), university clubs | Organizers | Low | 0–2 |
| Dev-rel communities (Slack/Discord groups, DevRelCon-style events) | Sponsors | Low | 0–2 |
| Product Hunt, Show HN | Both | Free | 2 |
| LinkedIn content and outreach (use LinkedIn to leave LinkedIn) | Both | Low | 0+ |
| SEO landing pages per niche and city | Both | Low, compounds | 2+ |
| Maple sponsors small events itself (dogfooding and brand) | Organizers | $1–3K/mo | 1+ |
| Partnerships with event platforms (Luma, Eventbrite app listings) | Organizers | Medium | 3 |
| Outbound sales for Sponsor Suite | Sponsors | High | 3 |

### 9.3 Launch sequence
| When | Milestone |
|---|---|
| Oct 2026 | Waitlist and concierge newsletter live, interviews done |
| Jan 2027 | MVP complete |
| Feb 2027 | Private beta: 150 organizers, 40 sponsors |
| Apr 2027 | Public launch (Product Hunt, Show HN) |
| H2 2027 | Scout and Sponsor Suite, second niche |

## 10. Market risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sponsor side stays thin | High | High | Founder sales, free sponsor tier, concierge matching, niche density before breadth |
| Organizers won't pay subscriptions | Medium | Medium | Monetize through Boosts and the sponsor side |
| Seasonality churn | High | Medium | Annual plans, pause option, pay-per-use Boosts |
| LinkedIn or Eventbrite copy the idea | Low–Medium | High | Depth in structured data, verification, and deal tools; community brand |
| Economic downturn cuts sponsorship budgets | Medium | High | Sponsors then need *better-targeted* spend, so Fit Score and ROI reports become a stronger pitch |

## 11. Sources

- Expert Market Research, Events industry market: https://www.expertmarketresearch.com/reports/events-industry-market
- DataIntelo, Global events market: https://dataintelo.com/report/global-events-market
- Metastat Insight, B2B event market: https://metastatinsight.com/report/b2b-event-market
- Fortune Business Insights, Sports sponsorship market: https://www.fortunebusinessinsights.com/sports-sponsorship-market-111331
- Straits Research, Sports sponsorship market: https://straitsresearch.com/report/sports-sponsorship-market
- Eventbrite FY2024 shareholder letter: https://www.sec.gov/Archives/edgar/data/1475115/000147511525000025/q4shareholderletterfinal.htm
- Eventbrite 2025 Form 10-K: https://www.sec.gov/Archives/edgar/data/1475115/000147511526000005/eb-20251231.htm
- FourWeekMBA, LinkedIn revenue breakdown: https://fourweekmba.com/linkedin-revenue-breakdown/
- Superstrat Labs, LinkedIn statistics 2026: https://www.superstratlabs.com/blog/linkedin-statistics
- MediaPost, LinkedIn Premium passes $2B: https://www.mediapost.com/publications/article/403015/linkedin-cites-ai-investments-as-premium-subscript.html
- LinkedIn pricing guides: https://expandi.io/blog/linkedin-account-types/ · https://salesbread.com/how-much-does-linkedin-premium-cost/
- SponsorUnited: https://www.sponsorunited.com/
- Similarweb, SponsorMyEvent competitors: https://www.similarweb.com/website/sponsormyevent.com/competitors/
- Eventeny, Sponsor trends 2025: https://resources.eventeny.com/event-sponsor-trends-what-brands-want-in-2025
