import { router } from 'expo-router';

import { useSession } from '@/features/auth/session';
import { OrgForm } from '@/features/organizations/components/org-form';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Loading } from '@/ui/loading';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

export default function SettingsScreen() {
  const { org, session } = useSession();
  if (!org) return <Loading />;

  return (
    <Screen title="Settings" width="form">
      <ThemedText type="title" level={1}>
        Edit our page
      </ThemedText>
      <OrgForm org={org} onSaved={() => router.push(`/org/${org.handle}`)} />

      <ThemedText type="small" themeColor="textSecondary">
        Signed in as {session?.user.email}. Only you see this email.
      </ThemedText>
      <Button
        title="Sign out"
        variant="secondary"
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }}
      />
    </Screen>
  );
}
