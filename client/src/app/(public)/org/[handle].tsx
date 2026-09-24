// Organization pages render in the browser from the database; the build writes org/404.html as the
// fallback (scripts/finalize-web-export.mjs). Pre-render real pages here when SEO needs it.
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [];
}

export { default } from '@/features/organizations/screens/org-screen';
