import { Pressable, StyleSheet, View } from 'react-native';

import {
  ATTENDANCE_LABELS,
  BUDGET_LABELS,
  CATEGORY_LABELS,
  POST_KIND_LABELS,
  REGION_LABELS,
  type AttendanceBand,
  type BudgetBand,
  type Category,
  type PostKind,
  type PostStatus,
  type Region,
} from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, timeAgo } from '@/lib/format';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

/** A marketplace post in a list. The row shape of `search_posts` (SHARED_CONTRACTS §3). */
export type PostCardData = {
  id: string;
  kind: PostKind;
  title: string;
  categories: Category[];
  regions: string[];
  budget_band: BudgetBand | null;
  attendance_band: AttendanceBand | null;
  deadline: string | null;
  status?: PostStatus;
  starts_on?: string | null;
  city?: string | null;
  online?: boolean;
  created_at?: string;
  proposal_count?: number | null;
  owner_id?: string;
  owner_name?: string | null;
  owner_handle?: string | null;
  owner_logo_url?: string | null;
  boosted?: boolean;
};

// Columns to select from `posts` for a card.
export const POST_CARD_COLUMNS =
  'id, kind, title, categories, regions, budget_band, attendance_band, deadline, status, starts_on, city, online, created_at, owner_id';

export const postHref = (id: string) => `/posts/${id}` as const;

/** Event types, regions, budget, size, dates, and deadline as short labels. */
export const postFacts = (p: PostCardData) => {
  const when = p.starts_on ? formatDate(p.starts_on) : null;
  const where = p.online ? 'Online' : p.city;
  return [
    ...p.categories.map((c) => CATEGORY_LABELS[c]),
    ...p.regions.map((r) => REGION_LABELS[r as Region] ?? r),
    p.budget_band && `${p.kind === 'event' ? 'Goal' : 'Budget'} ${BUDGET_LABELS[p.budget_band]}`,
    p.attendance_band && `${ATTENDANCE_LABELS[p.attendance_band]} attendees`,
    when && where ? `${when} · ${where}` : (when ?? where),
    p.deadline && `Apply by ${formatDate(p.deadline)}`,
  ].filter(Boolean) as string[];
};

type Props = {
  post: PostCardData;
  /** Runs before opening the post page (analytics). */
  onPress?: () => void;
  /** Two-pane lists: pick the post instead of opening its page. */
  onSelect?: () => void;
  selected?: boolean;
};

// One post in a list, like a job card: owner logo, title, owner, key facts, proposal count.
export function PostCard({ post: p, onPress, onSelect, selected }: Props) {
  const theme = useTheme();
  const facts = postFacts(p);
  const content = (
    <View style={styles.row}>
      {p.owner_name && <OrgLogo name={p.owner_name} url={p.owner_logo_url} size={48} />}
      <View style={styles.text}>
        <ThemedText type="caption" themeColor="link">
          {p.boosted ? 'BOOSTED · ' : ''}
          {POST_KIND_LABELS[p.kind].toUpperCase()}
          {p.status && p.status !== 'open' ? ` · ${p.status.toUpperCase()}` : ''}
        </ThemedText>
        <ThemedText type="subheading">{p.title}</ThemedText>
        {p.owner_name ? <ThemedText type="small">{p.owner_name}</ThemedText> : null}
        {facts.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            {facts.join(' · ')}
          </ThemedText>
        )}
        <ThemedText type="caption" themeColor="textSecondary">
          {[
            typeof p.proposal_count === 'number'
              ? `${p.proposal_count} ${p.proposal_count === 1 ? 'proposal' : 'proposals'}`
              : null,
            p.created_at ? timeAgo(p.created_at) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      </View>
    </View>
  );

  if (onSelect)
    return (
      <Pressable role="button" aria-pressed={selected} onPress={onSelect}>
        <Card style={selected ? { borderColor: theme.brand, backgroundColor: theme.backgroundElement } : undefined}>
          {content}
        </Card>
      </Pressable>
    );
  return (
    <Card href={postHref(p.id)} onPress={onPress}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  text: { flex: 1, gap: Spacing.half },
});
