import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  ATTENDANCE_LABELS,
  AUDIENCE_LABELS,
  BUDGET_LABELS,
  CATEGORY_LABELS,
  GIVE_LABELS,
  POST_KIND_LABELS,
  REGION_LABELS,
  type Region,
} from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { MapEmbed, mapsUrl } from '@/features/posts/components/map-embed';
import { setPostStatus, setSaved, sendProposal } from '@/features/posts/mutations';
import {
  AskCard,
  DocumentsSection,
  OrganizerStats,
  PlanSection,
  postState,
  ProofSection,
  StatusBanner,
  TierTable,
  TimelineSection,
  ValueSection,
} from '@/features/posts/components/pitch-sections';
import { useIsSaved, usePost, useProposalCount, useTierSlots, type PostDetailData } from '@/features/posts/queries';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useTheme } from '@/hooks/use-theme';
import { ReportLink } from '@/features/safety/components/report-link';
import { formatDate, formatMoney, toMinor } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

/** /posts/[id] */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = usePost(id);
  return (
    <Screen title={data?.title ?? 'Post'} width="wide">
      <PostDetail id={id} />
    </Screen>
  );
}

// The full post: used by its own page (signed-in and public) and by the Find two-pane detail.
export function PostDetail({ id }: { id: string }) {
  const { session, org } = useSession();
  const { data: p, isPending, isError } = usePost(id);
  const [width, setWidth] = useState(0);
  const [tierId, setTierId] = useState<string | null>(null);
  const { data: slots = {} } = useTierSlots(id);

  // Counts as a view for the owner's insights (not for the owner or visitors).
  useEffect(() => {
    if (p && org && org.id !== p.owner_id) supabase.rpc('record_post_view', { post: p.id });
  }, [p, org]);

  if (isPending) return <Loading />;
  if (!p)
    return (
      <Notice
        title={isError ? "Couldn't load this post" : 'Post not found'}
        body={isError ? 'Check your connection and try again.' : 'It may have been closed or deleted.'}
        action={{ title: 'Find posts', href: '/find' }}
      />
    );

  const isOwner = session?.user.id === p.owner_id;
  const twoColumns = width >= 760;
  // The map searches the venue address when there is one, else the city.
  const mapQuery = p.online ? null : p.venue || p.city;
  const details = postDetails(p);
  const state = postState(p);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.detail, twoColumns && styles.detailWide]}>
      <View style={twoColumns ? styles.side : styles.stack}>
        {p.cover_url ? <Image source={p.cover_url} style={styles.cover} contentFit="cover" /> : null}
        <Card>
          <ThemedText type="caption" themeColor="textSecondary">
            {p.kind === 'event' ? 'HOSTED BY' : 'POSTED BY'}
          </ThemedText>
          <Link href={`/org/${p.owner.handle}`} asChild>
            <Pressable style={styles.owner}>
              <OrgLogo name={p.owner.name} url={p.owner.logo_url} size={48} />
              <View style={styles.ownerText}>
                <ThemedText type="bodyStrong">{p.owner.name}</ThemedText>
                {p.owner.tagline && (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {p.owner.tagline}
                  </ThemedText>
                )}
              </View>
            </Pressable>
          </Link>
          {p.owner_id && <OrganizerStats orgId={p.owner_id} />}
        </Card>
        {twoColumns && <DetailsCard rows={details} />}
        {!isOwner && <ReportLink type="post" id={p.id} />}
      </View>

      <View style={twoColumns ? styles.main : styles.stack}>
        <View style={styles.header}>
          <ThemedText type="caption" themeColor="link">
            {POST_KIND_LABELS[p.kind].toUpperCase()}
            {p.status !== 'open' ? ` · ${p.status.toUpperCase()}` : ''}
          </ThemedText>
          <ThemedText type="title" level={1}>
            {p.title}
          </ThemedText>
        </View>
        <StatusBanner post={p} />

        {p.starts_on && (
          <InfoRow
            badge={<DateBadge date={p.starts_on} />}
            title={dateLine(p.starts_on, p.ends_on)}
            sub={p.deadline ? `Proposals by ${formatDate(p.deadline)}` : undefined}
          />
        )}
        {(p.online || mapQuery) && (
          <InfoRow
            icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
            title={p.online ? 'Online' : (p.venue ?? p.city ?? '')}
            sub={p.online ? undefined : p.venue && p.city ? p.city : undefined}
            onPress={mapQuery ? () => Linking.openURL(mapsUrl(mapQuery)) : undefined}
          />
        )}

        <AskCard post={p} slots={slots} />
        {isOwner ? (
          <OwnerPanel post={p} />
        ) : (
          <ProposalPanel post={p} tierId={tierId} onTierChange={setTierId} open={state.open} />
        )}

        {p.body ? (
          <Block title={p.kind === 'event' ? 'About the event' : 'About'}>
            {p.body.split('\n\n').map((paragraph) => (
              <ThemedText key={paragraph}>{paragraph}</ThemedText>
            ))}
          </Block>
        ) : null}
        <ValueSection post={p} />
        {!twoColumns && <DetailsCard rows={details} />}

        <TierTable post={p} slots={slots} chosen={tierId} onChoose={!isOwner && state.open ? setTierId : undefined} />
        <ProofSection post={p} />
        <PlanSection post={p} />
        <DocumentsSection files={p.post_files} />
        <TimelineSection post={p} />

        {mapQuery && (
          <Block title="Location">
            <ThemedText type="bodyStrong">{p.venue ?? p.city}</ThemedText>
            <MapEmbed query={mapQuery} />
            <View style={styles.mapAction}>
              <Button title="Open in Google Maps" variant="secondary" onPress={() => Linking.openURL(mapsUrl(mapQuery))} />
            </View>
          </Block>
        )}
      </View>
    </View>
  );
}

