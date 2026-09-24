import Head from 'expo-router/head';

import { SITE_URL } from '@/constants/site';

type Props = { title: string; description?: string; path?: string };

// Per-page <title>, description, and Open Graph tags (web). Site-wide tags live in app/+html.tsx.
export function PageMeta({ title, description, path }: Props) {
  const fullTitle = title === 'Maple' ? title : `${title} · Maple`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta property="og:title" content={fullTitle} />
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      {path !== undefined && <link rel="canonical" href={SITE_URL + path} />}
      {path !== undefined && <meta property="og:url" content={SITE_URL + path} />}
    </Head>
  );
}
