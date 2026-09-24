// Seeds HABSIDA's organization page, its September hackathon (event post + showcase), the next edition, and its
// sponsor post. Published with HABSIDA's permission. Safe to re-run: every row has a fixed id and is upserted.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node supabase/scripts/seed-habsida.mjs
//
// The service-role key stays in this shell; it never goes into client/ (CLAUDE.md).
// HABSIDA_EMAIL is the login that owns the page (change it later in Supabase → Authentication).
//
// FACTS come from luma.com/cwaixvls and habsida.com: dates, venue, schedule outline, prizes, entry fee, judges,
// mentors, UpperClass as sponsor, 55 registered. Everything marked PLACEHOLDER is an estimate to confirm with
// HABSIDA before launch: package prices and slots, goal and needs amounts, audience shares, reach, use of funds,
// decision/report dates, payment terms, the sponsor-post budget, and the whole Winter edition.
import { readFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.HABSIDA_EMAIL ?? 'habsida@mapleapp.tech';
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const assets = new URL('../seed-assets/habsida/', import.meta.url);
const id6 = (n) => `6a3b0000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const EVENT_POST = id6(1);
const SPONSOR_POST = id6(2);
const SHOWCASE = id6(3);
const NEXT_EVENT = id6(4);

async function call(path, init = {}) {
  const res = await fetch(url + path, { ...init, headers: { ...headers, ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}

// The login that owns the page: reuse it if it already exists. With HABSIDA_PASSWORD set (in this shell only,
// never committed), that becomes its password; otherwise HABSIDA sets one with "Forgot password?" on /login.
async function ownerId() {
  const password = process.env.HABSIDA_PASSWORD;
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, email_confirm: true, ...(password && { password }) }),
  });
  if (res.ok) return (await res.json()).id;
  const { users } = await call('/auth/v1/admin/users?per_page=1000');
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`Couldn't create or find ${email}: ${res.status} ${await res.text()}`);
  if (password)
    await call(`/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  return user.id;
}

async function upload(bucket, path, body, type) {
  await call(`/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': type, 'x-upsert': 'true' },
    body,
  });
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

// One row per request: a bulk upsert needs every row to have the same keys.
async function upsert(table, rows) {
  for (const row of rows)
    await call(`/rest/v1/${table}?on_conflict=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
    });
}

// A plain A4 PDF (Helvetica) from lines of text; "# " lines are headings. Enough for a draft sponsorship deck.
function textPdf(title, lines) {
  const ascii = (t) =>
    t
      .replace(/₩/g, 'KRW ')
      .replace(/[–—]/g, '-')
      .replace(/[·•]/g, '-')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E]/g, '');
  const esc = (t) => ascii(t).replace(/[\\()]/g, (c) => `\\${c}`);
  const wrapped = lines.flatMap((line) => {
    if (!line || line.startsWith('# ')) return [line];
    const out = [];
    let current = '';
    for (const word of line.split(' ')) {
      if (`${current} ${word}`.trim().length > 92) {
        out.push(current);
        current = word;
      } else current = `${current} ${word}`.trim();
    }
    return [...out, current];
  });
  const pages = [];
  for (let i = 0; i < wrapped.length; i += 44) pages.push(wrapped.slice(i, i + 44));

  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
  const kids = [];
  pages.forEach((page, p) => {
    let y = p === 0 ? 740 : 790;
    let stream = p === 0 ? `BT /F2 20 Tf 50 790 Td (${esc(title)}) Tj ET\n` : '';
    for (const line of page) {
      const heading = line.startsWith('# ');
      stream += `BT /${heading ? 'F2 13' : 'F1 10.5'} Tf 50 ${y} Td (${esc(heading ? line.slice(2) : line)}) Tj ET\n`;
      y -= heading ? 20 : 15;
    }
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
    const content = objects.length;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${content} 0 R >>`);
    kids.push(`${objects.length} 0 R`);
  });
  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const at = Buffer.byteLength(pdf);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

const id = await ownerId();
const media = (file, type) => upload('org-media', `${id}/${file}`, readFileSync(new URL(file, assets)), type);
const logo = await media('logo.png', 'image/png');
const banner = await media('banner.jpg', 'image/jpeg');
const cover = await media('cover.jpg', 'image/jpeg');

