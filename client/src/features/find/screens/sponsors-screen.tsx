import { useQuery } from '@tanstack/react-query';
import { Linking, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { CONTACT_EMAIL } from '@/constants/site';
import { BUDGET_LABELS, CATEGORIES, GIVE_LABELS, type BudgetBand, type Give } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { PostCard } from '@/features/posts/components/post-card';
import { usePostSearch } from '@/features/posts/queries';
import { SitePage } from '@/features/site/components/site-page';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

type Sponsor = {
  id: string;
  handle: string;
  name: string;
  tagline: string | null;
  location: string | null;
  logo_url: string | null;
  gives: Give[];
  budget_band: BudgetBand | null;
  open_sponsor_posts: number;
  completed_deals: number;
  rating: number | null;
  reviews: number;
};

/** /sponsors: organizations that sponsor events, like Wishket's "Find partners", plus their sponsor posts. */
export default function SponsorsScreen() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const { data: sponsors, isPending } = useQuery({
    queryKey: ['sponsors', q, category],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_sponsors', {
        q,
        filters: category ? { category } : {},
      });
      if (error) throw error;
      return data as Sponsor[];
    },
  });
  const posts = usePostSearch('', { kind: 'sponsor', sort: 'recent', ...(category ? { category } : {}) });
  const sponsorPosts = posts.data?.pages.flat() ?? [];

  return (
    <SitePage
      wide
      title="Find sponsors"
      description="Companies that sponsor events: what they give, their budget, and deals completed on Maple."
      path="/sponsors"
      lead="Companies that back events: what they give, their budget, and the deals they completed on Maple.">
      <View style={styles.search}>
        <TextField label="Search sponsors" placeholder="Company name" value={q} onChangeText={setQ} />
        <ChoiceChips
          label="Event type"
          options={[{ value: '', label: 'Any' }, ...CATEGORIES]}
          value={category}
          onChange={setCategory}
        />
      </View>

      {isPending ? (
        <Loading />
      ) : sponsors?.length ? (
        <View style={styles.grid}>
          {sponsors.map((s) => (
            <SponsorCard key={s.id} sponsor={s} />
          ))}
        </View>
      ) : (
        <Card>
          <ThemedText type="subheading">No sponsors match yet</ThemedText>
          <ThemedText themeColor="textSecondary">
            Maple is in early access. Tell us about your event and we’ll introduce sponsors by hand.
          </ThemedText>
          <Button
            title="Tell us what you need"
            variant="secondary"
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Find me sponsors')}`)}
          />
        </Card>
      )}

      {sponsorPosts.length > 0 && (
        <>
          <ThemedText type="heading" level={2}>
            Sponsor posts
          </ThemedText>
          {sponsorPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </>
      )}
    </SitePage>
  );
}

function SponsorCard({ sponsor: s }: { sponsor: Sponsor }) {
  const numbers = [
    s.open_sponsor_posts ? `${s.open_sponsor_posts} open ${s.open_sponsor_posts === 1 ? 'post' : 'posts'}` : null,
    `${s.completed_deals} ${s.completed_deals === 1 ? 'deal' : 'deals'} completed`,
    s.reviews ? `${s.rating}★ (${s.reviews})` : null,
  ].filter(Boolean);
  return (
    <View style={styles.cell}>
      <Card href={`/org/${s.handle}`}>
        <View style={styles.head}>
          <OrgLogo name={s.name} url={s.logo_url} size={56} />
          <View style={styles.headText}>
            <ThemedText type="subheading">{s.name}</ThemedText>
            {s.location && (
              <ThemedText type="small" themeColor="textSecondary">
                {s.location}
              </ThemedText>
            )}
          </View>
        </View>
        {s.tagline && (
          <ThemedText type="small" numberOfLines={2}>
            {s.tagline}
          </ThemedText>
        )}
        {s.gives.length > 0 && (
          <ThemedText type="small">
            <ThemedText type="smallStrong">Gives: </ThemedText>
            {s.gives.map((g) => GIVE_LABELS[g]).join(', ')}
          </ThemedText>
        )}
        {s.budget_band && (
          <ThemedText type="small">
            <ThemedText type="smallStrong">Budget per event: </ThemedText>
            {BUDGET_LABELS[s.budget_band]}
          </ThemedText>
        )}
        <ThemedText type="caption" themeColor="textSecondary">
          {numbers.join(' · ')}
        </ThemedText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  cell: { flexGrow: 1, flexBasis: 320, maxWidth: 560 },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headText: { flex: 1 },
});