/** Key facts as label/value rows, like the project fields on a Wishket portfolio page. */
const postDetails = (p: PostDetailData): [string, string][] => {
  const event = p.kind === 'event';
  const rows: [string, string | null][] = [
    ['Type', POST_KIND_LABELS[p.kind]],
    ['Event types', p.categories.map((c) => CATEGORY_LABELS[c]).join(', ')],
    ['Region', p.regions.map((r) => REGION_LABELS[r as Region] ?? r).join(', ')],
    ['Audience', p.audience_types.map((a) => AUDIENCE_LABELS[a]).join(', ')],
    [event ? 'Expected attendance' : 'Event size wanted', p.attendance_band && ATTENDANCE_LABELS[p.attendance_band]],
    [
      event ? 'Sponsorship goal' : 'Budget per event',
      p.goal_cents != null ? formatMoney(p.goal_cents, p.currency) : p.budget_band && BUDGET_LABELS[p.budget_band],
    ],
    [event ? 'Support needed' : 'Support offered', p.supports.map((g) => GIVE_LABELS[g]).join(', ')],
    ['Proposals by', p.deadline && formatDate(p.deadline)],
  ];
  return rows.filter((row): row is [string, string] => !!row[1]);
};

/** "Thursday, September 24 – Friday, September 25, 2026" */
const dateLine = (start: string, end: string | null) => {
  const day = (d: string, year: boolean) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      ...(year ? { year: 'numeric' } : {}),
    });
  return end && end !== start ? `${day(start, false)} – ${day(end, true)}` : day(start, true);
};

