import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ATTENDANCE_BANDS,
  AUDIENCES,
  BUDGET_BANDS,
  CATEGORIES,
  CURRENCIES,
  DELIVERABLES,
  GIVES,
  REGIONS,
  type AttendanceBand,
  type AudienceType,
  type BudgetBand,
  type Category,
  type Deliverable,
  type Give,
  type PostKind,
  type PostStatus,
  type Region,
} from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { pickAndUploadImage } from '@/features/organizations/upload-image';
import { FilesField, PairListField } from '@/features/posts/components/pitch-fields';
import type { Pair, PostFileInput, PostInput, TierInput } from '@/features/posts/mutations';
import type { PostDetailData } from '@/features/posts/queries';
import { validatePost } from '@/features/posts/schemas';
import { minorDigits, toMinor } from '@/lib/format';
import { errorMessage } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Checkbox } from '@/ui/checkbox';
import { ChoiceChips } from '@/ui/choice-chips';
import { MultiChips } from '@/ui/multi-chips';
import { TabStrip } from '@/ui/tab-strip';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

// `id` marks a tier that already exists, so saving updates it instead of replacing it.
type TierDraft = { id?: string; name: string; price: string; benefits: string; slots: string; deliverables: Deliverable[] };
const emptyTier = (name = ''): TierDraft => ({ name, price: '', benefits: '', slots: '', deliverables: [] });

export type PostDraft = {
  title: string;
  body: string;
  categories: Category[];
  regions: Region[];
  budget: string | null;
  attendance: string | null;
  audiences: AudienceType[];
  supports: Give[];
  benefits: string;
  starts_on: string;
  ends_on: string;
  city: string;
  venue: string;
  cover_url: string | null;
  online: boolean;
  deadline: string;
  tiers: TierDraft[];
  // The pitch to sponsors
  currency: string;
  goal: string;
  needs: string; // one per line
  deliverables: Deliverable[];
  exclusivity: string;
  custom_packages: boolean;
  audience: Pair[];
  reach: Pair[];
  past_stats: Pair[];
  agenda: Pair[];
  people: Pair[];
  use_of_funds: Pair[];
  past_sponsors: string; // comma separated
  languages: string; // comma separated
  registrations: string;
  decision_by: string;
  report_by: string;
  payment_terms: string;
  files: PostFileInput[];
};

const major = (minor: number | null, currency: string) => (minor != null ? String(minor / 10 ** minorDigits(currency)) : '');
const lines = (text: string) => text.split('\n').map((s) => s.trim()).filter(Boolean);
const commas = (text: string) => text.split(',').map((s) => s.trim()).filter(Boolean);
const pairs = (rows: Pair[]) =>
  rows.map((r) => ({ label: r.label.trim(), value: r.value.trim() })).filter((r) => r.label || r.value);

export const draftFromInput = (input: PostInput): PostDraft => ({
  title: input.title,
  body: input.body,
  categories: input.categories,
  regions: (input.regions ?? []) as Region[],
  budget: input.budget_band,
  attendance: input.attendance_band,
  audiences: input.audience_types,
  supports: input.supports,
  benefits: input.benefits,
  starts_on: input.starts_on ?? '',
  ends_on: input.ends_on ?? '',
  city: input.city ?? '',
  venue: input.venue ?? '',
  cover_url: input.cover_url ?? null,
  online: input.online,
  deadline: input.deadline ?? '',
  tiers: input.tiers.map((t) => ({
    id: t.id,
    name: t.name,
    price: major(t.price_cents, input.currency),
    benefits: t.benefits,
    slots: t.slots != null ? String(t.slots) : '',
    deliverables: t.deliverables,
  })),
  currency: input.currency,
  goal: major(input.goal_cents, input.currency),
  needs: input.needs.join('\n'),
  deliverables: input.deliverables,
  exclusivity: input.exclusivity ?? '',
  custom_packages: input.custom_packages,
  audience: input.audience,
  reach: input.reach,
  past_stats: input.past_stats,
  agenda: input.agenda,
  people: input.people,
  use_of_funds: input.use_of_funds,
  past_sponsors: input.past_sponsors.join(', '),
  languages: input.languages.join(', '),
  registrations: input.registrations != null ? String(input.registrations) : '',
  decision_by: input.decision_by ?? '',
  report_by: input.report_by ?? '',
  payment_terms: input.payment_terms ?? '',
  files: input.files,
});

