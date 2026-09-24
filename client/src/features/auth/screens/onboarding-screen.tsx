import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { type Role } from '@/constants/taxonomy';
import { useSession } from '@/features/auth/session';
import { OrgForm } from '@/features/organizations/components/org-form';
import { Loading } from '@/ui/loading';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

// Every account is one organization (D-025): after the first sign-in, create its page.
export default function OnboardingScreen() {
  const { session, org, isLoading } = useSession();
  const { role } = useLocalSearchParams<{ role?: string }>();

  if (isLoading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (org) return <Redirect href="/find" />;

  return (
    <Screen title="Create your organization page" width="form">
      <ThemedText type="title" level={1}>
        Create your organization page
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Maple is for organizations: event organizers and the companies that sponsor them. Your page is what other
        organizations see. You can edit everything except your role and page address later.
      </ThemedText>
      <OrgForm
        initialRole={role === 'organizer' || role === 'sponsor' ? (role as Role) : undefined}
        onSaved={() => router.replace('/find')}
      />
    </Screen>
  );
}
