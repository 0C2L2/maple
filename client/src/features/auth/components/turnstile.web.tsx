import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Cloudflare Turnstile, verified by Supabase Auth (supabase/config.toml [auth.captcha]). A token works once,
// so forms remount this with a new `key` after each attempt.
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
export const CAPTCHA = !!SITE_KEY;

type TurnstileApi = { render: (el: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
let script: Promise<TurnstileApi> | undefined;

function load() {
  script ??= new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    tag.async = true;
    tag.onload = () => resolve((window as unknown as { turnstile: TurnstileApi }).turnstile);
    tag.onerror = () => {
      script = undefined;
      reject(new Error('Turnstile did not load'));
    };
    document.head.appendChild(tag);
  });
  return script;
}

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const box = useRef<View>(null);
  const latest = useRef(onToken);
  const scheme = useColorScheme();
  useEffect(() => {
    latest.current = onToken;
  });
  useEffect(() => {
    if (!SITE_KEY) return;
    let api: TurnstileApi | undefined;
    let id: string | undefined;
    let live = true;
    load().then(
      (turnstile) => {
        if (!live || !box.current) return;
        api = turnstile;
        // React Native Web views are DOM elements.
        id = turnstile.render(box.current as unknown as HTMLElement, {
          sitekey: SITE_KEY,
          theme: scheme === 'dark' ? 'dark' : 'light',
          size: 'flexible',
          callback: (token: string) => latest.current(token),
          'expired-callback': () => latest.current(null),
          'error-callback': () => latest.current(null),
        });
      },
      () => latest.current(null),
    );
    return () => {
      live = false;
      if (id) api?.remove(id);
    };
  }, [scheme]);

  if (!SITE_KEY) return null;
  return <View ref={box} style={{ minHeight: 65 }} />;
}