await upsert('organizations', [
  {
    id,
    role: 'organizer', // runs hackathons and also sponsors other events (D-028)
    kind: 'company',
    handle: 'habsida',
    name: 'HABSIDA',
    tagline: 'International coding school in South Korea. "Habsida" means "Let’s do it!"',
    about:
      'HABSIDA is an international coding school headquartered in South Korea, founded by expats, with branches in Kazakhstan and Uzbekistan. It teaches Java, JavaScript, and UX/UI design online, helps foreigners build IT careers in Korea, and runs HABSIDA Space in Incheon: an offline hub for classes, mentoring, events, and community.',
    location: 'Incheon, South Korea',
    website: 'https://habsida.com',
    logo_url: logo,
    banner_url: banner,
    categories: ['hackathon', 'workshop'],
    regions: ['seoul', 'online'],
    audience_types: ['developers', 'students', 'designers'],
    gives: ['venue', 'mentors', 'speakers'],
  },
]);

const VENUE = 'HABSIDA Space, 5th floor, room 501, 429 Biryu-daero, Yeonsu-gu, Incheon, South Korea';
const hackathon = [
  'A two-day team competition focused on creating startup business projects: idea validation, product development, and pitch training.',
  'Who can join: students, working professionals, and freelancers. Developers, designers, project managers, marketers, and anyone interested in startups. Teams have 3–5 people; solo participants join a team during team formation.',
  'Prizes: 1st ₩1,500,000 · 2nd ₩700,000 · 3rd ₩300,000 (pool ₩2,500,000). Entry fee: ₩20,000 per person, 50% off for HABSIDA students.',
  'Registration and details: https://luma.com/cwaixvls',
].join('\n\n');

// FACTS (Luma): the schedule outline; the clock times are PLACEHOLDER estimates between 11:00 on day 1 and 15:00 on day 2.
const agenda = [
  { label: 'Day 1 · 11:00', value: 'Registration and check-in' },
  { label: 'Day 1 · 12:00', value: 'Idea pitching and team formation' },
  { label: 'Day 1 · 14:00', value: 'Lectures: lean startup, hypothesis validation, presenting' },
  { label: 'Day 1 · 17:00', value: 'Teamwork and overnight coding' },
  { label: 'Day 2 · 10:00', value: 'Final refinements' },
  { label: 'Day 2 · 13:00', value: 'Project pitches to the judges' },
  { label: 'Day 2 · 14:30', value: 'Awards ceremony' },
];

// FACTS (Luma): judges and mentors of the September edition.
const people = [
  { label: 'Florian Ludot', value: 'Judge · CEO and founder, Dev Korea' },
  { label: 'Casimir Agossou', value: 'Judge · Founder, Acafo' },
  { label: 'Andrey Li', value: 'Judge · Co-founder, DOM and SYNTERA' },
  { label: 'Mark Balneger', value: 'Judge · Chief Commercial Officer, UpperClass' },
  { label: 'Juan Medrano', value: 'Judge · Founder, GamiphyAI' },
  ...['Alex Kim', 'Sergey Lee', 'Vladimir Egay', 'Olivier Paredes', 'Nick Kim'].map((name) => ({ label: name, value: 'Mentor' })),
];

// PLACEHOLDER: the pitch numbers below are estimates for HABSIDA to confirm.
const pitch = {
  currency: 'KRW',
  needs: [
    '₩2,500,000 for the prize pool',
    'Food and drinks for about 60 people over two days',
    'Cloud credits or API access for the teams',
    'Mentors from your engineering team',
  ],
  deliverables: ['logo_site', 'logo_stage', 'logo_merch', 'booth', 'talk', 'judging', 'track_prize', 'recruiting', 'social_posts', 'swag'],
  exclusivity: 'One sponsor per category (for example, one cloud provider)',
  custom_packages: true,
  audience: [
    { label: 'Developers', value: '45%' },
    { label: 'Students', value: '35%' },
    { label: 'Designers and product people', value: '20%' },
    { label: 'International attendees', value: '70%' },
  ],
  reach: [
    { label: 'Instagram @habsida_en', value: '3,000+' },
    { label: 'HABSIDA students and alumni', value: '500+' },
    { label: 'Registered on Luma (September)', value: '55' },
  ],
  use_of_funds: [
    { label: 'Prize pool', value: '50%' },
    { label: 'Food and drinks', value: '25%' },
    { label: 'Venue, materials, and swag', value: '15%' },
    { label: 'Promotion', value: '10%' },
  ],
  past_sponsors: ['UpperClass'],
  languages: ['English'],
  payment_terms: 'Invoice from HABSIDA, paid by bank transfer within 14 days of signing. Prices exclude VAT.',
};

