// Runs after `expo export --platform web` (npm run build:web), before deploying dist/ to Cloudflare.
//
// Cloudflare's "404-page" mode serves the nearest 404.html when no file matches a URL. Copying each
// dynamic route's template (e.g. org/[handle].html) to its folder's 404.html means /org/any-handle loads
// the organization page, which then fetches its data in the browser. Pages pre-rendered with
// generateStaticParams still win because a real file matches first.
import { copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';

copyFileSync(join(dist, '+not-found.html'), join(dist, '404.html'));
rmSync(join(dist, '_sitemap.html'), { force: true }); // Expo's list of every route; not for the public site

for (const file of readdirSync(dist, { recursive: true })) {
  const parts = String(file).split(/[\\/]/);
  const dynamic = parts.findIndex((part) => part.startsWith('['));
  // Skip non-dynamic files and the duplicate copies Expo writes under group folders like (public)/.
  if (dynamic < 1 || parts[0].startsWith('(') || !file.endsWith('.html')) continue;
  copyFileSync(join(dist, file), join(dist, ...parts.slice(0, dynamic), '404.html'));
}

// Fail the build loudly if the route layout changes and the fallbacks stop being written.
for (const expected of ['404.html', 'org/404.html', 'posts/404.html', 'showcase/404.html']) {
  if (!existsSync(join(dist, expected))) throw new Error(`finalize-web-export: missing dist/${expected}`);
}
