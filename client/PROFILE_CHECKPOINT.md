# Checkpoint 4 — onboarding and profiles

Starting state: main at 2b24c2aeb9b0dd9f489814aef407bd0b20cd324c, clean.
No dependencies were added. Forms use React state and deterministic validation.

## Routes and state

/account-ready is retired. The existing protected auth stack now chooses:
- logged out: /login
- authenticated without a profile: /onboarding
- authenticated with a profile: /me (and /me/edit)

SessionProvider owns the sole profile snapshot, including its owner ID, loading and error state.
It fetches once per authenticated user identity, not on token refresh or per screen.
The guards wait for auth and profile resolution. Errors show Retry instead of being treated as a missing profile.
Generation checks reject stale reads; session identity checks prevent an old mutation from populating another user's state.

Creation and update return the database row and put it in this shared snapshot before routing.
Creation changes the Stack.Protected guard directly. Edit updates state, then replaces its route with /me.
No upsert, separate cache, or redirect-effect chain is used.

## Onboarding and fields

Four steps retain local state across Next/Back: Role, Identity, Preferences, Review.
There are no writes until Create profile. A ref lock plus disabled controls prevents duplicate submission.
If an INSERT hits a unique violation, a lookup can recover an existing own profile without overwriting it.
Otherwise a handle conflict becomes: "That handle was just taken. Please choose another."

Required: one role, name, handle, headline.
Optional: bio, location, categories, regions, audience types.
Organizer: attendance band. Sponsor: gives. No sponsor budget field.
The edit form omits role and completeness. The data helper also strips all protected fields at runtime.
/me shows initials or an existing photo URL, identity, role, bio, preferences, calculated completeness, Edit and Sign out.

Handle regex matches the database exactly: ^[a-z0-9][a-z0-9_-]{2,29}$.
Name-based suggestions lowercase ASCII, collapse spaces/hyphens, remove unsupported punctuation, and are offered only if valid.
Non-Latin-only names such as 김민수 leave the suggestion empty; manual handles work.
An optional authenticated availability check improves feedback; the unique constraint remains authoritative.

src/constants/taxonomy.ts is the only form taxonomy. Planning specifies no exact attendance bands, so this checkpoint uses:
under-50, 50-199, 200-999, 1000-plus. Regions use continents plus online.
These are form values, not new product enums or entitlement rules.

## Database completeness

The committed foundation migration is untouched. It used column grants, not a blocking completeness trigger.
The new migration 20260924112000_profile_completeness.sql adds exactly one BEFORE INSERT OR UPDATE calculation trigger:
profiles_completeness → private.calculate_profile_completeness().
It is SECURITY INVOKER, search_path='', with direct EXECUTE revoked from ordinary/backend API roles.
The existing timestamp trigger remains separate and does not touch completeness.

Score:
- role: 10
- nonblank name: 15
- nonblank handle: 15
- nonblank headline: 15
- nonblank bio: 10
- nonblank location: 10
- at least one nonblank category: 10
- at least one nonblank region: 10
- audience types plus organizer attendance band OR sponsor gives: 5

The deterministic sum is 0–100. Whitespace-only values do not earn points.
Authenticated INSERT/UPDATE grants still exclude completeness. Such client writes fail before the trigger.
For privileged writes, the trigger ignores supplied completeness and computes it.
Role UPDATE remains excluded from authenticated grants. RLS and all other grants are unchanged.
Existing profiles are recalculated while preserving their prior updated_at values.
No public row shape changed, so the generated public database types need no changes.

## Verification

Backend: clean local reset PASS; schema lint PASS; 98 pgTAP assertions PASS.
The original suite still has 74 assertions. Its obsolete fixed-zero expectation now checks computed 55 after the fixture's headline update; all security-denial assertions remain.
The 24 additional assertions cover scores, recalculation, whitespace, role awareness, tampering rejection, role immutability, column grants, privileged overwrite, determinism, and trigger privacy/count.
Fixture setup runs as postgres; application assertions switch to authenticated with explicit JWT claims; backend overwrite runs as service_role.

Browser: scripts/profile-smoke.cjs exercises two different new users through real local OTP login, all route-state combinations, all four steps, one INSERT despite repeated clicks, score 100, immediate /me state, refresh, editing, unchanged role, duplicate-PK recovery, profile-query Retry and sign out.
The duplicate recovery test hides one initial profile read, then causes a real database PK collision.
Query-error coverage uses a controlled failed HTTP response; OTP and profile mutations use the real local backend.
Both roles are captured at all six screens at 1440×900 and 390×844, light and dark.
The existing auth smoke test now targets onboarding instead of the retired temporary route and passes 31 assertions.

Run from client after starting local Supabase and configuring the existing ignored .env.local:
    npm run build:web
    node scripts/profile-smoke.cjs
    node scripts/auth-smoke.cjs

As in Checkpoint 3, set MAPLE_PLAYWRIGHT_MODULE for an existing external Playwright installation,
MAPLE_LOCAL_MAIL_URL for local Mailpit, and optionally MAPLE_PROFILE_QA_OUTPUT for screenshots outside the repository.
No browser-testing dependency is added to the application.
Native runtime onboarding was not separately exercised in this checkpoint; TypeScript checks the native-compatible components.

Security: own IDs come from the active session; field allowlists and existing RLS protect other users and privileged fields.
No service-role client credential, token/session logging, public sponsor budget, committed env values, or static session data.
No organizations UI, events, opportunities, feed, search, network, Quick Pitch, pitches, messaging, notifications, billing or admin.

All work remains uncommitted for review. Suggested Checkpoint 5: minimal organization creation using the existing atomic creator-admin contract. Not implemented.