// The calendar tile next to the date, like Luma's.
function DateBadge({ date }: { date: string }) {
  const d = new Date(`${date}T00:00:00`);
  return (
    <>
      <ThemedText type="caption" themeColor="textSecondary">
        {d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
      </ThemedText>
      <ThemedText type="bodyStrong">{d.getDate()}</ThemedText>
    </>
  );
}

function InfoRow({
  badge,
  icon,
  title,
  sub,
  onPress,
}: {
  badge?: ReactNode;
  icon?: SymbolViewProps['name'];
  title: string;
  sub?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <View style={styles.info}>
      <View style={[styles.infoIcon, { borderColor: theme.border }]}>
        {badge ?? (icon && <SymbolView name={icon} tintColor={theme.text} size={22} />)}
      </View>
      <View style={styles.infoText}>
        <ThemedText type="bodyStrong">{title}</ThemedText>
        {sub && (
          <ThemedText type="small" themeColor="textSecondary">
            {sub}
          </ThemedText>
        )}
      </View>
    </View>
  );
  return onPress ? (
    <Pressable role="link" onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

function DetailsCard({ rows }: { rows: [string, string][] }) {
  if (!rows.length) return null;
  return (
    <Card>
      <ThemedText type="subheading" level={2}>
        Details
      </ThemedText>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.detailRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {label}
          </ThemedText>
          <ThemedText type="smallStrong">{value}</ThemedText>
        </View>
      ))}
    </Card>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="heading" level={2}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function ProposalPanel({
  post: p,
  tierId,
  onTierChange,
  open,
}: {
  post: PostDetailData;
  /** Chosen here or with "Choose this package" in the packages table. */
  tierId: string | null;
  onTierChange: (tierId: string | null) => void;
  /** False after the deadline or the event (postState). */
  open: boolean;
}) {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const me = session?.user.id;
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const tiers = [...p.post_tiers].sort((a, b) => a.position - b.position);

  const { data: mine } = useMyProposal(p.id, me);

  if (mine)
    return (
      <Card>
        <ThemedText type="bodyStrong">You proposed on this · {mine.status.replace('_', ' ')}</ThemedText>
        {mine.thread_id && (
          <Button title="Open the conversation" variant="secondary" onPress={() => router.push(`/messages/${mine.thread_id}`)} />
        )}
      </Card>
    );
  if (!open) return <ThemedText themeColor="textSecondary">This post is no longer taking proposals.</ThemedText>;

  const send = async () => {
    if (!me) return router.push('/login');
    if (!message.trim()) return setError('Write a short message with your proposal.');
    const cents = amount ? toMinor(amount, p.currency) : null;
    if (amount && !(cents != null && cents >= 0)) return setError('Amount must be a number, like 2500.');
    setBusy(true);
    setError(undefined);
    try {
      const threadId = await sendProposal(p.id, message.trim(), tierId, cents);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      router.push(`/messages/${threadId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    setBusy(false);
  };

  return (
    <Card>
      <View style={styles.panelHead}>
        <ThemedText type="subheading">Send a proposal</ThemedText>
        {me && <SaveButton postId={p.id} />}
      </View>
      {tiers.length > 0 && (
        <ChoiceChips
          label="Tier (optional)"
          options={[{ value: '', label: 'No tier' }, ...tiers.map((t) => ({ value: t.id, label: t.price_cents != null ? `${t.name} · ${formatMoney(t.price_cents, p.currency)}` : t.name }))]}
          value={tierId ?? ''}
          onChange={(v) => onTierChange(v || null)}
        />
      )}
      {me && (
        <>
          <TextField
            label="Message"
            placeholder={p.kind === 'event' ? 'Why your company fits this event' : 'Why your event fits'}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
            style={{ minHeight: 100 }}
          />
          <TextField
            label={`Amount in ${p.currency} (optional)`}
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </>
      )}
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
      <Button title={busy ? 'Sending…' : me ? 'Send proposal' : 'Sign in to propose'} onPress={send} disabled={busy} />
    </Card>
  );
}

// The viewer's own proposal on this post, if any (RLS limits it to their own row).
function useMyProposal(postId: string, me: string | undefined) {
  return useQuery({
    queryKey: ['proposals', 'mine', postId, me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('status, thread_id')
        .eq('post_id', postId)
        .eq('from_id', me!)
        .maybeSingle();
      if (error) throw error;
      return data as { status: string; thread_id: string | null } | null;
    },
  });
}

export function SaveButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const { org } = useSession();
  const { data: saved } = useIsSaved(postId, org?.id);
  const [failed, setFailed] = useState(false);
  if (!org) return null;
  const toggle = async () => {
    try {
      await setSaved(postId, !saved);
      setFailed(false);
      queryClient.invalidateQueries({ queryKey: ['posts', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'saved-state'] });
    } catch {
      setFailed(true);
    }
  };
  return <Button title={failed ? 'Try again' : saved ? 'Saved ✓' : 'Save'} variant="secondary" onPress={toggle} />;
}

function OwnerPanel({ post: p }: { post: PostDetailData }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const { data: count } = useProposalCount(p.id);

  const changeStatus = async (status: 'open' | 'closed' | 'draft') => {
    try {
      await setPostStatus(p.id, status);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <View style={styles.ownerPanel}>
      <Button title={`View proposals (${count ?? 0})`} onPress={() => router.push('/proposals')} />
      <Button title="Edit" variant="secondary" onPress={() => router.push(`/posts/${p.id}/edit`)} />
      {p.status === 'draft' ? (
        // Publishing goes through the form, so a draft gets the same checks (like the event date).
        <Button title="Finish and publish" variant="secondary" onPress={() => router.push(`/posts/${p.id}/edit`)} />
      ) : (
        <Button
          title={p.status === 'open' ? 'Close to new proposals' : 'Reopen'}
          variant="secondary"
          onPress={() => changeStatus(p.status === 'open' ? 'closed' : 'open')}
        />
      )}
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detail: { gap: Spacing.four },
  detailWide: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.five },
  side: { width: 320, gap: Spacing.three },
  main: { flex: 1, minWidth: 0, gap: Spacing.four },
  stack: { gap: Spacing.four },
  cover: { width: '100%', aspectRatio: 1, borderRadius: 16 },
  info: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  infoIcon: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1 },
  detailRow: { gap: Spacing.half },
  mapAction: { alignSelf: 'flex-start' },
  header: { gap: Spacing.one },
  owner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ownerText: { flex: 1 },
  ownerPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { gap: Spacing.two },
  tierTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
});
