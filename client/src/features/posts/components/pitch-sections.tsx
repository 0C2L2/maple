import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  ATTENDANCE_LABELS,
  BUDGET_LABELS,
  DELIVERABLE_LABELS,
  FILE_KIND_LABELS,
  GIVE_LABELS,
  type Deliverable,
} from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { closesIn } from '@/features/posts/components/post-card';
import type { Pair } from '@/features/posts/mutations';
import type { PostDetailData, PostFile } from '@/features/posts/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatMoney } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type State = { tone: 'open' | 'live' | 'ended' | 'muted'; label: string; open: boolean };

/** Whether the post still takes proposals, mirroring send_proposal's rules (deadline, event end, status). */
export function postState(p: PostDetailData): State {
  const now = today();
  const end = p.ends_on ?? p.starts_on;
  if (p.removed_at)
    return { tone: 'ended', label: `Taken down by Maple staff${p.removed_reason ? `: ${p.removed_reason}` : ''}`, open: false };
  if (p.status === 'draft') return { tone: 'muted', label: 'Draft · only you can see it', open: false };
  if (p.status === 'closed') return { tone: 'muted', label: 'Closed to new proposals', open: false };
  if (p.kind === 'event' && end && end < now) return { tone: 'ended', label: 'Event finished', open: false };
  if (p.deadline && p.deadline < now)
    return { tone: 'ended', label: `Deadline passed on ${formatDate(p.deadline)}`, open: false };
  const closes = closesIn(p.deadline);
  if (p.kind === 'event' && p.starts_on && p.starts_on <= now)
    return { tone: 'live', label: `Happening now${closes ? ` · ${closes.toLowerCase()}` : ''}`, open: true };
  return { tone: 'open', label: `Open for ${p.kind === 'event' ? 'sponsors' : 'proposals'}${closes ? ` · ${closes.toLowerCase()}` : ''}`, open: true };
}

export function StatusBanner({ post }: { post: PostDetailData }) {
  const theme = useTheme();
  const state = postState(post);
  const color = state.tone === 'ended' ? theme.danger : state.tone === 'muted' ? theme.textSecondary : theme.brand;
  return (
    <View role="status" style={[styles.banner, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="smallStrong" style={{ color }}>
        {state.label}
      </ThemedText>
    </View>
  );
}

/** The first card sponsors read: the goal, tiers, what is needed, audience, and dates. */
export function AskCard({ post: p, slots }: { post: PostDetailData; slots: Record<string, number> }) {
  const event = p.kind === 'event';
  const prices = p.post_tiers.flatMap((t) => (t.price_cents != null ? [t.price_cents] : []));
  const left = p.post_tiers.reduce((sum, t) => sum + (t.slots != null ? Math.max(0, t.slots - (slots[t.id] ?? 0)) : 0), 0);
  const rows: [string, string | null][] = [
    [
      event ? 'Sponsorship goal' : 'Budget per event',
      p.goal_cents != null ? formatMoney(p.goal_cents, p.currency) : p.budget_band && BUDGET_LABELS[p.budget_band],
    ],
    [
      'Tiers',
      p.post_tiers.length
        ? `${p.post_tiers.length} ${p.post_tiers.length === 1 ? 'package' : 'packages'}${
            prices.length
              ? ` · ${formatMoney(Math.min(...prices), p.currency)}${prices.length > 1 ? ` – ${formatMoney(Math.max(...prices), p.currency)}` : ''}`
              : ''
          }${left ? ` · ${left} ${left === 1 ? 'slot' : 'slots'} left` : ''}`
        : null,
    ],
    [
      event ? 'Audience' : 'Events wanted',
      [p.attendance_band && `${ATTENDANCE_LABELS[p.attendance_band]} people`, p.registrations != null && `${p.registrations} registered so far`]
        .filter(Boolean)
        .join(' · ') || null,
    ],
    ['Proposals by', p.deadline && `${formatDate(p.deadline)}${closesIn(p.deadline) ? ` (${closesIn(p.deadline)!.toLowerCase()})` : ''}`],
    ['Decision by', p.decision_by && formatDate(p.decision_by)],
  ];
  const needs = p.needs.length ? p.needs : p.supports.map((g) => GIVE_LABELS[g]);
  return (
    <Card>
      <ThemedText type="caption" themeColor="link">
        {event ? 'THE ASK AT A GLANCE' : 'THE OFFER AT A GLANCE'}
      </ThemedText>
      <View style={styles.askGrid}>
        {rows
          .filter((row): row is [string, string] => !!row[1])
          .map(([label, value]) => (
            <View key={label} style={styles.askCell}>
              <ThemedText type="small" themeColor="textSecondary">
                {label}
              </ThemedText>
              <ThemedText type="bodyStrong">{value}</ThemedText>
            </View>
          ))}
      </View>
      {needs.length > 0 && (
        <View style={styles.list}>
          <ThemedText type="smallStrong">{event ? 'What we need' : 'What we give'}</ThemedText>
          {needs.map((need) => (
            <ThemedText key={need}>• {need}</ThemedText>
          ))}
        </View>
      )}
    </Card>
  );
}

function Check({ on = true, children }: { on?: boolean; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.check}>
      <SymbolView
        name={on ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } : { ios: 'minus', android: 'remove', web: 'remove' }}
        tintColor={on ? theme.brand : theme.textSecondary}
        size={20}
      />
      <ThemedText themeColor={on ? 'text' : 'textSecondary'} style={styles.fill}>
        {children}
      </ThemedText>
    </View>
  );
}