await upsert('posts', [
  {
    id: EVENT_POST,
    kind: 'event',
    owner_id: id,
    title: 'Habsida Hackathon 2026',
    body: hackathon,
    categories: ['hackathon'],
    regions: ['seoul'],
    audience_types: ['students', 'developers', 'designers', 'product', 'marketers'],
    attendance_band: 'under_100',
    budget_band: '1k_5k',
    supports: ['cash', 'food', 'credits', 'mentors', 'prizes'],
    benefits:
      'Meet developers, designers, and future founders from around the world who live in Korea, put your product in their hands for two days, and hire from the best teams.',
    starts_on: '2026-09-24',
    ends_on: '2026-09-25',
    city: 'Incheon',
    venue: VENUE,
    cover_url: cover,
    status: 'open',
    ...pitch,
    goal_cents: 5_000_000, // PLACEHOLDER
    registrations: 55,
    agenda,
    people,
    deadline: '2026-09-20', // PLACEHOLDER
    decision_by: '2026-09-21', // PLACEHOLDER
    report_by: '2026-10-09', // PLACEHOLDER
  },
  {
    id: NEXT_EVENT, // PLACEHOLDER: the whole Winter edition is a draft for HABSIDA to confirm
    kind: 'event',
    owner_id: id,
    title: 'HABSIDA Hackathon Winter 2026',
    body: [
      'The second HABSIDA Hackathon: two days at HABSIDA Space where international teams of developers, designers, and future founders build startup products from idea to pitch.',
      'Same format as the September edition, which filled up with a waitlist: idea pitching and team formation, lectures on lean startup and pitching, an overnight build, and final pitches to a panel of founders and investors.',
      'Judges and mentors will be announced after sponsors are confirmed. Sponsors can bring their own judge and a prize track.',
    ].join('\n\n'),
    categories: ['hackathon'],
    regions: ['seoul'],
    audience_types: ['developers', 'students', 'designers', 'founders'],
    attendance_band: '100_500',
    budget_band: '5k_25k',
    supports: ['cash', 'food', 'credits', 'mentors', 'prizes'],
    benefits:
      'Reach 100+ developers, designers, and future founders in Korea, most of them international, and meet them in person for two days.',
    starts_on: '2026-12-12',
    ends_on: '2026-12-13',
    city: 'Incheon',
    venue: VENUE,
    cover_url: cover,
    status: 'open',
    ...pitch,
    goal_cents: 8_000_000,
    needs: ['₩4,000,000 for the prize pool', 'Food and drinks for about 100 people over two days', 'Cloud credits or API access for the teams', 'Two judges or mentors from your team'],
    past_stats: [
      { label: 'Registered for the September edition', value: '55 (full)' },
      { label: 'September prize pool', value: '₩2,500,000' },
      { label: 'September judges and mentors', value: '10' },
    ],
    agenda: agenda.map((row) => ({ ...row, label: row.label.replace('Day 1 · 11:00', 'Day 1 · 10:00') })),
    people: [],
    deadline: '2026-11-20',
    decision_by: '2026-11-27',
    report_by: '2026-12-27',
  },
  {
    id: SPONSOR_POST,
    kind: 'sponsor',
    owner_id: id,
    title: 'HABSIDA wants to sponsor developer and student hackathons',
    body: 'After running Habsida Hackathon 2026, HABSIDA wants to back other hackathons and developer events in Korea and online. We can bring mentors from our school, speakers for talks and workshops, and our space in Incheon for events. Tell us about your event and what you need.',
    categories: ['hackathon'],
    regions: ['seoul', 'online'],
    audience_types: ['developers', 'students'],
    attendance_band: '100_500',
    supports: ['mentors', 'speakers', 'venue'],
    benefits:
      'Visibility with developers and students, a short talk or booth about HABSIDA’s courses, and meeting people who want to build an IT career in Korea.',
    status: 'open',
    currency: 'KRW',
    goal_cents: 1_000_000, // PLACEHOLDER budget per event, on top of mentors, speakers, and venue
    needs: ['Mentors from HABSIDA’s teaching team', 'Speakers for a talk or workshop', 'HABSIDA Space in Incheon as a venue (about 60 people)'],
    deliverables: ['logo_site', 'booth', 'talk', 'social_posts', 'recruiting'],
    languages: ['English', 'Korean'],
  },
]);

// PLACEHOLDER: package prices, slots, and contents.
const tiers = (postId, base, prices, slots) => [
  {
    id: id6(base + 1),
    post_id: postId,
    position: 0,
    name: 'Gold',
    price_cents: prices[0],
    slots: slots[0],
    deliverables: ['logo_site', 'logo_stage', 'logo_merch', 'booth', 'talk', 'judging', 'track_prize', 'recruiting', 'social_posts'],
    benefits: 'Your own prize track and a 10-minute talk in the opening session.',
  },
  {
    id: id6(base + 2),
    post_id: postId,
    position: 1,
    name: 'Silver',
    price_cents: prices[1],
    slots: slots[1],
    deliverables: ['logo_site', 'logo_stage', 'booth', 'social_posts', 'swag'],
    benefits: '',
  },
  {
    id: id6(base + 3),
    post_id: postId,
    position: 2,
    name: 'Community',
    price_cents: prices[2],
    slots: slots[2],
    deliverables: ['logo_site', 'social_posts', 'swag'],
    benefits: '',
  },
];
await upsert('post_tiers', [
  ...tiers(EVENT_POST, 10, [3_000_000, 1_500_000, 500_000], [1, 2, 5]),
  ...tiers(NEXT_EVENT, 20, [4_000_000, 2_000_000, 700_000], [1, 3, 6]),
]);

