// Creates (or reuses) a login and gives it Maple admin rights: an organization page "Maple" plus a public.staff
// row, so it can open /admin. Safe to re-run.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… ADMIN_EMAIL=you@mapleapp.tech ADMIN_PASSWORD=… node supabase/scripts/make-admin.mjs
//
// Then sign in on /login with that email and password. Without ADMIN_PASSWORD, use "Forgot password?" there to set
// one (locally the code lands in Mailpit, http://127.0.0.1:54324).
// The service-role key and the password stay in this shell; they never go into client/ or git (CLAUDE.md).
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL ?? 'admin@mapleapp.tech';
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function call(path, init = {}) {
  const res = await fetch(url + path, { ...init, headers: { ...headers, ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}

const password = process.env.ADMIN_PASSWORD;
const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email, email_confirm: true, ...(password && { password }) }),
});
const id = created.ok
  ? (await created.json()).id
  : (await call('/auth/v1/admin/users?per_page=1000')).users.find((u) => u.email === email)?.id;
if (!id) throw new Error(`Couldn't create or find ${email}`);
if (!created.ok && password)
  await call(`/auth/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ password }) });

// The admin needs an organization page to use the app; keep an existing one if the login already has it.
const [existing] = await call(`/rest/v1/organizations?id=eq.${id}&select=handle`);
if (!existing)
  await call('/rest/v1/organizations', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      id,
      role: 'organizer',
      kind: 'company',
      handle: `maple-${id.slice(0, 6)}`,
      name: 'Maple',
      tagline: 'The team behind Maple',
    }),
  });
await call('/rest/v1/staff?on_conflict=user_id', {
  method: 'POST',
  headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
  body: JSON.stringify({ user_id: id }),
});
console.log(`${email} is a Maple admin. Sign in with that email, then open /admin.`);
