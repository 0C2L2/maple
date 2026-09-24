# Maple: Research

> What we know about the problem, how people solve it today, and what we still need to prove.

| | |
|---|---|
| Last updated | 2026-09-24 |
| Method | Desk research (public reports, competitor sites, pricing pages). Primary interviews are planned in Phase 0. |
| Companion docs | [PLAN.md](../business/PLAN.md) · [MARKET.md](../business/MARKET.md) · [MVP.md](../product/MVP.md) |

> **Note on figures:** third-party numbers below come from public reports and articles (see [Sources](#10-sources)). Research firms often disagree, so ranges are shown where they differ. Re-check any figure before it goes into an investor deck.

---

## 1. Research questions

1. How do organizers find sponsors today, and where does it break?
2. How do sponsors find events today, and where does it break?
3. Why doesn't LinkedIn, or existing sponsorship marketplaces, already solve this?
4. Will either side pay for visibility, tools, or priority?
5. What data do sponsors need before they commit money?

## 2. Key findings from desk research

### 2.1 Getting sponsors is organizers' top marketing challenge
- Securing sponsorship was the **#1 event marketing challenge for 24.6% of live event organizers** in 2024 (Eventeny, 2025 sponsorship trends).
- **75% of organizers** reported at least 5% sponsorship revenue growth in 2025 (Eventeny). The money is there, but it's unevenly distributed and hard to reach.

### 2.2 Sponsors now buy audience data, not logo placement
- Sponsors are moving away from "generic banners and passive logo displays" toward **targeted, personalized opportunities** (Eventeny).
- What sponsors are buying in 2026 is described as **audience intelligence**: verified data on who attends, how they behave, and how they engage (SquadUp).
- **Implication for Maple:** structured and verified audience data on every event profile is the core asset. A deck PDF isn't enough.

### 2.3 Renewals and ROI proof are getting harder
- Sponsor renewals are harder even when events perform well, because finance teams ask for more justification (Bridged).
- **Implication:** post-event ROI reports and partner reviews keep both sides on Maple after the first deal. This is our defense against disintermediation.

### 2.4 Long-term partnerships outperform one-offs
- Sponsors in ongoing partnerships report **89% higher satisfaction** than one-off sponsors (Event Marketer data, cited by Eventeny).
- **Implication:** a *network* (follow, relationship history, recurring discovery) fits better than a one-shot *listing board*.

### 2.5 The existing tools are fragmented
- **Marketplaces** (SponsorMyEvent, SponsorPitch, SponsorPark, Sponseasy, LookingForSponsor, OpenSponsorship for sports) are mostly listing boards or pitch tools. They have little social graph, feed, or ongoing engagement.
- **Sponsorship intelligence** (SponsorUnited) is enterprise-grade and sports/entertainment-focused. It tracks 2.2M+ deals across 403K+ brands and rights holders, with custom pricing. This proves that sponsorship data has value, but the product is out of reach for small and mid-size organizers.
- **Event management platforms** (Cvent, Bizzabo, Swapcard, Eventeny) handle sponsors *after* a deal (booths, lead retrieval). They don't handle discovery.
- **LinkedIn** is where these people already are, but it has no sponsorship-specific objects (see §4).

## 3. How it's done today

| Method | Who uses it | Why it breaks |
|---|---|---|
| Cold email and LinkedIn DMs | Almost every organizer | Low reply rates, wrong contact, no budget visibility |
| Personal network / "who do you know" | Experienced organizers | Doesn't scale, closed to newcomers |
| Past sponsor lists of similar events (manual research) | Mid-size organizers | Tedious, goes stale, no intent signal |
| Sponsorship agencies and brokers | Large events, big brands | Commission-based, too expensive for small events |
| Sponsorship marketplaces | Small organizers | Few active sponsors, listing-board UX, low engagement |
| Inbound deck requests | Big brands | Brands get flooded, most decks are irrelevant |
| Spreadsheets as the CRM | Both | No shared history, no data on results |

## 4. Why LinkedIn doesn't solve this

LinkedIn is the closest thing, and Maple copies its model on purpose. Its gaps for sponsorship:

1. **No sponsorship objects.** It has no "sponsorship package", "budget band", "audience profile", or "call for events". Everything is free text.
2. **Sponsor intent is invisible.** You can't search for "companies with a $5–25k budget for hackathons in Q1".
3. **Audience claims aren't verified.** Nothing shows an event really had 2,000 attendees.
4. **Roles are generic.** A dev-rel manager's profile doesn't say what they sponsor.
5. **InMail noise.** Sponsorship pitches compete with recruiter and sales spam.
6. **No deal or ROI layer.** There's no pipeline, no post-event report, and no review of a partnership.

## 5. Personas

### Organizers

**O1: Student hackathon lead**
- Runs a 300-person university hackathon twice a year. Needs $5–20k plus in-kind (cloud credits, swag, food).
- Pains: new team every year, no inherited sponsor contacts, doesn't know who at a company handles sponsorship.
- Would pay: rarely personally. The club budget might cover a Boost.

**O2: Independent conference founder**
- Runs a 1,500-person B2B tech conference once a year. Sponsorship is 50%+ of revenue.
- Pains: renewals, finding new sponsors each year, proving ROI to sponsors.
- Would pay: yes. Premium and Scout are worth it if one extra sponsor closes.

**O3: Community meetup host**
- Monthly 80-person meetup. Needs venue, food, and $500 per event.
- Pains: small asks get ignored by large brands.
- Would pay: small amounts. Boosts fit better than subscriptions.

**O4: Festival / cultural event producer**
- 10,000+ attendees, consumer brands, long sales cycles.
- Pains: reaching brand decision-makers, getting the timing right against brand budget cycles.
- Would pay: yes, at team and enterprise level.

### Sponsors

**S1: Dev-rel / community manager at a SaaS or dev-tools company**
- $50–300k a year spread across 20–60 events. Wants developers.
- Pains: too many irrelevant decks, hard to find niche and regional events, has to report ROI to leadership.
- Would pay: yes, company card. Premium Sponsor now, Sponsor Suite as the team grows.

**S2: Brand marketing manager (consumer brand)**
- Sponsors festivals, sports, and culture events. Bigger tickets, longer cycles.
- Pains: evaluating audience fit and brand safety, comparing prices.
- Would pay: Sponsor Suite / Enterprise.

**S3: Local business owner**
- Sponsors local runs, school events, and community festivals for $200–$2,000.
- Pains: doesn't know what's happening locally, and gets asked face-to-face.
- Would pay: rarely. Free user; value comes from local discovery.

**S4: Sponsorship agency / broker** *(phase 3)*
- Manages many brands or many events.
- Would pay: yes, multi-seat.

## 6. Hypotheses to validate

| # | Hypothesis | How to test | Pass if |
|---|---|---|---|
| H1 | Organizers will create a detailed profile and post a package if it takes under 5 minutes | Concierge onboarding + MVP funnel | ≥60% of signups complete a profile |
| H2 | Sponsors will post a "Call for Events" if it brings them relevant inbound | Ask 20 sponsors in interviews, then test in MVP | ≥30% of active sponsors post one |
| H3 | Sponsors will search on Maple instead of waiting for inbound | Search logs | ≥40% of weekly active sponsors search |
| H4 | Structured audience data beats a PDF deck for sponsor decisions | Interviews + A/B test of profile layouts | Sponsors rank structured data as a top-2 decision input |
| H5 | Organizers will pay for Boost / search priority | Pre-sale + Boost purchases in MVP | ≥20 Boosts sold in the first 90 days |
| H6 | Sponsors will pay for Premium (filters, early access, PitchMail) | Pre-sale in Phase 0 | ≥5 sponsor pre-sales |
| H7 | Matched conversations lead to real deals | Deal-won prompt 30 days after the first reply | ≥10% of matched conversations report a deal |
| H8 | Users stay after the first deal | Cohort retention | ≥25% of deal-winners are active 60 days later |

## 7. Competitive feature comparison

| Capability | LinkedIn | SponsorMyEvent-style marketplaces | SponsorUnited | Event mgmt (Cvent, Bizzabo) | **Maple** |
|---|---|---|---|---|---|
| Professional profiles | ✅ | ⚠️ basic | ❌ | ❌ | ✅ |
| Social graph and feed | ✅ | ❌ | ❌ | ❌ | ✅ |
| Structured sponsorship packages | ❌ | ✅ | ⚠️ data only | ⚠️ post-deal | ✅ |
| Sponsor-side "Call for Events" | ❌ | ⚠️ rare | ❌ | ❌ | ✅ |
| Budget and intent signals | ❌ | ❌ | ✅ enterprise | ❌ | ✅ |
| Verified audience | ❌ | ❌ | ⚠️ | ✅ own events only | ✅ (phase 3) |
| Paid search priority | ⚠️ Promoted Jobs | ⚠️ featured listings | ❌ | ❌ | ✅ Boost |
| Deal pipeline / ROI reports | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| Affordable for small organizers | ✅ | ✅ | ❌ | ❌ | ✅ |

✅ = yes · ⚠️ = partial · ❌ = no. Assessment is based on public marketing pages. Verify during competitor trials.

## 8. Interview plan

**Target:** 20 organizers (a mix of O1–O4) and 20 sponsors (mostly S1 and S2) in Phase 0.

**Recruiting:** personal network, university clubs, hackathon organizers on Devpost/MLH, dev-rel communities, and LinkedIn outreach. Offer each participant a free year of Premium.

### Organizer script (30 min)
1. Tell me about your last event. How big was it, who attended, what did it cost?
2. Walk me through how you found sponsors for it, step by step.
3. How many companies did you contact? How many replied? How many said yes?
4. What was the most frustrating part?
5. How do you know which companies sponsor events like yours?
6. What do sponsors ask you for before they say yes?
7. What happens after the event? Do you report results to sponsors?
8. Have you paid for anything to find sponsors (tools, agencies, ads)? How much?
9. *(show concept)* What would you post on a platform like this? What would make you trust a sponsor you found here?
10. Would you pay $29/month for this? For a $19 one-week boost at the top of sponsor searches? Why or why not?

### Sponsor script (30 min)
1. What's your sponsorship budget and goal this year?
2. How do you find events today? How many pitches do you get per month?
3. What share of those pitches are relevant?
4. What data do you need before you commit? Who approves the spend?
5. How do you measure whether a sponsorship worked?
6. Have you missed good events because you didn't know about them?
7. *(show concept)* Would you post "we're looking for X events, $Y budget"? What would stop you?
8. Would boosted organizer listings bother you, or help you, if they were labeled and relevant?
9. Would you or your company pay $49/month for advanced filters, early access, and PitchMail?

**Synthesis:** tag every note by persona, pain, current workaround, and willingness to pay. Update §6 with results.

## 9. Open research questions

- Which side should we charge more? (Current bet: sponsors and teams pay more; organizers pay through Boosts.)
- Should budget bands be public, Premium-only, or hidden?
- Does an in-kind vs cash split need first-class support at MVP? (Current bet: yes, as a simple field.)
- Which second niche has the best sponsor density: university events, music and culture, or local community events?

## 10. Sources

- Eventeny, *Event sponsor trends: What brands want in 2025*: https://resources.eventeny.com/event-sponsor-trends-what-brands-want-in-2025
- SquadUp, *The untapped value of live event data for sponsorship ROI*: https://blog.squadup.com/the-untapped-value-of-live-event-data-for-sponsorship-roi
- Bridged, *How to prove event sponsorship ROI (and protect renewals)*: https://bridged.events/blog/sponsor-value/event-sponsorship-roi-2026/
- SponsorUnited: https://www.sponsorunited.com/
- SponsorMyEvent: https://sponsormyevent.com/
- SponsorPitch: https://sponsorpitch.com/
- Similarweb, SponsorMyEvent competitors: https://www.similarweb.com/website/sponsormyevent.com/competitors/
- Livestorm, *Event sponsorship guide* (sponsorship hubs list): https://livestorm.co/blog/event-sponsorship
- LinkedIn plan pricing (third-party guides): https://expandi.io/blog/linkedin-account-types/ · https://salesbread.com/how-much-does-linkedin-premium-cost/
