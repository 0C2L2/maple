# Maple: Monetization Plan

> How Maple makes money, in what order, and whether waiting to take a cut of deals puts the market at risk.

| | |
|---|---|
| Last updated | 2026-09-24 |
| Status | Proposal. Adopting it needs a new decision, D-029 (see [§11](#11-decisions-this-needs)). |
| Builds on | [D-003](../product/DECISIONS.md#d-003-treat-sponsors-as-the-scarce-side-free-for-them-during-beta), [D-005](../product/DECISIONS.md#d-005-boost-rules), [D-010](../product/DECISIONS.md#d-010-no-transaction-fee-until-maple-deals), [D-011](../product/DECISIONS.md#d-011-pricing-is-29--49--99--179-per-month), D-026 · [MARKET.md §6](MARKET.md#6-pricing) · [PLAN.md §5](PLAN.md#5-monetization-summary) |

> **Note on figures:** prices and thresholds are hypotheses to test with real users. Facts about other companies come from public reporting. Re-check them before they go into a deck.

---

## 1. Summary

- **Don't launch every revenue line at once.** Start with nothing switched on. Add each line only when a trigger (§8) shows it will work, in this order:
  1. Organizer Premium and Boost
  2. Premium Sponsor
  3. Maple Pay, an opt-in fee on deals paid through Maple
  4. Team plans
- **Organizers pay first. Sponsors stay free** until the marketplace has enough of them (D-003).
- **Will a later deal fee cost us the market? Not if we do three things now:**
  1. Never promise "no fees, ever".
  2. Make Maple the place where deals are recorded (won → completed → reviews), so payment later attaches to a step people already take.
  3. Charge the fee for a service (getting paid safely, one invoice), not as a toll on introductions.
- **The bigger risk is the opposite one: charging before the market is full.** New marketplaces die of empty markets more often than of fees added later.
- **One change to current decisions:** D-010 waits for "Maple Deals, Phase 4 (2028+)". That is too late and too vague for an Upwork-style marketplace (D-026). Replace the date with triggers (§8), and prepare now, which costs almost nothing (§5.3).

## 2. Where Maple starts

| Fact | What it means for money |
|---|---|
| Few users yet. The loop (post → proposal → won → completed → review) is new. | There's nothing to charge for until the loop runs. |
| Sponsors are scarce and organizers are plentiful (D-003). | Charge organizers. Keep sponsors free. |
| Beachhead deals are $500 – $50K ([MARKET §4](MARKET.md#4-segments-and-beachhead)). | One deal is worth far more than a month of Premium, so a fee on it is a strong reason to go around Maple. |
| Sponsors often fund the same event every year. | Repeat deals are the easiest ones to take off-platform. |
| Proposals already track status (`won`, `completed`), an optional tier, and an optional `amount_cents`. Reviews need a completed deal. | The data a deal fee needs already exists. Only the payment is missing. |
| Premium and Boost are decided (D-005, D-011) but not built. There are no `subscriptions` or `boosts` tables yet. | Stage 1 is a known build ([BUILD_PLAN Stage 7](../engineering/BUILD_PLAN.md#stage-7-payments-premium-boost-web)). |

## 3. The four ways marketplaces charge

| Model | Examples | What users pay for | Works when | Main risk |
|---|---|---|---|---|
| **Subscription** | LinkedIn Premium | Access, insight, volume | Users come back often | Churn between needs (events are seasonal) |
| **Visibility** (ads, boosts) | LinkedIn Jobs, Fiverr Promoted Gigs | Attention | There's traffic to sell | Worth nothing without traffic. Hurts trust if it isn't labeled. |
| **Pay per lead or per application** | Thumbtack, Angi, Upwork Connects | The chance to win work | Supply competes for demand | Feels like paying for maybe nothing |
| **Commission on the deal** | Upwork, Fiverr, Etsy, Airbnb | The transaction | Money flows through the platform, and the platform adds value to each deal | **Leakage:** people meet on the platform, then pay outside it |

Maple sits between LinkedIn, which charges for access, and Upwork, which charges on each deal. Lead-gen marketplaces like Thumbtack and Angi charge for leads instead of taking a commission. Their jobs are easy to pay for outside the platform, and that's the same reason Maple should wait before charging on deals.

## 4. How comparable companies did it

| Company | First revenue | Added later | Lesson for Maple |
|---|---|---|---|
| **Fiverr** | 20% of every gig from launch (2010) | Years later: a buyer service fee, seller subscriptions, promoted gigs | A fee from day one works when the platform handles payment from day one. |
| **Upwork** (oDesk, Elance) | A fee on work paid through the platform | 2016: a fee per client that dropped from 20% to 10% to 5% as billings with that client grew. 2023: a flat 10%. Connects: pay to apply. | They cut the fee on long relationships to keep repeat work on the platform. |
| **Wishket** | A fee on contracted projects, with payment protection (escrow) | – | The fee comes with a service both sides value. |
| **LinkedIn** | Free at launch (2003) | Premium, jobs, and ads about two years later. Hiring tools became its biggest line. | It never took a cut of the deals it created. It sold access and tools. |
| **Etsy** | A listing fee and a transaction fee from the start | Raised the transaction fee from 3.5% to 5% (2018), then to 6.5% (2022). Sellers held a strike in 2022. | On a busy marketplace, fee increases cause anger but rarely an exodus. |
| **Craigslist** | Free | Paid job posts in some cities, then a few more categories | Charging later works for a small, clearly scoped line. |
| **Patreon** | A fee on creators | 2017: added a fee on patrons (the paying side), then reversed it within weeks after a backlash | Don't add a sudden fee to the scarce side that pays. |
| **Unity** (not a marketplace) | Licenses | 2023: a new per-install fee that also hit existing games. Cancelled after a backlash. | Never apply a new fee retroactively. |
| **Homejoy** | A commission on cleanings | – | Customers rebooked cleaners directly after the first job. That leakage helped close it in 2015. |

**Takeaway:**
- The companies that charged on deals from day one also handled the payment from day one.
- Adding a fee later went fine when it was small, announced ahead, and came with value (Etsy, Craigslist, Upwork).
- It failed when it was sudden, hit the paying side, or applied retroactively (Patreon, Unity).
- Nobody made a commission stick on deals that could be paid without them (Homejoy).

## 5. The key question: will a later deal fee cost us the market?

### 5.1 The two risks, compared

| | Deal fee from day one | Deal fee added later |
|---|---|---|
| **What goes wrong** | Organizers and sponsors skip Maple while it's empty. Deals get reported as "closed elsewhere". We have to build payments before we have users. | Users feel a bait-and-switch. A free competitor could pull users away. Repeat deals already flow directly. |
| **How likely** | High. Every new marketplace fights for its first users. | Low. It rises only if we promise "free forever" or charge without adding value. |
| **How bad** | Fatal. No users means no marketplace. | Recoverable. A fee can be lowered, made optional, or paused. |
| **Can we reduce it?** | Barely. A fee is friction however it's framed. | Yes, with the steps in §5.3 and §5.4. |

**Verdict:** adding the fee later is the smaller risk, and the one we can control.

### 5.2 Why timing doesn't fix leakage

At a 5% fee, a $20K sponsorship gives both sides a $1,000 reason to pay by bank transfer instead. That's true on day one and on day 1,000. Charging from the start doesn't stop people from going around Maple. It just teaches them to do it from their first deal.

What keeps deals on the platform is what Maple does for both sides during the deal:

- **Organizers are sure to get paid, on time.** Maple holds the money until the event, then releases it.
- **Sponsors pay one vendor, Maple, with one invoice,** instead of onboarding every student club or meetup as a supplier. *This is a hypothesis to test in interviews. MARKET §4 assumes small tech deals skip procurement.*
- **Both sides get a verified "Completed on Maple" deal and review on their page.** Deals done elsewhere don't count toward the rating.
- **Tax and reporting records live in one place.**

If those services aren't worth the fee, no timing will save it. If they are, the fee works whenever it starts.

### 5.3 Protect the option now (almost free)

1. **Never write "free forever" or "no fees, ever"** on the site, in the Terms, on the pricing page, or in pre-sale emails. Say what's true:
   > *Maple is free during early access. Posting, messaging, and reviews stay free. If we add paid services, like getting paid through Maple, we'll tell you 60 days ahead, and they'll never apply to deals you've already made.*
2. **Founder pricing locks the Premium price only.** PLAN Phase 0 offers "$99/year, locked for life". Say in the offer that the lock covers Premium, not future services.
3. **Make recording deals a habit.** Won and Completed already exist.
   - When a deal is marked Won, ask for the final deal value (optional).
   - Keep the rule that reviews need a deal completed on Maple. It's the reason to record deals here.
4. **Measure leakage from day one:**
   - the share of Won proposals that reach Completed
   - the share of deals that have a value
   - the total value of Won deals per month (GMV)
   
   These numbers set the §8 triggers.
5. **Design Maple Pay as the next step after "Mark completed", not as a new toll.** Later, "Pay through Maple" appears on the same screen.

### 5.4 How to launch the fee when the time comes

- **Opt-in first:** "Get paid through Maple". Make it the default for new deals only after most deals already use it.
- **Take the fee from the organizer's payout,** not on top of the sponsor's price. Don't tax the scarce side (D-003).
- **Charge less on repeat deals** with the same sponsor, as Upwork did in 2016, and **cap the fee per deal.** Large and repeat deals are the ones most likely to leave.
- **Announce it 60 days ahead.** Never charge on deals already Won. Early users get a lower rate for 12 months.
- **Keep a free path.** Organizers who skip Maple Pay still get everything else. The fee buys a service. It never blocks the core loop.

## 6. The plan, stage by stage

### Stage 0: now until private beta. Free, and build the rails.
- **Goal:** users on both sides. Watch Matched Conversations per week (D-004), then Won and Completed deals.
- **Do:**
  - Use the §5.3 wording in the Terms, the `/pricing` placeholder (not linked, D-019), and any pre-sale emails.
  - Ask for an optional final deal value when a deal is marked Won.
  - Track `deal_won` and `deal_completed` (both already in `analytics.ts`) and monthly GMV.
  - Build Stripe, `subscriptions`, and `boosts` (BUILD_PLAN Stage 7), with prices hidden.
  - Optionally, pre-sell founder pricing ($99/year) to test willingness to pay.
- **Charge:** nothing.

### Stage 1 (v1.1): Organizer Premium and Boost
- **Turn on when all of these hold:**
  - ≥ 300 weekly active organizations
  - ≥ 50 proposals a week
  - common searches (a category plus a region) return 10+ posts. With fewer, you're already on page one, so Boost buys nothing.
- **Premium Organizer** costs $29/mo, or $24/mo billed annually (D-011). It includes:
  - more proposals a month than the free plan's 5
  - more open posts
  - who viewed your posts
  - sponsor budget bands (D-012)
  - Featured Proposal, which puts yours at the top of the sponsor's inbox (MVP §7.4)
  - 1 Boost credit a month
- **Boost** costs $19 for 7 days, with the D-005 rules. **Launch one Boost product, not three.** Add Post and Profile Boost (MVP §7.3) only if buyers ask.
- **Sell on the website only** with Stripe. The apps show Premium status without purchase buttons until in-app purchases ship (D-017, BUILD_PLAN 7.4).
- **Sponsors stay free.** Beta sponsors get Premium Sponsor free for 6 months (D-003).

### Stage 2: sponsor revenue
- **Turn on when** D-003's revisit condition holds: more than 1 active sponsor per 5 open event posts.
- **Premium Sponsor** costs $49/mo, or $39/mo billed annually. It includes saved searches with alerts, who viewed, advanced event filters, and early access to new posts ([MARKET §6.2](MARKET.md#62-maple-pricing-hypothesis-to-be-tested-in-phase-0)).
- **Never cap how many proposals a sponsor can send.** A sponsor's proposal is money coming into the marketplace.
- Beta sponsors' free 6 months end, and they're offered the paid plan.

### Stage 3: Maple Pay, an opt-in deal fee (replaces D-010's "Phase 4")
- **Turn on when all of these hold:**
  - ≥ 50 Won deals a month with a value, and ≥ $150K a month in recorded GMV. At about 4%, that's roughly $6K a month, enough to pay for building and supporting payments.
  - ≥ 60% of Won deals reach Completed on Maple, so the habit exists.
  - Users ask for it: sponsors want one invoice, or organizers report late or missing payments. Track this in support and interviews.
- **How it works:**
  1. The sponsor pays Maple against an invoice, by bank transfer or card.
  2. Maple holds the money until the event ends.
  3. After the deal is completed, or a set number of days pass without a dispute, the money goes to the organizer minus the fee.
- **Fee (hypothesis):**
  - 5% on the first deal with a sponsor, 3% on repeat deals with the same sponsor
  - capped at $1,500 per deal
  - the sponsor pays nothing extra by bank transfer; card processing costs are shown before paying
- **Build:**
  - Stripe Connect: organizer payout accounts and identity checks
  - invoices, holding and releasing money, refunds and disputes, tax forms
  - **Get legal advice before building** on holding funds and taxes in each country.
- **Apps:** payment for a real-world service isn't a digital upgrade, so app-store purchase rules shouldn't apply to it. Confirm against current App Store and Google Play rules.

### Stage 4: scale
- **Maple Pay as the default** for new deals, but only after more than half of deals already choose it. It stays optional otherwise.
- **Team plans:** Maple Scout at $99 per seat and Sponsor Suite at $179 per seat (D-011). These need several people per organization, but D-025 has one login per organization, so they need a new decision on members and roles.
- **Promoted posts (pay per click) and ads** ([MARKET §6.3](MARKET.md#63-pay-as-you-go-the-more-features-layer)), only once traffic is large.

### Only if the data asks for them
- **Proposal credits** (pay per proposal): only if organizers start spamming sponsors. Never for sponsors.
- **Paid verification on its own:** no. Include it in Premium. Verification is a trust feature, not a product.
- **Verified Audience:** after ticketing integrations exist (PLAN Phase 3).

## 7. Who pays for what

| What | Organizers | Sponsors | From stage |
|---|---|---|---|
| Posting, browsing, messaging, reviews, following | Free | Free | Always |
| Sending proposals | 5 a month free, unlimited with Premium | **Unlimited, free** (changes the MARKET §6.2 free plan) | 1 |
| Premium Organizer | $29/mo ($24/mo annual) | – | 1 |
| Boost | $19 / 7 days | Later | 1 |
| Premium Sponsor | – | $49/mo ($39/mo annual), free 6 months for beta sponsors | 2 |
| Maple Pay | 3–5% of the payout, capped at $1,500 | Free by bank transfer | 3 |
| Team seats | Scout, $99/seat | Sponsor Suite, $179/seat | 4 |

## 8. Triggers and metrics

| Metric | Where it comes from | Unlocks |
|---|---|---|
| Weekly active organizations | PostHog | Stage 1 at ≥ 300 |
| Proposals per week | `proposals` | Stage 1 at ≥ 50 |
| Posts per common search (category + region) | `search_posts` result counts | Boost at ≥ 10 |
| Active sponsors per open event post | `organizations`, `posts` | Stage 2 at > 1 per 5 (D-003) |
| Won deals per month with a value, and their total (GMV) | `proposals` (`won`, `amount_cents`) | Stage 3 at ≥ 50 deals and ≥ $150K |
| Share of Won deals that reach Completed | `proposals` | Stage 3 at ≥ 60% |
| Users asking to pay through Maple | Interviews, support | Stage 3 |
| Share of deals using Maple Pay | Payments | Stage 4 default at > 50% |

## 9. Illustrative revenue (our assumptions)

| Scenario | Math | Monthly revenue |
|---|---|---|
| Stage 1, early | 2,000 organizers × 3% on Premium × ~$27, plus 40 Boosts × $19 | ~$2.4K |
| Stage 3 | 100 Won deals × $4K average = $400K GMV. 70% use Maple Pay at ~4%. | ~$11K from fees alone |
| One deal against Premium | A $4K deal at 4% = $160 | About 5–6 months of Premium Organizer |

The deal fee is the biggest line in the long run. MARKET §3 estimates $300M a year of sponsorship at 3% ≈ $9M a year. That's why protecting the option now (§5.3) matters more than switching it on early.

## 10. Risks

| Risk | Warning sign | Response |
|---|---|---|
| Organizers won't pay for Premium | < 1% convert after 3 months | Lean on Boost and pay-per-use, or test a lower price ([MARKET §10](MARKET.md#10-market-risks)) |
| Boost feels pay-to-win | Complaints, fewer clicks on Boosted results | Keep the D-005 rules. Lower the cap if needed. |
| Deals move off the platform | Won → Completed rate falls | Make Maple Pay more useful and lower the repeat-deal fee. Don't punish anyone. |
| Backlash when the fee launches | Support tickets, churn | Opt-in, 60 days' notice, a founder rate, nothing retroactive |
| A free competitor | Users mention alternatives | Reviews and deal history live on Maple, and the core loop stays free |
| Legal and tax trouble with payments | Found in the legal review | Use Stripe Connect, and get advice before Stage 3 |
| Seasonal churn | Monthly churn > 6% | Annual plans and a pause option ([MARKET §8](MARKET.md#8-unit-economics-targets)) |

## 11. Decisions this needs

**Proposed D-029: Monetization order and triggers**
- Adopt the stages in §6 and the triggers in §8.
- **Updates D-010:** replace "until Maple Deals (Phase 4)" with the Stage 3 triggers. The fee starts opt-in and comes out of the organizer's payout.
- Sponsors are never capped on proposals. This changes the free plan in MARKET §6.2.
- Boost launches as one product: Search Boost at $19. This simplifies MVP §7.3.
- Never promise "no fees, ever". Use the wording in §5.3.
- **Keeps:** D-003, D-005, and D-011. Prices stay hypotheses.

**Open questions**
1. Do beachhead sponsors need to onboard each organizer as a vendor? This decides how much Maple Pay is worth to sponsors. Ask in interviews.
2. What's the real average deal value? The Won deal values from Stage 0 will answer it.
3. Legal: holding funds, taxes, and which countries Stage 3 launches in.