/** The saved post as form input, for the edit screen. */
export const inputFromPost = (post: PostDetailData): PostInput => ({
  kind: post.kind,
  title: post.title,
  body: post.body,
  categories: post.categories,
  regions: post.regions,
  budget_band: post.budget_band,
  attendance_band: post.attendance_band,
  audience_types: post.audience_types,
  supports: post.supports,
  benefits: post.benefits,
  starts_on: post.starts_on ?? null,
  ends_on: post.ends_on ?? null,
  city: post.city ?? null,
  venue: post.venue ?? null,
  cover_url: post.cover_url ?? null,
  online: post.online ?? false,
  deadline: post.deadline,
  status: post.status,
  currency: post.currency,
  goal_cents: post.goal_cents,
  needs: post.needs,
  deliverables: post.deliverables,
  exclusivity: post.exclusivity,
  custom_packages: post.custom_packages,
  audience: post.audience,
  reach: post.reach,
  past_stats: post.past_stats,
  agenda: post.agenda,
  people: post.people,
  use_of_funds: post.use_of_funds,
  past_sponsors: post.past_sponsors,
  languages: post.languages,
  registrations: post.registrations,
  decision_by: post.decision_by,
  report_by: post.report_by,
  payment_terms: post.payment_terms,
  tiers: [...post.post_tiers]
    .sort((a, b) => a.position - b.position)
    .map((t) => ({
      id: t.id,
      name: t.name,
      price_cents: t.price_cents,
      benefits: t.benefits,
      slots: t.slots,
      deliverables: t.deliverables,
    })),
  files: post.post_files.map((f) => ({ id: f.id, kind: f.kind, name: f.name, path: f.path, size: f.size })),
});

export const emptyDraft = (seed?: { categories?: Category[]; regions?: Region[] }): PostDraft => ({
  title: '',
  body: '',
  categories: seed?.categories ?? [],
  regions: seed?.regions ?? [],
  budget: null,
  attendance: null,
  audiences: [],
  supports: [],
  benefits: '',
  starts_on: '',
  ends_on: '',
  city: '',
  venue: '',
  cover_url: null,
  online: false,
  deadline: '',
  tiers: [],
  currency: 'USD',
  goal: '',
  needs: '',
  deliverables: [],
  exclusivity: '',
  custom_packages: true,
  audience: [],
  reach: [],
  past_stats: [],
  agenda: [],
  people: [],
  use_of_funds: [],
  past_sponsors: '',
  languages: '',
  registrations: '',
  decision_by: '',
  report_by: '',
  payment_terms: '',
  files: [],
});

const toInput = (kind: PostKind, draft: PostDraft, status: PostStatus): PostInput => ({
  kind,
  title: draft.title.trim(),
  body: draft.body.trim(),
  categories: draft.categories,
  regions: draft.regions,
  budget_band: (draft.budget ?? null) as BudgetBand | null,
  attendance_band: (draft.attendance ?? null) as AttendanceBand | null,
  audience_types: draft.audiences,
  supports: draft.supports,
  benefits: draft.benefits.trim(),
  starts_on: draft.starts_on || null,
  ends_on: draft.ends_on || null,
  city: draft.city.trim() || null,
  venue: draft.online ? null : draft.venue.trim() || null,
  cover_url: draft.cover_url,
  online: draft.online,
  deadline: draft.deadline || null,
  status,
  currency: draft.currency,
  goal_cents: toMinor(draft.goal, draft.currency),
  needs: lines(draft.needs),
  deliverables: draft.deliverables,
  exclusivity: draft.exclusivity.trim() || null,
  custom_packages: draft.custom_packages,
  audience: pairs(draft.audience),
  reach: pairs(draft.reach),
  past_stats: pairs(draft.past_stats),
  agenda: pairs(draft.agenda),
  people: pairs(draft.people),
  use_of_funds: pairs(draft.use_of_funds),
  past_sponsors: commas(draft.past_sponsors),
  languages: commas(draft.languages),
  registrations: draft.registrations ? Number(draft.registrations) : null,
  decision_by: draft.decision_by || null,
  report_by: draft.report_by || null,
  payment_terms: draft.payment_terms.trim() || null,
  // Only event posts have priced tiers.
  tiers: (kind === 'event' ? draft.tiers : [])
    .filter((t) => t.name.trim())
    .map(
      (t): TierInput => ({
        id: t.id,
        name: t.name.trim(),
        price_cents: toMinor(t.price, draft.currency),
        benefits: t.benefits.trim(),
        slots: t.slots ? Number(t.slots) : null,
        deliverables: t.deliverables,
      }),
    ),
  files: draft.files,
});

