import { supabase } from '@/lib/supabase';

// The MVP §4.14 events that exist in v1. Billing and Boost events arrive with Stripe in v1.1 (D-024).
export type AnalyticsEvent =
  | 'signup_completed'
  | 'role_selected'
  | 'profile_completed'
  | 'post_created'
  | 'search_performed'
  | 'search_result_clicked'
  | 'proposal_sent'
  | 'proposal_status_changed'
  | 'message_sent'
  | 'matched_conversation'
  | 'deal_won'
  | 'deal_completed'
  | 'review_left';

const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Sends one event to PostHog's capture API. Without a key (local development) it does nothing.
// ponytail: plain fetch instead of the PostHog SDK; switch when we need feature flags or session replay.
export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (!key) return;
  supabase.auth.getSession().then(({ data }) =>
    fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: data.session?.user.id ?? 'anonymous',
        properties: { ...properties, platform: process.env.EXPO_OS },
      }),
    }).catch(() => {}), // analytics must never break the app
  );
}
