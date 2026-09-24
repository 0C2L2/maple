import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import {
  ATTENDANCE_BANDS,
  AUDIENCES,
  BUDGET_BANDS,
  CATEGORIES,
  GIVES,
  REGIONS,
  type AttendanceBand,
  type AudienceType,
  type BudgetBand,
  type Category,
  type Give,
  type PostKind,
  type Region,
} from '@/constants/taxonomy';
import type { PostInput, TierInput } from '@/features/posts/mutations';
import { validatePost } from '@/features/posts/schemas';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { MultiChips } from '@/ui/multi-chips';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

type TierDraft = { name: string; price: string; benefits: string; slots: string };
const emptyTier = (name = ''): TierDraft => ({ name, price: '', benefits: '', slots: '' });

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
  online: boolean;
  deadline: string;
  tiers: TierDraft[];
};

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
  online: input.online,
  deadline: input.deadline ?? '',
  tiers: input.tiers.length
    ? input.tiers.map((t) => ({
        name: t.name,
        price: t.price_cents != null ? String(t.price_cents / 100) : '',
        benefits: t.benefits,
        slots: t.slots != null ? String(t.slots) : '',
      }))
    : [emptyTier('Gold'), emptyTier('Silver')],
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
  online: false,
  deadline: '',
  tiers: [emptyTier('Gold'), emptyTier('Silver')],
});

const toInput = (kind: PostKind, draft: PostDraft, status: 'draft' | 'open'): PostInput => ({
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
  online: draft.online,
  deadline: draft.deadline || null,
  status,
  tiers: draft.tiers
    .filter((t) => t.name.trim())
    .map(
      (t): TierInput => ({
        name: t.name.trim(),
        price_cents: t.price ? Math.round(Number(t.price) * 100) : null,
        benefits: t.benefits.trim(),
        slots: t.slots ? Number(t.slots) : null,
      }),
    ),
});

type Props = {
  kind: PostKind;
  initial: PostDraft;
  publishTitle: string;
  onSubmit: (input: PostInput) => Promise<void>;
};

// One form for event posts and sponsor posts: basics, plan, support, benefits + tiers.
export function PostForm({ kind, initial, publishTitle, onSubmit }: Props) {
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const setTier = (index: number, patch: Partial<TierDraft>) =>
    set('tiers', draft.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));

  const save = async (status: 'draft' | 'open') => {
    const input = toInput(kind, draft, status);
    const next = status === 'open' ? validatePost(input) : {};
    // Tiers still need numbers even in a draft.
    input.tiers.forEach((tier, i) => {
      if (tier.price_cents != null && !(tier.price_cents >= 0)) next[`tier${i}`] = 'Price must be a number, like 2500.';
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
      <TextField
        label="Title"
        placeholder={kind === 'event' ? 'Sponsor HackCity 2026' : 'Backing 5 student hackathons this spring'}
        value={draft.title}
        onChangeText={(title) => set('title', title)}
        maxLength={120}
        error={errors.title}
      />
      <TextField
        label={kind === 'event' ? 'Event plan' : 'What we are looking for'}
        placeholder={
          kind === 'event'
            ? 'Agenda, speakers, audience, and what makes this event worth backing'
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
      <MultiChips label="Audience" options={AUDIENCES} value={draft.audiences} onChange={(v) => set('audiences', v as AudienceType[])} />
      <ChoiceChips
        label={kind === 'event' ? 'Expected attendance' : 'Event size you want'}
        options={ATTENDANCE_BANDS}
        value={draft.attendance}
        onChange={(attendance) => set('attendance', attendance)}
      />
      <ChoiceChips
        label={kind === 'event' ? 'Sponsorship goal' : 'Budget per event'}
        options={BUDGET_BANDS}
        value={draft.budget}
        onChange={(budget) => set('budget', budget)}
      />

      <ThemedText type="subheading" level={2}>
        {kind === 'event' ? 'Dates and place' : 'Time window and place'}
      </ThemedText>
      <TextField
        label="Starts on (YYYY-MM-DD)"
        value={draft.starts_on}
        onChangeText={(starts_on) => set('starts_on', starts_on)}
        maxLength={10}
        error={errors.starts_on}
      />
      <TextField
        label="Ends on (optional, YYYY-MM-DD)"
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

      <MultiChips
        label={kind === 'event' ? 'Support you need' : 'Support you give'}
        options={GIVES}
        value={draft.supports}
        onChange={(v) => set('supports', v as Give[])}
      />
      <TextField
        label={kind === 'event' ? 'What sponsors get' : 'What you want in return'}
        placeholder="Logo placement, booth, keynote slot, recruiting access…"
        value={draft.benefits}
        onChangeText={(benefits) => set('benefits', benefits)}
        multiline
        maxLength={2000}
        style={{ minHeight: 100 }}
      />
      <TextField
        label="Deadline for proposals (optional, YYYY-MM-DD)"
        value={draft.deadline}
        onChangeText={(deadline) => set('deadline', deadline)}
        maxLength={10}
        error={errors.deadline}
      />

      {kind === 'event' && (
        <>
          <ThemedText type="subheading" level={2}>
            Tiers (optional)
          </ThemedText>
          {draft.tiers.map((tier, i) => (
            <Card key={i}>
              <TextField label="Tier name" value={tier.name} onChangeText={(name) => setTier(i, { name })} maxLength={60} />
              <TextField
                label="Price in USD (optional)"
                value={tier.price}
                onChangeText={(price) => setTier(i, { price: price.replace(/[^\d.]/g, '') })}
                keyboardType="decimal-pad"
              />
              <TextField
                label="What the sponsor gets"
                value={tier.benefits}
                onChangeText={(benefits) => setTier(i, { benefits })}
                multiline
                maxLength={1000}
              />
              <TextField
                label="Slots (optional)"
                value={tier.slots}
                onChangeText={(slots) => setTier(i, { slots: slots.replace(/\D/g, '') })}
                keyboardType="number-pad"
                error={errors[`tier${i}`]}
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

      {errors.form && (
        <ThemedText role="alert" themeColor="danger">
          {errors.form}
        </ThemedText>
      )}
      <Button title={busy ? 'Saving…' : publishTitle} onPress={() => save('open')} disabled={busy} />
      <Button title={busy ? 'Saving…' : 'Save as draft'} variant="secondary" onPress={() => save('draft')} disabled={busy} />
    </>
  );
}

const styles = StyleSheet.create({
  remove: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
});