type Step = 'basics' | 'ask' | 'value' | 'audience' | 'plan' | 'documents';

// What makes a pitch sponsors can decide on; shown as a score while the organizer fills the form.
const CHECKS: { label: string; step: Step; done: (d: PostDraft) => boolean; eventOnly?: boolean }[] = [
  { label: 'Event plan', step: 'basics', done: (d) => d.body.trim().length > 80 },
  { label: 'Cover image', step: 'basics', done: (d) => !!d.cover_url },
  { label: 'Sponsorship goal', step: 'ask', done: (d) => !!d.goal },
  { label: 'What you need', step: 'ask', done: (d) => lines(d.needs).length > 0 },
  { label: 'Proposal deadline', step: 'ask', done: (d) => !!d.deadline },
  { label: 'What sponsors get', step: 'value', done: (d) => d.deliverables.length > 0 },
  { label: 'Tiers', step: 'value', done: (d) => d.tiers.length > 0, eventOnly: true },
  { label: 'Audience numbers', step: 'audience', done: (d) => pairs(d.audience).length > 0 || !!d.registrations },
  { label: 'Schedule', step: 'plan', done: (d) => pairs(d.agenda).length > 0, eventOnly: true },
  { label: 'Sponsorship deck', step: 'documents', done: (d) => d.files.length > 0 },
];

type Props = {
  kind: PostKind;
  initial: PostDraft;
  /** The saved post's status when editing; undefined for a new post. */
  status?: PostStatus;
  publishTitle: string;
  onSubmit: (input: PostInput) => Promise<void>;
};

