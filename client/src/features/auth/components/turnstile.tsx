import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// The apps show the same Cloudflare Turnstile check as the website (turnstile.web.tsx), in a small web view
// that loads as if from mapleapp.tech, the hostname the site key allows.
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
export const CAPTCHA = !!SITE_KEY;

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  if (!SITE_KEY) return null;
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: page(SITE_KEY), baseUrl: 'https://mapleapp.tech' }}
      onMessage={(e) => onToken(e.nativeEvent.data || null)}
      style={styles.view}
    />
  );
}

const page = (key: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head><body style="margin:0;background:transparent">
<div class="cf-turnstile" data-sitekey="${key}" data-size="flexible" data-callback="done"
  data-expired-callback="gone" data-error-callback="gone"></div>
<script>
function done(t) { window.ReactNativeWebView.postMessage(t); }
function gone() { window.ReactNativeWebView.postMessage(''); }
</script></body></html>`;

const styles = StyleSheet.create({
  view: { height: 70, backgroundColor: 'transparent' },
});