/** What sponsors get, as a checklist, plus exclusivity, custom packages, and the after-event report. */
export function ValueSection({ post: p }: { post: PostDetailData }) {
  const event = p.kind === 'event';
  if (!p.deliverables.length && !p.benefits && !p.exclusivity) return null;
  return (
    <Section title={event ? 'What sponsors get' : 'What we want in return'}>
      <Card>
        <View style={styles.checks}>
          {p.deliverables.map((d) => (
            <View key={d} style={styles.checkCell}>
              <Check>{DELIVERABLE_LABELS[d]}</Check>
            </View>
          ))}
        </View>
        {p.benefits ? <ThemedText>{p.benefits}</ThemedText> : null}
        {event && (
          <View style={styles.list}>
            {p.exclusivity && <ThemedText type="small">Exclusivity: {p.exclusivity}</ThemedText>}
            <ThemedText type="small" themeColor="textSecondary">
              {p.custom_packages ? 'Open to custom packages: propose what works for you.' : 'Packages as listed.'}
              {p.report_by ? ` After the event, sponsors get a results report by ${formatDate(p.report_by)}.` : ''}
            </ThemedText>
          </View>
        )}
      </Card>
    </Section>
  );
}

/** Tiers side by side, like a pricing table: price, slots left, and what each includes. */
export function TierTable({
  post: p,
  slots,
  chosen,
  onChoose,
}: {
  post: PostDetailData;
  slots: Record<string, number>;
  chosen: string | null;
  onChoose?: (tierId: string) => void;
}) {
  const theme = useTheme();
  const tiers = [...p.post_tiers].sort((a, b) => a.position - b.position);
  if (!tiers.length) return null;
  const all = [...new Set(tiers.flatMap((t) => t.deliverables))] as Deliverable[];
  return (
    <Section title="Sponsorship packages">
      <View style={styles.tiers}>
        {tiers.map((tier) => {
          const left = tier.slots != null ? Math.max(0, tier.slots - (slots[tier.id] ?? 0)) : null;
          const soldOut = left === 0;
          return (
            <Card key={tier.id} style={[styles.tier, chosen === tier.id && { borderColor: theme.brand, borderWidth: 2 }]}>
              <ThemedText type="subheading">{tier.name}</ThemedText>
              <ThemedText type="title">{tier.price_cents != null ? formatMoney(tier.price_cents, p.currency) : 'Ask'}</ThemedText>
              <ThemedText type="small" themeColor={soldOut ? 'danger' : 'textSecondary'}>
                {left == null ? 'Open slots' : soldOut ? 'Sold out' : `${left} of ${tier.slots} ${tier.slots === 1 ? 'slot' : 'slots'} left`}
              </ThemedText>
              <View style={styles.list}>
                {all.map((d) => (
                  <Check key={d} on={tier.deliverables.includes(d)}>
                    {DELIVERABLE_LABELS[d]}
                  </Check>
                ))}
              </View>
              {tier.benefits ? <ThemedText type="small">{tier.benefits}</ThemedText> : null}
              {onChoose && !soldOut && (
                <Button
                  title={chosen === tier.id ? 'Chosen ✓' : 'Choose this package'}
                  variant={chosen === tier.id ? 'primary' : 'secondary'}
                  onPress={() => onChoose(tier.id)}
                />
              )}
            </Card>
          );
        })}
      </View>
    </Section>
  );
}