// Draft sponsorship decks (PDF) built from the facts and placeholders above.
const deck = (title, dates, goal, packages) =>
  textPdf(`${title}: sponsorship deck (draft)`, [
    'Draft prepared for Maple. Figures marked as estimates are to be confirmed with HABSIDA.',
    '',
    '# About HABSIDA',
    'HABSIDA is an international coding school in South Korea, founded by expats, teaching Java, JavaScript, and UX/UI design and helping foreigners build IT careers in Korea. HABSIDA Space in Incheon hosts classes, mentoring, and community events.',
    '',
    '# The event',
    `${title}: ${dates} at ${VENUE}.`,
    'A two-day team competition focused on startup business projects: idea validation, product development, and pitch training. Teams of 3-5; solo participants join during team formation. Entry fee KRW 20,000 (50% off for HABSIDA students).',
    '',
    '# Who comes (estimates)',
    'Developers 45%, students 35%, designers and product people 20%. About 70% international attendees living in Korea.',
    '',
    '# What sponsors get',
    'Logo on the website, stage, and t-shirts; a booth; a talk slot; a seat on the judging panel; your own prize track; recruiting access with consent; social posts; swag in attendee bags.',
    '',
    '# Packages (estimates)',
    ...packages,
    '',
    '# The ask',
    `Sponsorship goal: ${goal}. Prize pool 50%, food and drinks 25%, venue, materials, and swag 15%, promotion 10%.`,
    '',
    '# Next steps',
    'Send a proposal on Maple (mapleapp.tech/org/habsida). Invoice from HABSIDA, paid by bank transfer within 14 days of signing. Prices exclude VAT.',
  ]);

const files = [
  {
    id: id6(31),
    post_id: EVENT_POST,
    name: 'Habsida Hackathon 2026: sponsorship deck',
    path: `${id}/habsida-hackathon-2026-deck.pdf`,
    body: deck('Habsida Hackathon 2026', 'September 24-25, 2026', 'KRW 5,000,000', [
      'Gold - KRW 3,000,000 - 1 slot', 'Silver - KRW 1,500,000 - 2 slots', 'Community - KRW 500,000 - 5 slots',
    ]),
  },
  {
    id: id6(32),
    post_id: NEXT_EVENT,
    name: 'HABSIDA Hackathon Winter 2026: sponsorship deck',
    path: `${id}/habsida-hackathon-winter-2026-deck.pdf`,
    body: deck('HABSIDA Hackathon Winter 2026', 'December 12-13, 2026', 'KRW 8,000,000', [
      'Gold - KRW 4,000,000 - 1 slot', 'Silver - KRW 2,000,000 - 3 slots', 'Community - KRW 700,000 - 6 slots',
    ]),
  },
];
for (const file of files) await upload('post-files', file.path, file.body, 'application/pdf');
await upsert(
  'post_files',
  files.map(({ body, ...file }) => ({ ...file, kind: 'deck', size: body.byteLength })),
);

await upsert('showcases', [
  {
    id: SHOWCASE,
    org_id: id,
    post_id: EVENT_POST,
    title: 'Habsida Hackathon 2026',
    summary:
      'A two-day startup hackathon at HABSIDA Space in Incheon: teams of 3–5 took ideas from validation to a pitch in front of five judges.',
    body: hackathon,
    categories: ['hackathon'],
    starts_on: '2026-09-24',
    ends_on: '2026-09-25',
    city: 'Incheon',
    venue: VENUE,
    facts: [
      { label: 'Prize pool', value: '₩2,500,000' },
      { label: 'First prize', value: '₩1,500,000' },
      { label: 'Teams', value: '3–5 people' },
      { label: 'Format', value: '2 days, overnight' },
      { label: 'Judges', value: '5' },
      { label: 'Mentors', value: '5' },
    ],
    highlights: [
      'Idea pitching and team formation',
      'Lectures on lean startup, hypothesis validation, and pitching',
      'An overnight build session',
      'Final pitches and the awards ceremony',
    ],
    sponsors: ['UpperClass'],
    cover_url: cover,
    gallery: [cover, banner],
    link: 'https://luma.com/cwaixvls',
  },
]);

console.log(`Seeded HABSIDA (${email}): page /org/habsida, 3 posts with packages and decks, 1 showcase.`);
