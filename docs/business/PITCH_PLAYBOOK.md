**Maple pitch playbook — HABSIDA Hackathon, September 25, 2026**

Prepared from the organizer's public guide, the participant-supplied Demo Day briefing image, the participant's account of the opening remarks, Maple's current project files, primary investor and accelerator guidance, and current competitor websites. Updated September 25, 2026. This is a recommended presentation plan, not a record of customer traction or a change to the product roadmap. The event's instructions take priority over generic fundraising templates.

**Build a four-minute pitch with eight slides and a 55-second product demonstration.** Rehearse to 3:50, leaving ten seconds of margin. The central theme is “Help the next hackathon happen”: the organizers' reported sponsorship difficulty inspired Maple, and their intention to run two hackathons a year suggests a concrete pilot to propose. Your speaking position is 17th of 18, as supplied by you.

The supplied Demo Day briefing specifies **four minutes of pitching and four minutes of Q&A**, superseding the earlier guide's timing for this plan. It lists PDF, Google Slide, or “Canvas” as formats, with one display for the presentation and a TV for an optional demo. Use PDF for a portable slide fallback; the image does not establish whether embedded video will play. The organizer's [detailed event guide](https://pickled-office-8f6.notion.site/HABSIDA-Hackathon-2026-Incheon-0de4cdcf8e7a83c9a4b201ae5c8388bb) supplies the previously published rubric: ten points each for Problem, Solution, Potential, and Presentation, and a required problem, solution, prototype demonstration, and growth potential. The briefing image does not provide a replacement rubric.

| Scoring category | What Maple needs to make easy to assess |
|---|---|
| Problem, 10 points | A named user, their current sponsorship process, and a specific cost or missed opportunity |
| Solution, 10 points | One understandable prototype journey from a relevant listing to a proposal and conversation |
| Potential, 10 points | Who joins first, why the other side participates, a plausible payment model, and the next expansion step |
| Presentation, 10 points | Clear language, readable slides, accurate claims, time control, and direct answers |

The following recommendations are my application of that rubric, not additional official judging criteria.

**Use the current product definition.** A clear opening description is: “Maple is a sponsorship marketplace where event organizers and sponsors publish what they need and offer, then connect through proposals.” For an even shorter spoken version: “Maple helps event organizers find sponsors looking for their kind of audience.”

Your old README and business plan describe a LinkedIn-style network. The accepted D-026 decision replaces the social feed with a marketplace, while D-028 allows the same organization to both run and sponsor events. Pitch the current product. The analogy “a marketplace for sponsorship” is sufficient; spending time explaining LinkedIn, Upwork, and Wishket together introduces unnecessary concepts. See [the current decisions](C:/Users/rashi/Desktop/maple/docs/product/DECISIONS.md:245).

**Keep the evidence levels separate.** I inspected the source and documents; I did not authenticate to the app or verify its complete workflow in a running environment. The configured public domain, mapleapp.tech, returned a DNS-resolution error in my browser check. That is a limitation of this check, not proof that every deployment is unavailable.

| Topic | What the files support | Safe pitch treatment |
|---|---|---|
| Core product | Source exists for organization pages, event and sponsor posts, filters, proposals, messages, status changes, and reviews | Demonstrate the subset you have rehearsed successfully |
| Demand | Desk research plus the participant's account of organizers describing sponsorship difficulty at the opening | A concrete problem observation; not a completed interview study or proof of willingness to pay |
| HABSIDA | D-028 names it as the first real organization; a seed script says its content has permission; the participant reports that its experience inspired Maple | Distinguish inspiration and example content from a separate pilot or customer commitment |
| Seed content | The script labels prices, budgets, audience shares, and the proposed Winter edition as placeholders | Clearly label these as illustrative; do not present them as transactions or demand |
| Pricing | Current page says free during early access; Premium and Boost are future options | Describe a revenue hypothesis, not existing paid revenue |
| Payments | Current product does not handle sponsorship payments | Do not promise escrow, guaranteed payouts, or transaction verification |
| Matching | SQL uses text relevance and weighted category, region, and audience overlap | Call it structured search and matching, not proprietary AI |
| Reviews | Participation is restricted to proposals marked completed | Describe deal-linked reviews; completion is not independent proof of payment or audience quality |
| Market size | Existing totals and projections explicitly contain assumptions | Keep them in backup material with assumptions visible |

Relevant files: [research status](C:/Users/rashi/Desktop/maple/docs/research/RESEARCH.md:8), [HABSIDA seed caveats](C:/Users/rashi/Desktop/maple/supabase/scripts/seed-habsida.mjs:1), [pricing implementation](C:/Users/rashi/Desktop/maple/client/src/features/site/screens/pricing-screen.tsx:1), [proposal actions](C:/Users/rashi/Desktop/maple/client/src/features/posts/mutations.ts:146), and [matching implementation](C:/Users/rashi/Desktop/maple/supabase/migrations/20260924090925_core.sql:601). There may be newer evidence outside the repository; use it if you can document it.

**Use the opening remarks as an origin story, with accurate attribution.** The participant recalls the organizer joking about difficulty finding sponsors, saying the organizers contributed their own resources, mentioning Florian Ludot's contribution, and expressing an intention to hold two hackathons every year. This is a participant recollection, not an independently verified transcript. Paraphrase it without inventing an exact quotation, amount, personal financial hardship, or Florian's motive.

The [public event page](https://luma.com/cwaixvls) lists UpperClass as a sponsor. Therefore, use “finding sponsors was difficult” rather than “this event had no sponsors.” Thank the organizers and supporters collectively. The problem is the effort of finding suitable support; the story should not erase contributions or portray the organizers as unsuccessful.

The evidence supports investigating a repeated sponsorship problem. It does not establish that discovery was the only obstacle: sponsor budgets, timing, audience fit, decision authority, and the proposed benefits may matter. Two events per year also raises a pricing question: occasional organizers may prefer event-based tools over a monthly subscription. This is a research implication, not a decision to change Maple's pricing.

**The eight-slide structure below fits the four-minute slot.** Timings total 230 seconds, leaving ten seconds for transitions or a slower delivery. Each slide should make one claim, supported by a visual or a small amount of evidence. The [complete rehearsal script](PITCH_SCRIPT_4MIN.md) follows this timing.

| Slide | Time | Suggested headline | Visual and content | Spoken purpose |
|---|---:|---|---|---|
| 1. Product and hook | 0:00–0:20 | Maple — Help the next hackathon happen | Product description; brief show of hands about another hackathon | Name the product and make the outcome personally relevant |
| 2. Origin and problem | 0:20–0:50 | This hackathon gave us our starting point | “Sponsorship was difficult” → “Two hackathons a year”; attributed paraphrase, no invented quotation | Explain the observation and why you decided to build |
| 3. Solution | 0:50–1:15 | Organizers need support. Sponsors need a reason to say yes. | Audience + support needed + sponsor benefit; Post → Propose → Discuss | Make both sides' value clear |
| 4. Demo | 1:15–2:10 | Imagine preparing the next HABSIDA hackathon | Clearly illustrative event and sponsor data; relevant listing → proposal → conversation | Show the prototype helping with the problem just described |
| 5. Evidence and learning | 2:10–2:35 | An observed problem. A prototype. A testable next step. | Observed / built / next test, with accurate labels | Separate the origin story from market validation |
| 6. Initial market and growth | 2:35–3:05 | Start with tech events and relevant sponsors in one community | Proposed Seoul/Incheon focus; direct sponsor recruitment; expansion after useful matches | Explain how the first matches happen |
| 7. Revenue hypothesis | 3:05–3:25 | Free early access. Test paid value next. | Future organizer tools and optional visibility; prices unvalidated | Explain who might pay and why |
| 8. Team and next step | 3:25–3:50 | Help the next hackathon happen | Team names and one true credential; proposed next-event pilot; contact | Return to the opening and request a later conversation |

The Seoul/Incheon focus is my recommendation based on your event access, not an already adopted geographic strategy. Your existing documents leave the initial region open. Substitute another region if you have stronger access there.

On slide 1, say what Maple does, then ask one easy question: “Quick show of hands: who would like another hackathon like this?” Raise your own hand, pause for two or three seconds, then continue. Participation is an invitation; a quiet response should not derail the pitch. This is an engagement device, not customer research or evidence of demand for Maple.

On slide 2, paraphrase the opening respectfully: “At the opening, we heard how difficult finding sponsors had been, and how the organizers contributed their own resources. They want to run two hackathons a year. That became our starting point.” Do not add email counts, losses, or a claim that the event would have been canceled.

On slide 3, highlight three pieces of information: audience, requested support, and what the sponsor gets. “Cash, venue, tools, or food” makes sponsorship concrete. Possible sponsor goals include product feedback, relevant brand exposure, and meeting potential hires; these are examples to validate with each sponsor. A list of twelve features makes the exchange harder to see.

On slide 5, describe the opening remarks as one concrete problem observation and show the prototype scope separately. Use “Pilot results” only if a real pilot happened. A statement such as “Four of six organizers described difficulty finding the right contact” needs six actual interviews and a record of the question. The audience's raised hands, a teammate's opinion, and a seeded account are different kinds of evidence.

On slide 6, an expansion sequence can be: local tech meetups and hackathons → university tech clubs → repeatable acquisition in another region. Explain the trigger for moving outward: reliable relevant matches in the first segment. Do not assume that more categories automatically improve the experience.

On slide 7, keep exact prices in Q&A unless tested. Your files propose $29 per month and a $19 seven-day Boost, but these are unpublished hypotheses. Selling priority requires enough relevant sponsor attention for priority to have value.

On slide 8, request a later conversation: “We'd like to explore a pilot for the next hackathon with the organizers after today.” This is a proposed pilot, not an announcement of a partnership. Put one genuine team qualification on the slide and include it verbally only if it fits. If you are not raising capital, a fundraising amount is unnecessary.

**Make the interaction warm and brief.** The opening show of hands is the only audience action needed. During the demo, invite the room to imagine the next event; do not ask a judge to operate the app, agree to sponsor, disclose a budget, or publicly accept a pilot. Leave a contact or QR code on the closing slide for later rather than spending pitch time asking everyone to scan it.

If naming Florian feels natural, an optional sentence is: “The organizer also mentioned Florian's contribution. That showed us how much this community already helps make events happen.” Replace some origin-story wording to keep time. Do not attribute a motive, ask him to confirm on stage, or suggest his contribution endorses Maple. Collective appreciation is sufficient and keeps the story focused on the user problem.

My recommended emotional arc is recognition → appreciation → possibility → a concrete next step. The story should move into the product by 0:50. [Techstars' pitch toolkit](https://toolkit.techstars.com/master-your-pitch) recommends an introduction relevant to the audience, a demonstration of the product's benefit, and a specific closing action. The HABSIDA story and proposed interaction are my application of that advice; they are not proven ways to improve judging scores.

**Make the demonstration a small story with a visible result.** Use one event and one sponsor need. Start already signed in with the required screens loaded; authentication is not the benefit being evaluated. A practical 55-second sequence is:

1. Spend twelve seconds showing the illustrative next event's audience, requested support, and sponsor benefit. Do not imply its date or package is confirmed.
2. Spend eight seconds showing a relevant sponsor request or the filter that finds the event.
3. Spend fifteen seconds showing a prepared proposal and its submission in a test environment.
4. Spend fifteen seconds showing the received proposal and conversation using a second preconfigured session or a prepared capture.
5. Use the final five seconds to explain the outcome: both sides can discuss a specific offer with its context attached.

With the two-display setup, leave a simple “Event → Proposal → Conversation” guide on the presentation display and use the TV for the product. Cue the TV once, then face the audience while a teammate operates it. Rehearse the actual arrangement. If only one display works, use the same sequence full-screen on that display; no story change is needed.

Use accounts controlled by your team for the demo. Avoid sending test proposals to real organizations or showing private conversations. A demonstration may use sample data as long as it is labeled. HABSIDA's real name and event facts do not turn estimated package prices into confirmed offers.

Keep reviews as an appendix screen. This event has not necessarily ended when you pitch, and the code applies an event-date restriction to completion. Do not force the current event into a completed state to demonstrate trust. A labeled sample of a previously completed interaction can explain the future step.

Prepare a short local screen recording and three screenshots as backups, subject to event rules. Introduce a recording as a recording of the prototype. If a live screen stalls, switch promptly instead of debugging on stage. A local frontend can still depend on remote backend services, so it is not automatically an offline demo. Test the full path on the actual presentation setup and check the QR destination on another device.

**Your 17th position calls for clear contrasts and disciplined pacing.** I am not claiming that a specific serial position predicts your score; fatigue, breaks, scoring procedures, and previous presentations are unknown. The practical implication is to reduce the effort required to understand and remember Maple.

- Give the product name and function in the opening sentence. Begin with a recognizable sponsorship situation.
- Use the same event example throughout, so the judges do not need to learn a new scenario on each slide.
- Show a visual change: information scattered across outreach becomes one structured opportunity and a concrete proposal.
- Choose three facts to leave behind: who has the problem, what the prototype enables, and who the first pilot is for.
- Avoid apologies for your slot, jokes about everyone being tired, and comments about competing teams.
- Listen to earlier Q&A for repeated concerns. Prepare a direct answer without rewriting your whole presentation at the last moment.
- Memorize the opening, demo transitions, and close. Keep the rest natural and simple.
- Put the product outcome and pilot request on the final slide and leave it visible during Q&A.

**Prepare for the judges through their relevant experience, without guessing their personal preferences.** The professional backgrounds below are summarized from the organizer's guide; the question prompts are my inferences for preparation, not statements of how they will score you.

| Judge | Relevant published background | A useful question to rehearse |
|---|---|---|
| Florian Ludot | Dev Korea founder; software and developer-community experience | “Why would a busy organizer or sponsor add Maple to the tools they already use?” |
| Casimir Agossou | Acafo founder; international talent, career support, and community work in Korea | “Which precise users have you spoken with, and what did you learn?” |
| Andrey Li | DOM and SYNTERA; Korean ventures, real-estate services, and mobile applications | “How do you get the first organizations in Korea, and what creates trust?” |
| Mark Balneger | Commercial strategy and monetization at UpperClass; community business experience | “Who pays, what measurable value do they receive, and why will they return?” |
| Juan Medrano | Perception engineering, deployed robotics systems, and technical leadership | “Which parts work now, what is simulated, and what happens when a dependency fails?” |

The [official profiles](https://pickled-office-8f6.notion.site/HABSIDA-Hackathon-2026-Incheon-0de4cdcf8e7a83c9a4b201ae5c8388bb) are a better identity match than same-name search results. [Dev Korea](https://dev-korea.com/), [Acafo](https://acafo.io/), and [UpperClass](https://upperclass.app/about) also provide first-party context. Do not imply that these companies endorse Maple because their founders are judges.

**Use the four-minute Q&A to answer directly.** Start with the answer, add the best evidence, then state the unresolved part or next test. Aim for roughly 15–30 seconds for the initial answer and let the judge guide follow-up. Prepare most carefully for the gap between a compelling local story and a viable marketplace.

| Question | Strong, honest answer direction |
|---|---|
| Was the problem discovery, or simply no sponsor budget? | “We do not know yet. The opening gave us a problem to investigate. Our pilot will test whether relevant sponsors with current interest can be found and whether the offers fit; Maple cannot create a budget that does not exist.” |
| Is one organizer's story market validation? | “It explains our starting point. We still need independent organizer and sponsor conversations, real proposals, and repeat use to test demand.” |
| Why not LinkedIn? | “Maple structures the event's audience, support request, benefits, and proposal workflow. We still need to prove that this reduces work enough for people to adopt it.” |
| Why not SponsorMyEvent or SponsorPitch? | “They already address sponsorship discovery. Our initial bet is a focused local tech-event community and current needs from both sides. Our pilot has to demonstrate a practical advantage.” |
| How do you get both sides? | “We will recruit a small group of sponsors with current criteria, curate matching events, and assist the first introductions. Broad self-service acquisition comes after that works.” |
| Who will pay? | “Early access is free. Organizer tools and optional visibility are our initial payment hypotheses. We have not yet established willingness to pay.” |
| Have you closed sponsorship deals? | Give the actual number. If none are documented, say so and distinguish code, signups, interest, proposals, and completed deals. |
| Is HABSIDA a customer? | Explain the precise relationship and permission you have. An example listing is not a paying customer or a signed pilot. |
| Why would users return after meeting? | “Reusable event information, proposal history, and deal-linked reviews may provide continuing value. Repeat participation is something our pilot must test.” |
| What stops a larger company copying you? | “The feature set is copyable. Our possible long-term advantage is a concentrated active network and useful history. We have not established that advantage yet.” |
| Are the reviews verified? | “They are restricted to participants in proposals marked completed. That does not independently verify payment or attendance.” |
| Does AI do the matching? | “The current implementation uses structured filters and weighted relevance. We can assess more advanced matching once we have enough real usage data.” |
| What is your biggest risk? | “Getting enough relevant, active sponsors. More organizer listings alone do not solve that.” |
| What happens next? | Describe a small pilot, one owner, a timeframe, and success/failure criteria. Do not promise every roadmap feature. |

**Treat competition as a question of adoption.** [SponsorMyEvent](https://sponsormyevent.com/) already offers event sponsorship discovery. [SponsorPitch](https://sponsorpitch.com/) advertises sponsorship data, decision-maker contacts, and a pitch-board marketplace. Maple's older comparison table understates that overlap. Neither the presence of competitors nor their marketing pages establish that Maple will succeed or fail.

For your appendix, compare four alternatives: personal relationships and outreach, a general professional network, existing sponsorship tools, and Maple's proposed initial experience. Compare the job the user is trying to complete, not a convenient list of features where only Maple receives checkmarks. Evidence you eventually want is a faster relevant response, lower manual effort, better fit, or more completed sponsorships. These are future measurement goals, not current claims.

**Present market potential with assumptions visible.** Your market document's roughly $1.7B revenue opportunity assumes two million paying organizers at $480 per year and 500,000 paying sponsors at $1,500 per year. The arithmetic is coherent; the customer counts, willingness to pay, and reach remain unvalidated. A broad events-industry spending estimate is not Maple's own revenue opportunity. See [market assumptions](C:/Users/rashi/Desktop/maple/docs/business/MARKET.md:36).

For this competition, prioritize a reachable first segment and a sensible expansion path. Keep a bottom-up model in the appendix: reachable organizations × plausible paid adoption × annual price. If discussing future payment fees, separately model sponsorship value processed × fee, and label it as a future business line. Do not add transaction volume to subscription revenue as if both were revenue.

An illustrative calculation, not a forecast: 200 paying organizers × $29/month × 12 = $69,600 annual subscription revenue. It immediately raises the useful questions: how will you find 200 paying organizations, what fraction of active organizations will pay, and will they stay subscribed between events? If paid promotions are included in total revenue, distinguish them from recurring subscription revenue. [a16z's metrics guidance](https://a16z.com/16-startup-metrics/) explains why revenue, transaction volume, acquisition costs, and engagement require clear definitions.

**Use the next pilot to test marketplace activity.** My suggested starting target is ten organizers and five sponsors in one accessible segment over 30 days. These numbers are operational suggestions, not established benchmarks. Start by learning sponsors' current audience, support type, location, timing, and decision requirements; then curate suitable event posts with organizer permission. Help the first introductions manually and record the work required.

Choose one primary learning goal: can Maple create relevant two-way sponsorship conversations? Your own decision D-004 already uses matched conversations. Define “relevant” before measuring it, for example both parties acknowledge a plausible audience and support fit. Keep demo traffic and team accounts out of the result.

| Measure | Useful definition |
|---|---|
| Activated sponsor | A sponsor with current criteria that reviewed at least one relevant opportunity |
| Relevant response rate | Eligible proposals receiving a substantive counterpart reply within a stated window |
| Time to first relevant reply | Elapsed time from a real proposal to a substantive reply; report nonresponses too |
| Matched conversations | Unique organizer–sponsor conversations in which both parties replied during the period |
| Agreed sponsorships | Agreements confirmed by the participants; distinguish these from completed events |
| Repeat intent and behavior | Whether a sponsor returns for another opportunity; intent alone is weaker evidence |

Define a review point in advance. If sponsors do not engage even with carefully selected events and assisted onboarding, investigate fit, timing, or the value proposition before adding more features. Marketplace research emphasizes successful matching and useful depth, not raw listing totals. [a16z: marketplace metrics](https://a16z.com/13-metrics-for-marketplace-companies/). Starting with a narrow segment and deliberately recruiting the harder side are established options in [NFX's marketplace playbook](https://www.nfx.com/post/19-marketplace-tactics-for-overcoming-the-chicken-or-egg-problem); the appropriate constrained side must still be tested for Maple.

**Design the slides for a room, and rehearse the spoken explanation.** Use one large headline, one main visual, and only the supporting words needed. A practical starting point is roughly 36–44-point titles and 28–32-point body text, then test on the actual screen; these are my design defaults. Keep source notes in the footer and full references in the appendix. Crop screenshots around the relevant action and enlarge important values. Use clear contrast and consistent Maple colors. Avoid screenshots of entire desktop pages with unreadable labels.

Use factual headlines when you have evidence, such as “Three sponsors requested an introduction,” rather than topic labels such as “Traction.” Until that fact exists, use an accurate title such as “Our next test: relevant sponsor conversations.” Differentiate “built,” “observed,” and “planned” throughout.

[YC's slide-design advice](https://www.ycombinator.com/blog/how-to-design-a-better-pitch-deck) prioritizes legibility, simplicity, and obvious meaning. [Guy Kawasaki's 10/20/30 rule](https://guykawasaki.com/the_102030_rule/) is a useful reminder to keep presentations concise and readable; it is not the format for this four-minute competition. The organizer's requirements determine your timing.

Choose one primary speaker if the rules allow it, with a teammate operating the demo if helpful. Do not force handoffs merely to give everyone equal stage time. Record a rehearsal, review it, and practice with someone unfamiliar with Maple. Ask them to explain what it does, for whom, and why the first users would adopt it. These practices align with [YC's Demo Day guide](https://www.ycombinator.com/blog/guide-to-demo-day-pitches/). Your aim is clear delivery with enough pauses to understand the product.

**Keep six backup slides ready.** They should cover competitor positioning, technical architecture and working scope, primary evidence with dates and sample sizes, pricing assumptions and costs, trust limitations, and the 30-day pilot. They support answers; they are not extra slides to rush through during the pitch.

**A reusable pitch framework applies beyond Maple.** A startup pitch should connect a specific customer need to a plausible business, with evidence appropriate to its stage. For a longer investor conversation, a practical sequence is: company description; customer problem; product and demo; evidence; why now; market; revenue model; customer acquisition; alternatives and differentiation; team; milestones and resources; and the ask. The sequence can change when unusually strong evidence or team experience deserves early attention. [Sequoia's framework](https://sequoiacap.com/article/writing-a-business-plan) provides a useful set of business questions, while [Michael Seibel's pitch guidance](https://www.ycombinator.com/blog/how-to-pitch-your-company/) emphasizes a plain description, progress, insight, and a clear request.

At idea stage, present observations and the experiment that could disprove the idea. With a prototype, show feasibility and usability evidence. With customers, present usage, repeat behavior, economics, and sales evidence. A live presentation needs visual support and room for questions; a deck sent ahead needs enough explanation to stand on its own. A customer pitch focuses on their outcome, implementation, proof, and next action. A competition pitch should make every published scoring category easy to judge.

No single slide count or story formula guarantees funding or a prize. Established founders' successful decks are selected examples, not evidence that their design caused the result. Fundraising platform reports also describe selected populations and historical conditions. For example, [DocSend's December 2024 research announcement](https://www.prnewswire.com/news-releases/vcs-prioritize-people-in-an-ai-heavy-landscape-according-to-new-dropbox-docsend-report-302334444.html) describes more than 400 early-stage fundraising startups; those findings do not establish how this five-person hackathon panel will score Maple. Current [Techstars guidance](https://www.techstars.com/blog/founder-advice/why-most-pitch-decks-dont-work-and-how-to-make-sure-yours-does), published May 2026, similarly stresses developing the story before mechanically filling a deck template.

**Use the final hour to remove uncertainty.** This is a suggested sequence if the pitch is imminent; shorten or expand it to match the time you have.

| Minutes | Work |
|---|---|
| 0–10 | Set a four-minute timer and prepare the requested submission format. Decide the three facts the audience should retain. |
| 10–25 | Build or simplify the eight slides. Remove unsupported statistics and mark examples and roadmap items. |
| 25–35 | Rehearse the prototype journey. Save a permitted recording and screenshots. Check the final link. |
| 35–45 | Run one timed rehearsal, then one rehearsal with a simulated demo failure. |
| 45–55 | Have teammates ask the hardest customer, competition, revenue, and technical questions. |
| 55–60 | Export the final deck, check it on the presentation machine, and stop making structural changes. |

If time is available before the presentation, one candid conversation with an actual organizer and one actual sponsor may improve the problem slide more than additional visual polish. Keep those observations small and accurate; do not generalize two conversations into market validation.

**Research boundaries.** Sources were checked on September 25, 2026. The supplied Demo Day image establishes the working four-minute pitch and four-minute Q&A brief. The organizer guide supplies the earlier rubric and professional biographies. The sponsorship story and intention to run two hackathons yearly come from the participant's recollection, not a transcript or independent web verification. See the [field observation record](../research/RESEARCH.md). Investor and accelerator sources supply general advice, not causal proof. Competitor pages establish advertised capabilities, not independently measured performance. Project files establish the current design and code present in the repository, not deployment health, customer adoption, or revenue. An older Eventeny link in the repository redirects to a revised article, and I could not verify its quoted 24.6% sponsorship statistic on the currently linked Bizzabo page; I therefore recommend omitting that statistic until the original dated report is available. No source justifies calling Maple's untested demand, pricing, or future network advantage proven.
