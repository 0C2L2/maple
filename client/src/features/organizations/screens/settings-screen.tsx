import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { authMessage } from '@/features/auth/components/auth-page';
import { PASSWORD_RULE, PasswordField, STRONG_PASSWORD } from '@/features/auth/components/password-field';
import { useSession } from '@/features/auth/session';
import { DeleteAccount } from '@/features/organizations/components/delete-account';
import { OrgForm } from '@/features/organizations/components/org-form';
import { useIsStaff } from '@/features/safety/use-is-staff';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Loading } from '@/ui/loading';
import { Screen } from '@/ui/screen';
import { ThemeMenu } from '@/ui/theme-menu';
import { ThemedText } from '@/ui/themed-text';

export default function SettingsScreen() {
  const { org, session } = useSession();
  const { isStaff } = useIsStaff();
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
      <ChangePassword />
      {/* Phones have no top bar on the website, so the mode menu lives here too. */}
      {Platform.OS === 'web' && (
        <View style={[styles.row, styles.appearance]}>
          <ThemedText type="bodyStrong" style={styles.fill}>
            Appearance
          </ThemedText>
          <ThemeMenu />
        </View>
      )}
      {isStaff && <Button title="Maple admin" variant="secondary" onPress={() => router.push('/admin')} />}
      <Button
        title="Sign out"
        variant="secondary"
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }}
      />
      <DeleteAccount org={org} />
    </Screen>
  );
}

// Change the password, or set a first one for an account that signed up with Google. The server asks for a
// recent sign-in first (secure_password_change), and authMessage explains that case.
function ChangePassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!STRONG_PASSWORD.test(password)) return setError(PASSWORD_RULE);
    setBusy(true);
    setError(undefined);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authMessage(error));
    setPassword('');
    setSaved(true);
  };

  return (
    <View style={styles.password}>
      <ThemedText type="heading" level={2}>
        Password
      </ThemedText>
      <PasswordField
        label="New password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setSaved(false);
        }}
        onSubmitEditing={save}
        autoComplete="new-password"
        textContentType="newPassword"
        error={error}
      />
      <Button title={busy ? 'Saving…' : 'Change password'} variant="secondary" onPress={save} disabled={busy} />
      {saved && (
        <ThemedText role="status" themeColor="textSecondary">
          Password changed.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  password: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  // Above the buttons below it, so the open menu isn't covered.
  appearance: { zIndex: 10 },
  fill: { flex: 1 },
});
