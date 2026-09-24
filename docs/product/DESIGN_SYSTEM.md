# Maple: Design System

> How Maple looks and behaves on the web, iOS, and Android. Both developers, and their AI coding sessions, build UI **only** from these tokens and components.

| | |
|---|---|
| Status | **Proposed**: approve in [WEBSITE_PLAN §11](../engineering/WEBSITE_PLAN.md#11-open-questions-to-decide-before-coding) |
| Owner | The design-system owner in [OWNERSHIP §2](../engineering/OWNERSHIP.md#2-people-and-roles) (proposed: Dev B) |
| Implemented in | `client/src/constants/theme.ts` (tokens) and `client/src/ui/` (components) |
| Styling | React Native `StyleSheet` with the tokens below. No styling library (D-023, proposed). |
| Baseline | The tokens already in the Phase 0 draft. Changes from the draft are marked **(change)**. |

---

## 1. Principles

1. **One product everywhere.** The same components run on phones, desktop web, iOS, and Android. Layout adapts to screen **width**, not to platform.
2. **Calm and professional.** It should feel like a work tool (like LinkedIn), with warmth from the maple leaf.
3. **Flat.** Borders and tinted backgrounds separate things. Shadows appear only on floating layers (menus, modals, toasts).
4. **Accessible by default.** Every rule in §10 applies to every screen.
5. **Tokens only.** No hex colors, font sizes, or spacing numbers in components; everything comes from `theme.ts`.

## 2. Colors

Every color is a token with a light and a dark value. The app follows the device's light/dark setting.

| Token | Light | Dark | Use |
|---|---|---|---|
| `text` | `#1C1917` | `#FAFAF9` | Main text |
| `textSecondary` | `#57534E` | `#A8A29E` | Supporting text, labels, timestamps |
| `background` | `#FFFFFF` | `#121212` | Screen background |
| `backgroundElement` | `#F7F3EF` | `#1E1C1B` | Cards, tinted sections, inputs on tinted areas |
| `backgroundSelected` | `#EFE6DD` | `#2A2725` | Selected chips and rows, hover |
| `border` | `#E7E0D9` | `#2F2B28` | Dividers, card and input borders |
| `brand` | `#C8331B` | `#C8331B` | Primary buttons, active tab, brand accents |
| `onBrand` | `#FFFFFF` | `#FFFFFF` | Text and icons on `brand` |
| `link` | `#C8331B` | `#FF8A5C` | Links and brand-colored text |
| `danger` | `#B42318` | `#F97066` | Errors, destructive actions |
| `success` **(change: new)** | `#067647` | `#47CD89` | Verified badge, success messages |
| `premium` **(change: new)** | `#B54708` | `#FDB022` | Premium badge and icons |

**Contrast** (WCAG AA): body text ≥ 4.5:1, large text and icons ≥ 3:1.

| Pair | Contrast |
|---|---|
| White on `brand` | 5.3:1 ✓ |
| `brand` text on white | 5.3:1 ✓ |
| `link` (dark mode) on dark `background` | about 8:1 ✓ |
| `premium` (light mode) on white | 5.4:1 ✓ |

**Logo colors** (for illustrations only, never for text): approximately `#C0141C` → `#E8431A` → `#F47A1F` → `#FBB117`, from the leaf's red-to-gold gradient.

## 3. Typography

System fonts: San Francisco on iOS, Roboto on Android, and the system UI font on the web. There are no custom fonts, which keeps apps fast and small.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 38 / 44 | 700 | Landing hero headline only |
| `title` | 30 / 38 | 700 | Page title and landing section titles. One per screen. |
| `heading` | 20 / 28 | 700 | Section headings inside a page |
| `subheading` | 18 / 26 | 700 | Card titles, list group titles |
| `lead` | 19 / 29 | 400 | Intro paragraph under a title |
| `body` | 16 / 24 | 400 **(change: the draft uses 500)** | Default text |
| `bodyStrong` | 16 / 24 | 600 | Emphasis inside body text, names in lists |
| `small` | 14 / 20 | 400 | Secondary info, helper text |
| `smallStrong` | 14 / 20 | 600 | Field labels, chip labels |
| `caption` | 12 / 16 | 500 | Timestamps, badges, counters |
| `button` | 16 / 20 | 600 | Button labels |

**Rules**
- Sentence case everywhere, including buttons and titles: "Join the waitlist", not "Join The Waitlist".
- Reading text is at most 680 px wide (about 75 characters per line).
- Never set a fixed height on a text container, because text must grow when users enlarge it.

## 4. Spacing, radius, and sizes

**Spacing scale (use only these values):**

| Token | `half` | `one` | `two` | `three` | `four` | `five` | `six` |
|---|---|---|---|---|---|---|---|
| px | 2 | 4 | 8 | 16 | 24 | 32 | 64 |

| Thing | Value |
|---|---|
| Screen side padding | 16 on phones, 24 from 768 px up |
| Space between landing sections | 64 top and bottom |
| Gap between cards | 24 (16 on phones) |
| Radius: checkbox, small badges | 6 |
| Radius: inputs | 10 |
| Radius: cards, modals | 16 |
| Radius: buttons, chips, avatars | 999 (fully round) |
| Border | 1 px `border` (1.5 px on the checkbox) |
| **Minimum touch target** | **44 × 44 px** |
| Icons | 20 px inline, 24 px in tabs and buttons |
| Avatars | 32 (lists), 48 (cards), 96 (profile header) |

**Icons:** `expo-symbols` (SF Symbols on iOS, Material Symbols on Android and the web). Icons use the `text` or `textSecondary` color, and `brand` only when active.

## 5. Layout and breakpoints

| Name | Screen width | Layout |
|---|---|---|
| **Phone** | < 768 px | Single column, bottom tabs, 16 px side padding |
| **Desktop** | 768 – 1099 px | Left sidebar + main column (max 600 px) |
| **Wide** | ≥ 1100 px | Sidebar + main column 600 px + right panel 320 px |

| Content type | Max width |
|---|---|
| Landing and marketing sections | 1120 px, centered |
| Reading pages (legal, privacy, long text) | 680 px |
| Forms (waitlist, sign-in, create forms) | 560 px |
| App main column (feed, lists, detail pages) | 600 px |

**Rule:** switch layouts by width, never by `Platform.OS`. A wide iPad and a desktop browser get the same layout.

## 6. Components

Components live in `client/src/ui/`. If a component is missing, ask the design-system owner instead of making a local copy.

| Component | Variants and props | Rules |
|---|---|---|
| **Button** | `primary` (brand fill), `secondary` (outline), `text` (no border), `danger` (danger outline) · `loading`, `disabled` | Min height 44. Pressed: 70% opacity. Disabled: 50% opacity + `aria-disabled`. At most one `primary` per section. Labels are verbs ("Send pitch"). |
| **IconButton** | icon, `accessibilityLabel` (required) | 44 × 44 |
| **TextField** | label, value, helper text, error, keyboard type | The label sits **above** the field and is always visible; never use a placeholder as the label. The error shows below in `danger`, with `role="alert"`. |
| **TextArea** | TextField + character counter | Counter shows e.g. "120 / 300" |
| **ChoiceChips** | single choice among 2–6 options | Pills. Selected: `brand` border + `backgroundSelected`. `role="radio"` + **`aria-checked`**, inside `role="radiogroup"`. |
| **MultiChips** | multiple choice | Same look. `role="checkbox"` + **`aria-checked`**. |
| **Checkbox** | label, checked | 22 px box, radius 6, `role="checkbox"` + **`aria-checked`**. The whole row is tappable. |
| **Select** | long lists (categories, regions) | Opens a Sheet with search |
| **Card** | `plain` (border) · `tinted` (`backgroundElement`) | Radius 16, padding 24 (16 on phones) |
| **Badge** | `verified` (success check + "Verified"), `premium` (premium star + "Premium"), `boosted` ("Boosted"), `role` ("Organizer" / "Sponsor"), `status` (pitch statuses) | `caption` text. **`boosted` must always be visible on boosted items** (D-005). |
| **Avatar** | image or initials, size 32 / 48 / 96 | Round. The initials fallback uses `backgroundSelected`. |
| **Tabs** (in-page) | labels, active | Underline in `brand` under the active tab |
| **Modal / Sheet** | title, content, actions | Phones: bottom sheet. Desktop: centered modal, 560 px wide. |
| **Toast** | message, optional action | Bottom of the screen, 4 seconds. For confirmations only; form errors stay inline. |
| **EmptyState** | icon, title, one sentence, one action | Always suggests the next step |
| **Skeleton** | shape matching the content | Shown only if loading takes more than 300 ms |
| **ErrorState** | message, **Retry** | Plain language, with no error codes shown to users |
| **Paywall** | feature name, what you get, **See plans** | Lock icon. Links to `/pricing` (from stage 7). |

## 7. Navigation

| Where | Pattern |
|---|---|
| **Public website** | Header 60 px: logo + "Maple" wordmark on the left, main button on the right. Footer: legal links, contact email, ©. |
| **App, phone** | Bottom tabs: **Feed** (home), **Search** (search), **Pitches** (send), **Messages** (forum), **Me** (account_circle). Stack headers with a back button on detail screens. |
| **App, desktop** | Left sidebar with the same 5 items plus Notifications, Network, and a primary **Post** button |
| **Titles** | Every screen has exactly one title (`title` style) |

## 8. States

Every screen that loads data shows one of these:

| State | Shows |
|---|---|
| **Loading** | Skeleton (after 300 ms) |
| **Empty** | EmptyState with a next step, e.g. "No pitches yet. Browse opportunities" |
| **Error** | ErrorState with **Retry** |
| **Offline** | Toast: "You're offline. We'll retry when you're back." |
| **Submitting a form** | The button shows a loading state and is disabled. Errors appear inline next to the field, plus a summary at the top of long forms. |
| **Success** | A Toast for small actions. The next screen for big ones (e.g. publishing an opportunity opens it). |

## 9. Writing style

- Use the glossary terms exactly: Sponsorship Package, Call for Events, Quick Pitch, PitchMail, Boost ([README glossary](../../README.md#glossary)).
- Short sentences. Talk to the user as "you".
- Buttons are verbs: **Send pitch**, **Save**, **Join the waitlist**.
- Money: "$5K", "$1–5K". Numbers use thousands separators: "2,000 attendees".
- Dates: "Mar 14, 2027", formatted for the user's locale.
- Error messages say what happened and what to do next: "That code has expired. Send a new one."

## 10. Accessibility checklist (every component and screen)

- [ ] Every control has a visible label or an `accessibilityLabel` / `aria-label`.
- [ ] The role is correct: `button`, `link`, `radio`, `checkbox`, `heading`, `alert`…
- [ ] State is announced: **`aria-checked`**, `aria-selected`, `aria-expanded`, `aria-disabled`.
  - On React Native Web, use the `aria-*` props. The older `accessibilityState` isn't read by browsers.
- [ ] Contrast meets §2.
- [ ] Touch targets are ≥ 44 × 44 px.
- [ ] Keyboard focus is visible on the web, in a logical order.
- [ ] Text scales to 200% without being cut off.
- [ ] Images have alt text, or are marked decorative.
- [ ] Motion is minimal and respects the device's "reduce motion" setting.

## 11. Logo and images

- Logo files are in `client/assets/images/` (`logo.png`, `icon.png`, `favicon.png`). The original art is `maple-leaf-source.jpg`.
- Don't recolor, stretch, or rotate the leaf. Minimum size is 24 px. Keep clear space of half the logo's height around it.
- The link-preview image is `client/public/og.png` (1200 × 630).
- User photos are resized to at most 1600 px before upload.

## 12. Changing the design system

- Changes happen in a pull request that updates `theme.ts` and/or `src/ui/` **and** this document.
- The design-system owner **and** the other developer approve it ([OWNERSHIP §4](../engineering/OWNERSHIP.md#4-shared-areas-both-developers-review)).
- Never add one-off colors or sizes inside a feature. Add a token here first.
