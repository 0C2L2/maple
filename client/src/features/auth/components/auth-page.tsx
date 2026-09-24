import { Link, Redirect, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { PASSWORD_RULE } from '@/features/auth/components/password-field';
import { useSession } from '@/features/auth/session';
import { errorMessage } from '@/lib/supabase';
import { Loading } from '@/ui/loading';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

// The frame shared by sign-in, sign-up, and password reset: a way home, a title, the form, and a link to
// the other page.
export function AuthPage({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Screen title={title} width="form">
      <Link href="/" style={styles.home}>
        <ThemedText type="smallStrong" themeColor="link">
          ← Maple home
        </ThemedText>
      </Link>
      <View style={styles.header}>
        <ThemedText type="title" level={1}>
          {title}
        </ThemedText>
        {subtitle && <ThemedText themeColor="textSecondary">{subtitle}</ThemedText>}
      </View>
      {children}
      {footer}
    </Screen>
  );
}

/** "New to Maple? Create an account" */
export function AuthSwitch({ lead, label, href }: { lead: string; label: string; href: Href }) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.switch}>
      {lead}{' '}
      <Link href={href}>
        <ThemedText type="bodyStrong" themeColor="link">
          {label}
        </ThemedText>
      </Link>
    </ThemedText>
  );
}

/** A link-styled button, e.g. "Send a new code". */
export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable role="button" onPress={onPress} hitSlop={8}>
      <ThemedText type="smallStrong" themeColor="link">
        {label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Where a signed-in visitor goes from an auth page: Find, or onboarding to create their organization page.
 * Returns null when signed out.
 */
export function useSignedInRedirect(role?: string): ReactNode {
  const { session, org, isLoading } = useSession();
  if (!session) return null;
  if (isLoading) return <Loading />;
  return org ? <Redirect href="/find" /> : <Redirect href={{ pathname: '/onboarding', params: role ? { role } : {} }} />;
}

// Supabase Auth error codes users can hit, as plain sentences.
export function authMessage(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email or password is wrong.';
    case 'weak_password':
      return PASSWORD_RULE;
    case 'same_password':
      return 'Choose a password different from your current one.';
    case 'captcha_failed':
      return "The security check didn't pass. Try again.";
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many tries. Wait a minute and try again.';
    case 'reauthentication_needed':
      return 'For your security, sign out and sign in again, then change your password.';
    default:
      return errorMessage(error);
  }
}

const styles = StyleSheet.create({
  home: { alignSelf: 'flex-start' },
  header: { gap: Spacing.two, marginTop: Spacing.three },
  switch: { textAlign: 'center', marginTop: Spacing.two },
});