// One form for event posts and sponsor posts, in steps: basics, the ask, what sponsors get, audience, plan,
// documents. Publishing works from any step; missing pieces show in the pitch score.
export function PostForm({ kind, initial, status, publishTitle, onSubmit }: Props) {
  const event = kind === 'event';
  // A new post or a draft can be published or kept as a draft; a live post keeps its status (open or closed).
  const isDraft = !status || status === 'draft';
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>('basics');

  const steps = [
    { value: 'basics' as const, label: '1. Basics' },
    { value: 'ask' as const, label: event ? '2. The ask' : '2. Budget' },
    { value: 'value' as const, label: event ? '3. What sponsors get' : '3. What you want' },
    { value: 'audience' as const, label: '4. Audience' },
    ...(event ? [{ value: 'plan' as const, label: '5. Plan' }] : []),
    { value: 'documents' as const, label: event ? '6. Documents' : '5. Documents' },
  ];
  const index = steps.findIndex((s) => s.value === step);
  const checks = CHECKS.filter((c) => event || !c.eventOnly);
  const missing = checks.filter((c) => !c.done(draft));

  const setTier = (i: number, patch: Partial<TierDraft>) =>
    set('tiers', draft.tiers.map((tier, j) => (j === i ? { ...tier, ...patch } : tier)));

  const save = async (target: PostStatus) => {
    const input = toInput(kind, draft, target);
    const next = target === 'draft' ? {} : validatePost(input);
    // Tiers still need numbers even in a draft.
    input.tiers.forEach((tier, i) => {
      if (tier.slots != null && !(Number.isInteger(tier.slots) && tier.slots > 0))
        next[`tier${i}`] = 'Slots must be a whole number above 0.';
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await onSubmit(input);
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Something went wrong.' });
    }
    setBusy(false);
  };

  return (
    <>
      <Card>
        <ThemedText type="subheading">
          Pitch strength: {checks.length - missing.length}/{checks.length}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {missing.length
            ? `Posts with a goal, clear deliverables, and a deck get more proposals. Still missing: ${missing.map((c) => c.label.toLowerCase()).join(', ')}.`
            : 'Everything sponsors look for is here.'}
        </ThemedText>
      </Card>
      <TabStrip tabs={steps} value={step} onChange={setStep} />

      {step === 'basics' && (
        <>
          <TextField
            label="Title"
            placeholder={event ? 'Sponsor HackCity 2026' : 'Backing 5 student hackathons this spring'}
            value={draft.title}
            onChangeText={(title) => set('title', title)}
            maxLength={120}
            error={errors.title}
          />
          <TextField
            label={event ? 'Event plan' : 'What we are looking for'}
            placeholder={
              event
                ? 'What the event is, who comes, and why it is worth backing'
                : 'Event types, regions, audience, and time window'
            }
            value={draft.body}
            onChangeText={(body) => set('body', body)}
            multiline
            maxLength={5000}
            style={{ minHeight: 140 }}
            error={errors.body}
          />
          <MultiChips label="Event types" options={CATEGORIES} value={draft.categories} onChange={(v) => set('categories', v as Category[])} />
          <MultiChips label="Regions" options={REGIONS} value={draft.regions} onChange={(v) => set('regions', v as Region[])} />
          <TextField
            label={event ? 'Starts on (YYYY-MM-DD)' : 'From (optional, YYYY-MM-DD)'}
            value={draft.starts_on}
            onChangeText={(starts_on) => set('starts_on', starts_on)}
            maxLength={10}
            error={errors.starts_on}
          />
          <TextField
            label={event ? 'Ends on (optional, YYYY-MM-DD)' : 'Until (optional, YYYY-MM-DD)'}
            value={draft.ends_on}
            onChangeText={(ends_on) => set('ends_on', ends_on)}
            maxLength={10}
            error={errors.ends_on}
          />
          <ChoiceChips
            label="Where"
            options={[
              { value: 'place', label: 'In person' },
              { value: 'online', label: 'Online' },
            ]}
            value={draft.online ? 'online' : 'place'}
            onChange={(v) => set('online', v === 'online')}
          />
          {!draft.online && (
            <TextField label="City" value={draft.city} onChangeText={(city) => set('city', city)} maxLength={80} error={errors.city} />
          )}
          {!draft.online && event && (
            <TextField
              label="Venue and address (shows a map on the post)"
              placeholder="HABSIDA Space, 429 Biryu-daero, Incheon"
              value={draft.venue}
              onChangeText={(venue) => set('venue', venue)}
              maxLength={200}
            />
          )}
          <CoverPicker url={draft.cover_url} onChange={(url) => set('cover_url', url)} />
        </>
      )}

      {step === 'ask' && (
        <>
          <ChoiceChips label="Currency" options={CURRENCIES} value={draft.currency} onChange={(currency) => set('currency', currency)} />
          <TextField
            label={event ? `Sponsorship goal in ${draft.currency}` : `Budget per event in ${draft.currency}`}
            placeholder="5000000"
            value={draft.goal}
            onChangeText={(goal) => set('goal', goal.replace(/[^\d.]/g, ''))}
            keyboardType="decimal-pad"
          />
          <ChoiceChips
            label={event ? 'Goal range (for search)' : 'Budget range (for search)'}
            options={BUDGET_BANDS}
            value={draft.budget}
            onChange={(budget) => set('budget', budget)}
          />
          <MultiChips
            label={event ? 'Support you need' : 'Support you give'}
            options={GIVES}
            value={draft.supports}
            onChange={(v) => set('supports', v as Give[])}
          />
          <TextField
            label={event ? 'What you need, one per line' : 'What you can give, one per line'}
            placeholder={event ? '₩2,500,000 for the prize pool\nFood for 60 people overnight' : 'Cloud credits for every team\nTwo mentors'}
            value={draft.needs}
            onChangeText={(needs) => set('needs', needs)}
            multiline
            style={{ minHeight: 100 }}
          />
          {event && (
            <PairListField
              label="Where the money goes"
              hint="Sponsors trust a clear budget. Example: Prize pool — 50%."
              value={draft.use_of_funds}
              onChange={(v) => set('use_of_funds', v)}
              labelPlaceholder="Item"
              valuePlaceholder="Share or amount"
            />
          )}
          <TextField
            label="Deadline for proposals (YYYY-MM-DD)"
            value={draft.deadline}
            onChangeText={(deadline) => set('deadline', deadline)}
            maxLength={10}
            error={errors.deadline}
          />
          <TextField
            label="You decide by (optional, YYYY-MM-DD)"
            value={draft.decision_by}
            onChangeText={(decision_by) => set('decision_by', decision_by)}
            maxLength={10}
            error={errors.decision_by}
          />
          <TextField
            label="Payment terms (optional)"
            placeholder="Invoice, paid by bank transfer within 14 days. Prices exclude VAT."
            value={draft.payment_terms}
            onChangeText={(payment_terms) => set('payment_terms', payment_terms)}
            maxLength={300}
          />
        </>
      )}

      {step === 'value' && (
        <>
          <MultiChips
            label={event ? 'What sponsors get' : 'What you expect in return'}
            options={DELIVERABLES}
            value={draft.deliverables}
            onChange={(v) => set('deliverables', v as Deliverable[])}
          />
          <TextField
            label={event ? 'More about the value for sponsors' : 'More about what you want in return'}
            placeholder="Who they will meet, what they can launch, how you will promote them"
            value={draft.benefits}
            onChangeText={(benefits) => set('benefits', benefits)}
            multiline
            maxLength={2000}
            style={{ minHeight: 100 }}
          />
          {event && (
            <>
              <TextField
                label="Exclusivity (optional)"
                placeholder="One sponsor per category, for example one cloud provider"
                value={draft.exclusivity}
                onChangeText={(exclusivity) => set('exclusivity', exclusivity)}
                maxLength={200}
              />
              <Checkbox
                checked={draft.custom_packages}
                onChange={(v) => set('custom_packages', v)}
                label="Open to custom packages">
                <ThemedText>Open to custom packages</ThemedText>
              </Checkbox>
              <TextField
                label="After-event report for sponsors by (optional, YYYY-MM-DD)"
                value={draft.report_by}
                onChangeText={(report_by) => set('report_by', report_by)}
                maxLength={10}
                error={errors.report_by}
              />
              <ThemedText type="subheading" level={2}>
                Tiers
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Priced packages sponsors can pick, like Gold {draft.currency} 3,000,000. Each tier lists what it includes.
              </ThemedText>
              {draft.tiers.map((tier, i) => (
                <Card key={i}>
                  <TextField label="Tier name" value={tier.name} onChangeText={(name) => setTier(i, { name })} maxLength={60} />
                  <TextField
                    label={`Price in ${draft.currency} (optional)`}
                    value={tier.price}
                    onChangeText={(price) => setTier(i, { price: price.replace(/[^\d.]/g, '') })}
                    keyboardType="decimal-pad"
                  />
                  <TextField
                    label="Slots (optional)"
                    value={tier.slots}
                    onChangeText={(slots) => setTier(i, { slots: slots.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    error={errors[`tier${i}`]}
                  />
                  <MultiChips
                    label="Includes"
                    options={DELIVERABLES}
                    value={tier.deliverables}
                    onChange={(v) => setTier(i, { deliverables: v as Deliverable[] })}
                  />
                  <TextField
                    label="Anything else it includes (optional)"
                    value={tier.benefits}
                    onChangeText={(benefits) => setTier(i, { benefits })}
                    multiline
                    maxLength={1000}
                  />
                  <Pressable role="button" onPress={() => set('tiers', draft.tiers.filter((_, j) => j !== i))} hitSlop={8} style={styles.remove}>
                    <ThemedText type="smallStrong" themeColor="danger">
                      Remove tier
                    </ThemedText>
                  </Pressable>
                </Card>
              ))}
              {draft.tiers.length < 5 && (
                <Button title="Add a tier" variant="secondary" onPress={() => set('tiers', [...draft.tiers, emptyTier()])} />
              )}
            </>
          )}
        </>
      )}

      {step === 'audience' && (
        <>
          <MultiChips label="Audience" options={AUDIENCES} value={draft.audiences} onChange={(v) => set('audiences', v as AudienceType[])} />
          <ChoiceChips
            label={event ? 'Expected attendance' : 'Event size you want'}
            options={ATTENDANCE_BANDS}
            value={draft.attendance}
            onChange={(attendance) => set('attendance', attendance)}
          />
          {event && (
            <>
              <TextField
                label="Registered so far (optional)"
                value={draft.registrations}
                onChangeText={(registrations) => set('registrations', registrations.replace(/\D/g, ''))}
                keyboardType="number-pad"
              />
              <PairListField
                label="Audience breakdown"
                hint="Who comes. Example: Developers — 45%, Foreign professionals in Korea — 70%."
                value={draft.audience}
                onChange={(v) => set('audience', v)}
                labelPlaceholder="Group"
                valuePlaceholder="Share or number"
              />
              <PairListField
                label="Reach"
                hint="Channels that will promote sponsors. Example: Instagram — 3,000 followers."
                value={draft.reach}
                onChange={(v) => set('reach', v)}
                labelPlaceholder="Channel"
                valuePlaceholder="Followers or subscribers"
              />
              <PairListField
                label="Past editions"
                hint="Proof from earlier events. Example: Attendees in 2025 — 120."
                value={draft.past_stats}
                onChange={(v) => set('past_stats', v)}
                labelPlaceholder="Number"
                valuePlaceholder="Value"
              />
              <TextField
                label="Past sponsors (comma separated)"
                value={draft.past_sponsors}
                onChangeText={(past_sponsors) => set('past_sponsors', past_sponsors)}
              />
            </>
          )}
          <TextField
            label="Languages (comma separated)"
            placeholder="English, Korean"
            value={draft.languages}
            onChangeText={(languages) => set('languages', languages)}
          />
        </>
      )}

      {step === 'plan' && event && (
        <>
          <PairListField
            label="Schedule"
            hint="Example: Day 1 · 11:00 — Registration and team formation."
            value={draft.agenda}
            onChange={(v) => set('agenda', v)}
            labelPlaceholder="When"
            valuePlaceholder="What happens"
            max={20}
          />
          <PairListField
            label="Judges, mentors, and speakers"
            hint="Example: Florian Ludot — Judge · CEO, Dev Korea."
            value={draft.people}
            onChange={(v) => set('people', v)}
            labelPlaceholder="Name"
            valuePlaceholder="Role and organization"
            max={20}
          />
        </>
      )}

      {step === 'documents' && <FilesField value={draft.files} onChange={(files) => set('files', files)} />}

      <View style={styles.nav}>
        {index > 0 && <Button title="Back" variant="secondary" onPress={() => setStep(steps[index - 1].value)} />}
        {index < steps.length - 1 && <Button title="Next" variant="secondary" onPress={() => setStep(steps[index + 1].value)} />}
      </View>

      {Object.keys(errors).length > 0 && (
        <ThemedText role="alert" themeColor="danger">
          {errors.form ?? `Check: ${Object.values(errors).join(' ')}`}
        </ThemedText>
      )}
      <Button title={busy ? 'Saving…' : publishTitle} onPress={() => save(isDraft ? 'open' : status)} disabled={busy} />
      {isDraft && (
        <Button title={busy ? 'Saving…' : 'Save as draft'} variant="secondary" onPress={() => save('draft')} disabled={busy} />
      )}
    </>
  );
}

// An optional square cover image, shown at the top of the post page (like an event poster).
function CoverPicker({ url, onChange }: { url: string | null; onChange: (url: string | null) => void }) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const pick = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const next = await pickAndUploadImage(session!.user.id, 'cover');
      if (next) onChange(next);
    } catch (e) {
      setError(errorMessage(e));
    }
    setBusy(false);
  };
  return (
    <View style={styles.coverField}>
      <ThemedText type="smallStrong">Cover image (optional)</ThemedText>
      {url && <Image source={url} style={styles.preview} contentFit="cover" />}
      <View style={styles.row}>
        <Button title={busy ? 'Uploading…' : url ? 'Change cover' : 'Upload cover'} variant="secondary" onPress={pick} disabled={busy} />
        {url && (
          <Pressable role="button" onPress={() => onChange(null)} hitSlop={8}>
            <ThemedText type="smallStrong" themeColor="danger">
              Remove
            </ThemedText>
          </Pressable>
        )}
      </View>
      <ThemedText type="small" themeColor={error ? 'danger' : 'textSecondary'} role={error ? 'alert' : undefined}>
        {error ?? 'A square poster works best. PNG, JPG, or WebP, up to 2 MB.'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  remove: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  nav: { flexDirection: 'row', gap: Spacing.three },
  coverField: { gap: Spacing.two },
  preview: { width: 160, height: 160, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
