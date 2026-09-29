# Maple: Monetization Plan

> How Maple makes money: a commission on sponsorship deals paid through Maple, plus proposal credits for organizers. What we charge, why, and what we build to charge it.

| | |
|---|---|
| Last updated | 2026-09-29 |
| Status | Proposed as [D-029](../product/DECISIONS.md#d-029-monetization-commission-on-deals-paid-through-maple-plus-proposal-credits). Replaces the 2026-09-24 plan (Premium and Boost first, deal fee later; see git history). |
| Builds on | [D-003](../product/DECISIONS.md#d-003-treat-sponsors-as-the-scarce-side-free-for-them-during-beta) (sponsors are the scarce side) · [D-026](../product/DECISIONS.md#d-026-a-sponsorship-marketplace-like-upwork-and-wishket-posts-proposals-and-reviews) (a marketplace like Upwork and Wishket) |

> **Note on figures:** every price and rate here is a first price to test with real users. None is validated yet.

---

## 1. Summary

Maple has two revenue lines:

| Line | Who pays | What for | Role |
|---|---|---|---|
| **1. Commission on deals** | Organizers, out of their payout | A cash sponsorship paid through Maple | **The money-maker** |
| **2. Proposal credits** | Organizers, past a free allowance | Pitching sponsors beyond 3 proposals per event | **Spam control.** Small revenue. |

- **Sponsors never pay.** They see clean package prices and always send proposals free. They bring the money, and they are the scarce side (D-003).
- **The commission buys a service, not an introduction.** The sponsor pays Maple, and Maple releases the money to the organizer after the event, once the results report is in. The organizer is sure to get paid; the sponsor pays only for an event that happened. That hold is the reason both sides pay through Maple.
- **No Premium subscriptions, Boost, team seats, or ads.** Organizers run one or two events a year, so a monthly plan churns between events. The value is in the deal, so that's where we charge.
- **Nothing is charged until payments are live** (§6). Until then Maple is free, and the site says fees are coming (§6, Phase 1).

## 2. Commission on deals paid through Maple

| Item | Plan |
|---|---|
| **Fee** | **8%** of each cash deal, taken from the organizer's payout. Sponsors see clean package prices. |
| **Launch rate** | **5%** for the first 6 months after payments go live, and **0% for pilot events** such as the next HABSIDA hackathon. |
| **Minimum fee** | **₩10,000** per deal, so small deals still cover payment costs. |
| **In-kind deals** | **Free** (food, cloud credits, mentors, venue). No money moves, so there's nothing to take a cut of. Many hackathon deals are in-kind, so expect the commission to cover only part of the deals. |
| **Payment flow** | The sponsor pays Maple. Maple holds the money and pays the organizer after the event, when the results report is in. |

**Rules**
- **Fee base:** the cash part of the deal (the package price or the agreed amount). A mixed deal pays the fee on its cash part only.
- **Maple absorbs payment costs** out of the fee. The sponsor pays the package price and nothing more.
- **The rate is fixed when the deal is marked Won.** A new rate never applies to deals already Won, and we announce any change 60 days ahead.
- **Pilot events** are marked by Maple staff. Their deals pay 0% for that event.

**The flow**
1. The organizer marks the deal **Won** and confirms the cash amount and any in-kind items.
2. Maple sends the sponsor a payment request. The sponsor pays by card, bank transfer, or virtual account.
3. The money is held by our payment provider (§6, Phase 2), not in Maple's own account.
4. The event happens. The organizer submits the **results report**: attendance, photos, and what each sponsor got.
5. The sponsor has 7 days to raise a problem. If there's none, the organizer is paid the deal minus the fee, and the deal is **Completed**. Both sides can now review each other.
6. Cancelled event: the sponsor gets a full refund. Disputes go to Maple staff.

**Examples**

| Deal | Rate | Maple's fee | Organizer receives |
|---|---|---|---|
| HABSIDA Winter 2026, Gold ₩4,000,000 | 8% | ₩320,000 | ₩3,680,000 |
| Same deal at the launch rate | 5% | ₩200,000 | ₩3,800,000 |
| Same deal as a pilot event | 0% | ₩0 | ₩4,000,000 |
| A small ₩100,000 deal | 8% = ₩8,000, below the minimum | ₩10,000 | ₩90,000 |
| Cloud credits and pizza (in-kind) | – | ₩0 | – |

## 3. Proposal credits for organizers

| Item | Plan |
|---|---|
| **Free allowance** | **3 proposals per event.** This keeps student and community organizers on board. |
| **Extra proposals** | **₩5,000 each**, or **10 for ₩39,000** |
| **Fairness rule** | If the sponsor doesn't reply within 14 days, the proposal credit comes back |
| **Sponsors** | Always send proposals free, since they bring the money |

> The main job of this line is spam control: sponsors value receiving fewer, better pitches. It brings in only a little revenue; the commission is the money-maker.

**Rules**
- **What counts:** a proposal an organizer sends to a **sponsor post**, on behalf of one of their **event posts**. Each event post gets its own 3 free proposals.
- **What doesn't count:** proposals sponsors send to event posts (always free, never capped), and messages inside an existing conversation.
- **A reply** is any message from the sponsor in that proposal's conversation, or any status change (shortlisted, in talks, won, declined). A decline is a reply, so the credit doesn't come back.
- **Credits are bought on the website.** The apps show the balance but don't sell credits at first (§6, Phase 2).

## 4. Who pays for what

| What | Organizers | Sponsors |
|---|---|---|
| Posting, browsing, messaging, reviews, following | Free | Free |
| Proposals to sponsors | 3 free per event, then ₩5,000 each (10 for ₩39,000) | – |
| Proposals to events | – | **Free, unlimited** |
| Cash deal paid through Maple | 8% of the payout (5% for the first 6 months, 0% for pilot events, minimum ₩10,000) | Package price only |
| In-kind deal | Free | Free |

## 5. Keeping deals on Maple

A commission only works if the money goes through Maple. People who meet on a platform and then pay each other directly (leakage) killed Homejoy. What keeps deals here:

- **The hold is worth the fee.** Organizers are sure to get paid on time. Sponsors pay only after the results report, with one invoice and a proper tax invoice.
- **Only deals paid through Maple show as "Completed on Maple"** and earn reviews on both pages. In-kind deals record their items and count too.
- **The Terms ask that deals which start on Maple are paid through Maple** for 12 months (as Upwork does). We don't punish anyone; we make paying through Maple the easier path.
- **We measure it** (§8): the share of Won cash deals paid through Maple.

Lessons we keep from other marketplaces:

| Company | Lesson |
|---|---|
| **Upwork** | Charges freelancers a fee on work paid through the platform, and sells Connects that freelancers spend to send proposals. The same two lines as Maple. |
| **Wishket** | The fee comes with payment protection (escrow) that both sides value. |
| **Homejoy** | Customers rebooked cleaners directly after the first job. That leakage helped close it in 2015. |
| **Patreon** (2017) | Added a fee on the paying side, then reversed it within weeks. Don't charge sponsors. |
| **Unity** (2023) | A new fee that also hit existing customers was cancelled after a backlash. Never apply a fee to deals already Won. |

## 6. What we build

### Phase 1: Before payments (can start now, no money moves)

| # | Build | Why |
|---|---|---|
| 1 | **Update the pricing page, FAQs, and Terms.** Today the site says Maple doesn't take a cut. Replace it with: free during early access; a fee on deals paid through Maple and paid extra proposals are coming, announced 60 days ahead, never applied to deals already Won. | Never promise "no fees". |
| 2 | **Deal value on Won:** the cash amount plus in-kind items, and a fee preview for the organizer ("At launch: 5% = ₩200,000. You'd receive ₩3,800,000."). | The fee base, and GMV data before we charge. |
| 3 | **Pitch on behalf of an event:** when an organizer proposes to a sponsor post, they pick one of their event posts. The proposal shows "2 of 3 free proposals left for HABSIDA Hackathon Winter 2026". | The per-event allowance. Sponsors also see which event is pitched. |
| 4 | **The 14-day rule:** a daily job returns the allowance for proposals with no reply after 14 days. | Fairness, from day one. |
| 5 | **Results report:** after the event, the organizer submits attendance, photos, and what each sponsor got. Sponsors see it on the deal. | Releases the payout later. Useful to sponsors now. |
| 6 | **Pilot events:** a staff switch in `/admin` that sets an event's fee to 0%. | The next HABSIDA hackathon. |
| 7 | **Finance view in `/admin`:** Won cash GMV, fees at each rate, proposals per event, and replies within 14 days. | The §8 metrics. |

Database changes: `proposals` gets the event it pitches, the deal's cash amount, in-kind items, and the fee rate; `posts` gets a pilot flag; new `proposal_credits` (a ledger) and `results_reports` tables.

### Phase 2: Payments (after the outside work in §7)

| # | Build |
|---|---|
| 8 | **Payment provider:** a Korean PG (Toss Payments or PortOne) with its payout service (지급대행), so the provider holds the money, not Maple. Stripe doesn't open accounts for businesses registered in Korea (confirm before deciding), so this replaces D-017's Stripe plan. |
| 9 | **Sponsor checkout** for a Won deal: card, bank transfer, or virtual account. Webhooks update a `payments` table (pending → paid → held → released, or refunded). |
| 10 | **Organizer payout setup:** a bank account and identity or business check, including individual payees such as student clubs. |
| 11 | **Release:** results report in, 7 days with no dispute, then payout minus the fee (with the ₩10,000 minimum). |
| 12 | **Refunds, cancellations, and disputes,** with staff tools in `/admin`. |
| 13 | **Tax documents:** VAT on Maple's fee and on credits, with tax invoices (세금계산서) for businesses and cash receipts for others, issued through the PG. |
| 14 | **Buy credits:** ₩5,000 each or 10 for ₩39,000, on the website. Apps show the balance only, until we decide on in-app purchases. |

### Later, only if the data asks for it
- A lower rate for repeat deals with the same sponsor, if repeat deals start leaving (Upwork cut its fee on long relationships in 2016).
- Payments in other currencies, when Maple leaves Korea.
- Selling credits inside the apps (app-store billing for digital goods).

## 7. Outside work before Phase 2

| What | Who | Notes |
|---|---|---|
| Business registration (사업자등록) | Founders | Needed for a PG contract |
| PG contract and payout service | Founders | Toss Payments or PortOne. Ask about payout timing, fees, and individual payees. |
| Legal review | A lawyer | Moving other people's money (the Electronic Financial Transactions Act), prepaid credits and refunds (e-commerce law), and the new Terms |
| Tax setup | An accountant | VAT on fees and credits, and tax invoices |

## 8. Metrics

| Metric | Source | Why |
|---|---|---|
| Won cash deals and their value (GMV) per month | `proposals` | The commission's base |
| Share of Won cash deals paid through Maple | `payments` | Leakage |
| Fee revenue and effective rate | `payments` | Revenue |
| Share of deals that are in-kind | `proposals` | How much of the market the commission covers |
| Proposals per event, and share answered within 14 days | `proposals`, `proposal_credits` | Spam control working |
| Credits bought per month | `proposal_credits` | Credit revenue |

## 9. Illustrative revenue (our assumptions, not a forecast)

| Scenario | Math | Per month |
|---|---|---|
| Launch rate | 20 cash deals × ₩3,000,000 = ₩60M GMV, at 5% | ₩3.0M |
| Full rate | The same deals at 8% | ₩4.8M |
| Credits | 40 organizers buy one 10-pack at ₩39,000 | ₩1.56M |

## 10. Risks

| Risk | Warning sign | Response |
|---|---|---|
| Deals are paid outside Maple | Few Won cash deals reach `payments` | Make the hold more valuable. Keep reviews for deals paid through Maple. Don't punish anyone. |
| Most deals are in-kind | High in-kind share | Expected in hackathons. Grow cash deals with larger sponsors. |
| Student organizers can't pay for credits | Organizers stop at 3 proposals and churn | More free proposals for events that answer quickly, or for verified student clubs |
| PG approval or legal review is slow | Phase 2 slips | Phase 1 needs neither. Pilot events pay 0% anyway. |
| Backlash when fees start | Support tickets, complaints | 60 days' notice, launch rate, nothing retroactive, sponsors never charged |

## 11. Open questions

1. Which PG: Toss Payments or PortOne? It depends on payout service, fees, and support for individual payees.
2. How long should sponsors have to raise a problem after the results report: 7 days, or longer?
3. Should the "paid through Maple for 12 months" rule go in the Terms now, or when payments launch?
4. Does the 14-day rule return credits for proposals the sponsor saw but ignored? (This plan says yes: no reply means the credit comes back.)
