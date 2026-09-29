// Adds the six Habsida Hackathon 2026 photos (seed-assets/habsida/hackathon-1..6.webp) to its showcase gallery.
// It touches only those files and that showcase's gallery, so it's safe on production (seed-habsida.mjs rewrites
// every HABSIDA row). Re-running adds nothing new.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node supabase/scripts/add-showcase-photos.mjs
//
// The service-role key stays in this shell; it never goes into client/ (CLAUDE.md).
import { readFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');

const SHOWCASE = '6a3b0000-0000-4000-8000-000000000003'; // Habsida Hackathon 2026 (seed-habsida.mjs)
const PHOTOS = 6;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function call(path, init = {}) {
  const res = await fetch(url + path, { ...init, headers: { ...headers, ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}

const [showcase] = await call(`/rest/v1/showcases?id=eq.${SHOWCASE}&select=org_id,gallery`);
if (!showcase) throw new Error('The HABSIDA showcase is missing. Run seed-habsida.mjs first.');

const urls = [];
for (let n = 1; n <= PHOTOS; n++) {
  const path = `${showcase.org_id}/hackathon-${n}.webp`;
  await call(`/storage/v1/object/org-media/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp', 'x-upsert': 'true' },
    body: readFileSync(new URL(`../seed-assets/habsida/hackathon-${n}.webp`, import.meta.url)),
  });
  urls.push(`${url}/storage/v1/object/public/org-media/${path}`);
}

const gallery = [...showcase.gallery, ...urls.filter((u) => !showcase.gallery.includes(u))];
await call(`/rest/v1/showcases?id=eq.${SHOWCASE}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ gallery }),
});
console.log(`The showcase gallery has ${gallery.length} photos.`);
