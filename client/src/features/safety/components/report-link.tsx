import { Link } from 'expo-router';

import { type ReportTarget } from '@/features/safety/report-reasons';
import { ThemedText } from '@/ui/themed-text';

// "Report" under posts, organization pages, and reviews. /report asks signed-out visitors to sign in first.
export function ReportLink({ type, id }: { type: ReportTarget; id: string }) {
  return (
    <Link href={{ pathname: '/report', params: { type, id } }}>
      <ThemedText type="small" themeColor="textSecondary">
        Report
      </ThemedText>
    </Link>
  );
}
