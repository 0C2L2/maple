// Renders in the browser from the database; the build writes posts/404.html as the fallback.
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [];
}

export { default } from '@/features/posts/screens/post-screen';
