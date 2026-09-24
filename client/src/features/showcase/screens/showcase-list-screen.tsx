import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ShowcaseCard } from '@/features/showcase/components/showcase-card';
import { useShowcases } from '@/features/showcase/queries';
import { SitePage } from '@/features/site/components/site-page';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';

/** /showcase: past events on Maple, like Wishket's portfolio. */
export default function ShowcaseListScreen() {
  const { data, isPending } = useShowcases();
  return (
    <SitePage
      wide
      title="Showcase"
      description="Events run by organizations on Maple: what happened, who sponsored, and the results."
      path="/showcase"
      lead="Events run by organizations on Maple: what happened, who sponsored, and the results.">
      {isPending ? (
        <Loading />
      ) : !data?.length ? (
        <Notice
          title="No showcases yet"
          body="After your event, show sponsors what happened: photos, numbers, and results."
          action={{ title: 'Post your event', href: '/posts/new' }}
        />
      ) : (
        <View style={styles.grid}>
          {data.map((s) => (
            <ShowcaseCard key={s.id} showcase={s} />
          ))}
        </View>
      )}
    </SitePage>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four },
});
