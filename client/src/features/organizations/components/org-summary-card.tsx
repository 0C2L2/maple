import { useQuery } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgBanner, OrgLogo } from '@/features/organizations/components/org-logo';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

/** Follower count for an organization. */
export function useFollowerCount(orgId: string | undefined) {
  return useQuery({
    queryKey: ['follows', 'count', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// Home's left column: your own organization at a glance, like LinkedIn's profile card.
export function OrgSummaryCard() {
  const theme = useTheme();
  const { org } = useSession();
  const { data: followers } = useFollowerCount(org?.id);
  if (!org) return null;

  return (
    <Card style={styles.card}>
      <OrgBanner url={org.banner_url} height={56} />
      <View style={styles.body}>
        <View style={[styles.logo, { borderColor: theme.background }]}>
          <OrgLogo name={org.name} url={org.logo_url} size={64} />
        </View>
        <Link href={`/org/${org.handle}`}>
          <ThemedText type="subheading">{org.name}</ThemedText>
        </Link>
        {org.tagline && (
          <ThemedText type="small" themeColor="textSecondary">
            {org.tagline}
          </ThemedText>
        )}
      </View>
      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Followers <ThemedText type="smallStrong">{followers ?? 0}</ThemedText>
        </ThemedText>
      </View>
      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <RailLink href="/posts/new" label={org.role === 'sponsor' ? 'Post what you sponsor' : 'Post your event'} />
        <RailLink href="/my-posts" label="My posts" />
        <RailLink href="/proposals" label="Proposals" />
      </View>
    </Card>
  );
}

function RailLink({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href}>
      <ThemedText type="smallStrong">{label}</ThemedText>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, gap: 0, overflow: 'hidden' },
  body: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.one },
  logo: { marginTop: -32, alignSelf: 'flex-start', borderWidth: 3, borderRadius: 14 },
  section: { borderTopWidth: 1, padding: Spacing.three, gap: Spacing.two },
});
