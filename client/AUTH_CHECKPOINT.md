# Checkpoint 3: local email OTP authentication

Scope: email OTP, persisted sessions, route guards, sign out, and local verification only. No Maple profile is created by this flow.

## Run locally

1. Start the existing local Supabase stack using the WSL/Docker instructions in ../supabase/README.md.
2. Copy .env.example to the gitignored .env.local and fill in the local API URL and public anon key from Supabase status. Never use privileged credentials here.
3. Run npm install, then npm start or npm run web.

Environment contract (names only):

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

Mailpit: http://127.0.0.1:55324. Both new-user confirmation and existing-user sign-in emails display a real six-digit token. These ports belong to this local project; hosted services were not linked or modified.

Local email confirmation is enabled. otp_length remains explicitly 6 and otp_expiry remains 3600 seconds. max_frequency was strengthened from 1s to 60s; the email_sent limit remains 2. The smoke tests did not hit that local sender limit, so it was not increased. The UI's 60-second cooldown supplements server limits.

## Architecture

- src/lib/supabase/client.ts lazily owns one typed Supabase client.
- On web, storage.ts accesses localStorage only in a real browser. Native Metro resolution selects storage.native.ts and AsyncStorage.
- Node/static generation does not run provider effects or initialize the client. If the getter is called in Node, persistence and refresh are disabled and no storage adapter is created.
- detectSessionInUrl is false: the flow accepts typed codes, not link callbacks.
- SessionProvider restores once, subscribes to auth events, ignores the redundant INITIAL_SESSION event, and prevents stale initial reads from overwriting newer events. It exposes a recoverable error and Retry.
- The native AppState subscription starts refresh in the foreground and stops it otherwise; cleanup removes the subscription and stops refresh. Web uses the SDK's browser lifecycle.
- The installed Supabase SDK coordinates refresh internally; no deprecated explicit lock option is supplied.
- The (auth) route group waits for restoration before rendering Stack.Protected. Unauthenticated account-ready visits resolve to login; authenticated login visits resolve to account-ready.
- Sign out calls Supabase with local scope (the current session), clears persisted state, and causes the route guard to return to login.
- Protected routes are navigation behavior. The unchanged database RLS remains the authorization boundary.

## Dependencies

Added @supabase/supabase-js 2.117.1 and @react-native-async-storage/async-storage 2.2.0. AsyncStorage persists native sessions across process restarts. No client state or form framework was added.

Expo Doctor required compatible patch updates: expo 57.0.24 → 57.0.25, expo-linking 57.0.10 → 57.0.11, expo-router 57.0.22 → 57.0.23. package-lock.json remains authoritative.

## Reproducible browser smoke test

scripts/auth-smoke.cjs uses an existing Playwright installation and an installed browser, without adding a production dependency. Build the client first, then run from client/:

    npm run build:web
    node scripts/auth-smoke.cjs

Set MAPLE_LOCAL_MAIL_URL to the local Mailpit URL. If Playwright is outside this project, set MAPLE_PLAYWRIGHT_MODULE to its module path. MAPLE_BROWSER_CHANNEL defaults to msedge; override for another installed Playwright browser channel. Optionally set MAPLE_AUTH_QA_OUTPUT to a directory outside the repository for screenshots/results.

The script starts and closes its own static server on 127.0.0.1:8766. It creates uniquely named fake example.test Auth users in the local stack. It never reads privileged credentials, prints codes or sessions, or creates profiles. It waits for actual resend intervals and actual captured emails. Database reset removes these local fixtures.

Coverage:

- Logged-out protected route, empty/malformed email, keyboard focus.
- Real new-user confirmation email displayed in Mailpit.
- Numeric-only OTP, disabled incomplete verification, cooldown.
- Real invalid-code rejection and successful real OTP verification.
- All three screens at 1440×900 and 390×844, both themes; no horizontal overflow and ≥44px button targets.
- Authenticated login guard, reload restoration, real sign out, persisted session removal.
- Existing-user email, change-email reset, fresh real resend, existing-user verification.
- Controlled HTTP 429 and network failure display. These two error tests are transport simulations, not claims that the real server's hourly quota was reached.

Additional checks performed during this checkpoint:

- Actual expired-code rejection: a disposable confirmation timestamp was aged in local SQL; verification used the public client key and actual emailed code. No schema or auth limits were changed for this test.
- Missing-configuration static export and browser error display.
- Supabase-specific browser storage failure and successful Retry after storage recovered.
- Android Pixel_7 emulator / Expo Go 57.0.9: real OTP sign-in, full process restart with persistent session, protected-route restoration, real sign out.
- Native refresh completion observed with temporary non-secret tracing: start → background stop → foreground start, once per transition. Tracing was removed from delivered code. iOS was not executed.

For this Windows host, native development needed NODE_OPTIONS=--dns-result-order=ipv4first so Metro's localhost listener matched adb's IPv4 reverse forwarding. Forward both the Metro and local Supabase API ports with adb reverse. This is a host setup detail, not committed app configuration.

## Validation and scope

The existing local db reset, all 74 security assertions, and public/private schema lint passed. Migrations, security tests, and generated database types are unchanged.

Final results: all 31 browser smoke assertions PASS; typecheck PASS; lint (including the smoke script) PASS; static web export PASS; Expo Doctor 21/21 PASS. Static HTML contains no session or fixture-user data. .env.local remains ignored. No access/refresh tokens or complete sessions are logged by app code.

There is no signup route, automatic profile creation, social auth, onboarding, profile or organization UI, events, opportunities, feed, search, network, Quick Pitch, pitches, messaging, notifications, billing, admin, or production SMTP. The existing foundation page only gained a Sign in action.

Checkpoint 3 is left uncommitted. The next proposed checkpoint is minimal role/profile onboarding for authenticated users; it has not been implemented.
