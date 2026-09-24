import { Redirect } from 'expo-router';
import { type ReactElement } from 'react';

import { useSession } from '@/features/auth/session';
import { Loading } from '@/ui/loading';

/**
 * Wraps one screen (a navigator's `screenLayout`): waits for the session, sends accounts without an
 * organization to onboarding, and sends signed-out visitors to /login unless the screen is public.
 * Gating screens instead of the whole layout lets navigators mount on the first render, so they keep the
 * URL's route (a layout that rendered a spinner first made its stack fall back to another route).
 */
export function Gate({ isPublic, children }: { isPublic: boolean; children: ReactElement }) {
  const { session, org, isLoading } = useSession();
  if (isLoading) return <Loading />;
  if (session && !org) return <Redirect href="/onboarding" />;
  if (!session && !isPublic) return <Redirect href="/login" />;
  return children;
}
