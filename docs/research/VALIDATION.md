# Maple: Phase 0 Validation Playbook

> Prove there's demand before writing any code. Four weeks in October 2026, run by the founders, using no-code tools.

| | |
|---|---|
| Duration | 4 weeks (October 2026) |
| Cost | Under $300 (tools) + founder time |
| Decision at the end | **Go / Iterate / Stop** (see §8) |
| Related | [PLAN.md](../business/PLAN.md) · [RESEARCH.md](RESEARCH.md) (hypotheses and interview scripts) · [DECISIONS.md](../product/DECISIONS.md) |

## Exit criteria

| Metric | Target |
|---|---|
| Interviews done | 40 (20 organizers, 20 sponsors) |
| Waitlist signups | ≥300 (with ≥50 sponsors) |
| Paid pre-sales or signed letters of intent | ≥15 |
| Sponsors who ask for an intro from Maple Weekly | ≥5 |
| Intros that lead to a real conversation | ≥5 |

---

## 0. Setup checklist (before day 1)

Keep it lazy: everything here except the Phase 0 website is no-code and can be thrown away later. The website itself stays frozen to Home, Privacy, 404, and the waitlist (D-021).

- [ ] **Name check.** Search trademarks for "Maple" in classes 9, 35, 42, and 45 (USPTO and the WIPO Global Brand Database). Other companies already use the name (see [DECISIONS.md](../product/DECISIONS.md#open-decisions-to-make-before-or-during-phase-0)). Keep 2–3 backup names ready.
- [ ] **Domain and social handles.** Claim the free domain from the GitHub Student Pack and put it on Cloudflare ([BUILD_PLAN.md Stage 0](../engineering/BUILD_PLAN.md#stage-0-accounts-company-and-domain)). Check social handles for the name you choose.
- [ ] **Landing page and waitlist.** The Phase 0 website on mapleapp.tech ([WEBSITE_PLAN §9](../engineering/WEBSITE_PLAN.md#9-step-by-step-build-plan), W2–W5), with the waitlist in one Supabase table, or a Tally form that feeds a Google Sheet as the fallback
- [ ] **Newsletter tool.** Beehiiv, Buttondown, or Substack, for Maple Weekly
- [ ] **Founder email** on the new domain
- [ ] **Booking link** (Cal.com or Calendly) with 30-minute slots
- [ ] **Stripe account** with a Payment Link for the founder pre-sale (§7)
- [ ] **Tracker spreadsheet** with the tabs in §2
- [ ] **Target lists:** 100 tech events and hackathons seeking sponsors, and 50 dev-rel or community managers

## 1. Week-by-week plan

| Week | Focus | Deliverables |
|---|---|---|
| **1** | Setup + outreach | Landing page live, target lists built, 60 outreach messages sent, 10 interviews booked |
| **2** | Interviews + first newsletter | 15 interviews done, Maple Weekly #1 sent to sponsors, landing copy tuned from interview language |
| **3** | Interviews + pre-sales | 15 interviews done, Maple Weekly #2, pre-sales open, first manual intros made |
| **4** | Close + decide | Last interviews, Maple Weekly #3–4, synthesis, **go/no-go meeting** |

## 2. Tracker (Google Sheet)

Use ISO dates (`YYYY-MM-DD`) in every tab.

**Tab `interviews`**
| id | date | side | persona | org / event | size | current method | top pain | pain 1–5 | spends today | WTP answer | would pre-pay | referrals | notes link |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I-001 | 2026-10-06 | organizer | O1 | Example Uni Hackathon | 300 | cold email | no sponsor contacts | 5 | $0 | $19 boost yes, $29/mo no | N | 2 | link |

Persona codes (O1–O4, S1–S4) are defined in [RESEARCH.md §5](RESEARCH.md#5-personas).

**Tab `concierge`** (intros made from Maple Weekly)
| intro id | date | event | organizer | sponsor company | sponsor contact | replied? | meeting? | deal? | value band |
|---|---|---|---|---|---|---|---|---|---|

**Tab `metrics`** (update every Friday)
| week | waitlist organizers | waitlist sponsors | interviews | pre-sales | LOIs | intros requested | intros → conversation |
|---|---|---|---|---|---|---|---|

## 3. Outreach templates

These messages ask for research, not a sale. Keep them short and personal.

**Organizer (email or LinkedIn DM)**
> Hi {name}, I saw {event} is coming up in {month}. Congrats! I'm researching how organizers find sponsors, because it seems much harder than it should be. Could I ask you 5 quick questions over a 20-minute call? Happy to share what I learn from other organizers too. {booking link}

**Sponsor / dev-rel (email or LinkedIn DM)**
> Hi {name}, you've sponsored events like {event}. I'm researching how sponsorship teams find the right events, and how many irrelevant pitches they sort through. Would you do a 20-minute call? In return, I'll send you a free weekly shortlist of vetted tech events looking for sponsors. {booking link}

**Follow-up (after 4 days, once only)**
> Quick nudge on this, {name}. Even 15 minutes would help a lot. {booking link}

**After each interview**
> Thanks, {name}! Two quick asks: (1) Is there anyone else who deals with sponsorship I should talk to? (2) Can I add you to the Maple beta list?

## 4. Interview note template

Copy this for every interview. Scripts are in [RESEARCH.md §8](RESEARCH.md#8-interview-plan).

```markdown
### I-0XX: {name}, {role} @ {org}. {YYYY-MM-DD}
- Side / persona: organizer | sponsor · O1–O4 | S1–S4
- Event or budget context:
- How they do it today (step by step):
- Top 3 pains (in their words):
  1.
  2.
  3.
- Pain score (1–5):
- What they spend today (money + hours):
- What they'd post on Maple:
- Reaction to Boost / search priority:
- Willingness to pay (exact words):
- Would pre-pay / sign LOI: Y / N
- Surprises (what we didn't expect):
- Hypotheses touched (H1–H8): supports / contradicts
- Referrals:
```

## 5. Landing page copy

**Hero**
> # Where events and sponsors find each other
> Maple is the professional network for event sponsorship. Organizers post what they offer. Sponsors post what they're looking for. Everyone finds the right match without cold emails.
>
> **[I'm organizing an event]**  **[I'm a sponsor]**

**How it works: organizers**
1. Create your event profile with your real audience data
2. Post a Sponsorship Package with your tiers
3. Get found by sponsors searching for your audience, then pitch them in one click

**How it works: sponsors**
1. Tell us who you want to reach and your budget range
2. Post a Call for Events, or search thousands of events with real filters
3. Get relevant pitches only, and track every partnership in one place

**FAQ**
- *Is it free?* Yes. Premium plans unlock extra reach and tools.
- *Who's on Maple?* We're starting with tech events, hackathons, and the companies that sponsor them.
- *When does it launch?* Private beta in early 2027. Join the waitlist for early access.

**Waitlist form fields** (the exact fields and checks are in [WEBSITE_PLAN §4.1](../engineering/WEBSITE_PLAN.md#41-home-))
- Role (Organizer / Sponsor), name, email, organization (optional)
- Organizers: expected attendance band (optional)
- Sponsors: typical budget per event band (optional)
- "Can we contact you for a 20-minute call?" (Y/N)

## 6. Maple Weekly (concierge newsletter template)

Send to sponsors every week. **Only list events whose organizers said yes.**

```markdown
Subject: Maple Weekly #{n}: {count} tech events looking for sponsors

Hi {first name},

Here are {count} hand-picked events looking for sponsors this month.
Reply with the numbers you're interested in and we'll introduce you directly.

| # | Event | Date | City / Online | Audience | Size | Looking for | Ask |
|---|-------|------|---------------|----------|------|-------------|-----|
| 1 | {name} | {date} | {city} | {e.g. student devs} | {300} | {cash + food} | {$2–5K} |
| … |

Know someone who should get this? Forward it. They can join at {link}.

— {founder name}, Maple
```

Log every intro in the `concierge` tab. That tab is the manual version of the product's core loop.

## 7. Pre-sale offers

**Founder plan (organizers and sponsors)**
- **$99 for the first year** of Premium (normally $29–49 a month)
- The price stays locked for as long as the subscription stays active
- First access to the private beta
- **Full refund if Maple isn't live by 2027-04-30.** State this clearly on the payment page.

**Sponsor letter of intent** (non-binding, when a sponsor won't pay yet)
> {Company} intends to use Maple to discover and evaluate event sponsorship opportunities during the private beta (Feb–Apr 2027), and to consider a paid plan if Maple delivers relevant events. This letter is non-binding.
> Name / Title / Date / Signature

## 8. Synthesis and go/no-go

**Synthesis (end of week 4)**
1. Tag every interview note with persona, pain, workaround, and willingness to pay
2. Score each hypothesis (H1–H8 in [RESEARCH.md §6](RESEARCH.md#6-hypotheses-to-validate)) as supported, mixed, or contradicted, with a count of interviews behind each score
3. Pull the top 10 quotes for each side, and reuse them in landing page and product copy
4. Update [DECISIONS.md](../product/DECISIONS.md): confirm or supersede D-002 (beachhead), D-011 (pricing), and D-012 (budget visibility)

**Decision**

| Outcome | When | Next step |
|---|---|---|
| **Go** | All exit criteria met, or all but one met with strong sponsor pull | Start the Phase 1 MVP build in November ([MVP.md](../product/MVP.md)) |
| **Iterate** | Organizers are in pain but sponsor interest is weak, or the wrong niche responded | Change the niche or the sponsor value proposition, then run 2 more weeks |
| **Stop / pivot** | Sponsors won't engage even with free, hand-picked intros | Reconsider the model, for example a workflow tool for organizers instead of a network |
