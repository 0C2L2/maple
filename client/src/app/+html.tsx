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
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: pageBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Same background as the app, so dark mode doesn't flash white before React loads.
const pageBackground = `
body { background-color: ${Colors.light.background}; }
@media (prefers-color-scheme: dark) { body { background-color: ${Colors.dark.background}; } }`;