function PairGrid({ title, rows }: { title: string; rows: Pair[] }) {
  const theme = useTheme();
  if (!rows.length) return null;
  return (
    <View style={styles.list}>
      <ThemedText type="smallStrong">{title}</ThemedText>
      <View style={styles.facts}>
        {rows.map((row) => (
          <View key={`${row.label}${row.value}`} style={[styles.fact, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="heading">{row.value}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {row.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Who comes and how far sponsors reach: breakdown, channels, past editions, past sponsors. */
export function ProofSection({ post: p }: { post: PostDetailData }) {
  if (!p.audience.length && !p.reach.length && !p.past_stats.length && !p.past_sponsors.length && !p.languages.length)
    return null;
  return (
    <Section title={p.kind === 'event' ? 'Audience and reach' : 'Who we want to reach'}>
      <PairGrid title="Who comes" rows={p.audience} />
      <PairGrid title="Reach" rows={p.reach} />
      <PairGrid title="Past editions" rows={p.past_stats} />
      {p.past_sponsors.length > 0 && <ThemedText>Past sponsors: {p.past_sponsors.join(' · ')}</ThemedText>}
      {p.languages.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Languages: {p.languages.join(', ')}
        </ThemedText>
      )}
    </Section>
  );
}

/** Schedule, people, and where the money goes. */
export function PlanSection({ post: p }: { post: PostDetailData }) {
  const theme = useTheme();
  if (!p.agenda.length && !p.people.length && !p.use_of_funds.length) return null;
  return (
    <Section title="Event plan">
      {p.agenda.length > 0 && (
        <Card>
          <ThemedText type="smallStrong">Schedule</ThemedText>
          {p.agenda.map((row) => (
            <View key={`${row.label}${row.value}`} style={styles.agendaRow}>
              <ThemedText type="smallStrong" themeColor="link" style={styles.agendaWhen}>
                {row.label}
              </ThemedText>
              <ThemedText style={styles.fill}>{row.value}</ThemedText>
            </View>
          ))}
        </Card>
      )}
      {p.people.length > 0 && (
        <Card>
          <ThemedText type="smallStrong">Judges, mentors, and speakers</ThemedText>
          <View style={styles.people}>
            {p.people.map((person) => (
              <View key={person.label} style={styles.person}>
                <ThemedText type="bodyStrong">{person.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {person.value}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      )}
      {p.use_of_funds.length > 0 && (
        <Card>
          <ThemedText type="smallStrong">Where the money goes</ThemedText>
          {p.use_of_funds.map((row) => {
            const percent = Number(row.value.match(/(\d+(?:\.\d+)?)\s*%/)?.[1]);
            return (
              <View key={row.label} style={styles.fund}>
                <View style={styles.fundTop}>
                  <ThemedText style={styles.fill}>{row.label}</ThemedText>
                  <ThemedText type="bodyStrong">{row.value}</ThemedText>
                </View>
                {percent > 0 && (
                  <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.bar, { width: `${Math.min(100, percent)}%`, backgroundColor: theme.brand }]} />
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      )}
    </Section>
  );
}

/** "840 KB" or "2.4 MB". */
const fileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** The deck, plan, and media kit: listed for everyone, downloadable once signed in (private bucket). */
export function DocumentsSection({ files }: { files: PostFile[] }) {
  const theme = useTheme();
  const { session } = useSession();
  const [error, setError] = useState<string>();
  if (!files.length) return null;
  const open = async (file: PostFile) => {
    if (!session) return router.push('/login');
    const { data, error: urlError } = await supabase.storage.from('post-files').createSignedUrl(file.path, 300);
    if (urlError) return setError(errorMessage(urlError));
    setError(undefined);
    Linking.openURL(data.signedUrl);
  };
  return (
    <Section title="Documents">
      {files.map((file) => (
        <Pressable key={file.id} role="button" onPress={() => open(file)}>
          <Card style={styles.file}>
            <View style={[styles.fileIcon, { borderColor: theme.border }]}>
              <SymbolView name={{ ios: 'doc.text', android: 'description', web: 'description' }} tintColor={theme.brand} size={24} />
            </View>
            <View style={styles.fill}>
              <ThemedText type="bodyStrong">{file.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {FILE_KIND_LABELS[file.kind]} · PDF · {fileSize(file.size)}
              </ThemedText>
            </View>
            <ThemedText type="smallStrong" themeColor="link">
              {session ? 'Download' : 'Sign in to download'}
            </ThemedText>
          </Card>
        </Pressable>
      ))}
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </Section>
  );
}

/** Proposals due → decision → event → report, and the payment terms. */
export function TimelineSection({ post: p }: { post: PostDetailData }) {
  const steps: [string, string | null][] = [
    ['Proposals due', p.deadline],
    ['Sponsors hear back', p.decision_by],
    [p.kind === 'event' ? 'Event' : 'From', p.starts_on ?? null],
    ['Results report', p.report_by],
  ];
  const shown = steps.filter((s): s is [string, string] => !!s[1]);
  if (shown.length < 2 && !p.payment_terms) return null;
  return (
    <Section title="Timeline and terms">
      <Card>
        {shown.map(([label, date]) => (
          <View key={label} style={styles.agendaRow}>
            <ThemedText type="smallStrong" style={styles.agendaWhen}>
              {formatDate(date)}
            </ThemedText>
            <ThemedText style={styles.fill}>{label}</ThemedText>
          </View>
        ))}
        {p.payment_terms && (
          <ThemedText type="small" themeColor="textSecondary">
            Payment: {p.payment_terms}
          </ThemedText>
        )}
      </Card>
    </Section>
  );
}

/** "4.8★ (6) · 3 deals completed" under the organizer's name. */
export function OrganizerStats({ orgId }: { orgId: string }) {
  const { data } = useQuery({
    queryKey: ['organizations', orgId, 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('org_stats', { org: orgId }).single();
      if (error) throw error;
      return data as { open_posts: number; completed_deals: number; rating: number | null; reviews: number };
    },
  });
  if (!data) return null;
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {[
        data.reviews ? `${data.rating}★ (${data.reviews})` : 'No reviews yet',
        `${data.completed_deals} ${data.completed_deals === 1 ? 'deal' : 'deals'} completed`,
      ].join(' · ')}
    </ThemedText>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="heading" level={2}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  section: { gap: Spacing.two },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  askGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  askCell: { flexGrow: 1, flexBasis: 180, gap: Spacing.half },
  list: { gap: Spacing.one },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  checkCell: { flexGrow: 1, flexBasis: 240 },
  check: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tiers: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tier: { flexGrow: 1, flexBasis: 220, gap: Spacing.two },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  fact: { flexGrow: 1, flexBasis: 150, borderRadius: 12, padding: Spacing.three, gap: Spacing.half },
  agendaRow: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.one },
  agendaWhen: { width: 120 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  person: { flexGrow: 1, flexBasis: 200, gap: Spacing.half },
  fund: { gap: Spacing.one },
  fundTop: { flexDirection: 'row', gap: Spacing.two },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
  file: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  fileIcon: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
