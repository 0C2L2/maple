import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { SITE_URL } from '@/constants/site';
import { Colors } from '@/constants/theme';

// Web only: the HTML shell around every pre-rendered page. Per-page titles and descriptions
// come from <PageMeta />.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content={Colors.light.brand} />
        <meta property="og:site_name" content="Maple" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preload" href="/fonts/geist-latin-wght.woff2" as="font" type="font/woff2" crossOrigin="" />
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: savedTheme }} />
        <style dangerouslySetInnerHTML={{ __html: pageBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Applies the theme picked on the website (same key as use-color-scheme.web.ts) before the first paint.
const savedTheme = `try{var t=localStorage.getItem('maple-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

// Same background as the app, so dark mode doesn't flash white before React loads. A saved choice beats
// the device setting.
const pageBackground = `
body { background-color: ${Colors.light.background}; }
@media (prefers-color-scheme: dark) { :root { color-scheme: dark; } body { background-color: ${Colors.dark.background}; } }
html[data-theme="light"] { color-scheme: light; }
html[data-theme="light"] body { background-color: ${Colors.light.background}; }
html[data-theme="dark"] { color-scheme: dark; }
html[data-theme="dark"] body { background-color: ${Colors.dark.background}; }`;
