# Checkpoint 2: identity and organization backend

This directory contains the local Supabase foundation only. No cloud project is
linked, and no application client is connected. CLI used: **2.117.0**; Postgres 17.

## Run locally

From the Maple root, with Docker running:

```sh
npx supabase@2.117.0 start
npx supabase@2.117.0 db reset --local
npx supabase@2.117.0 test db
npx supabase@2.117.0 gen types typescript --local --schema public > client/src/types/database.ts
```

`db reset --local` destroys only this project's local development data. Never add
`--linked` or a remote database URL to this workflow.

On the verified Windows machine, Docker is available inside Ubuntu WSL, not in
Windows PATH. The equivalent commands were run using the official Linux CLI:

```sh
wsl -d Ubuntu -- /tmp/maple-supabase-cli/supabase --workdir /mnt/c/Users/HP/Downloads/maple-main/maple-main start
wsl -d Ubuntu -- /tmp/maple-supabase-cli/supabase --workdir /mnt/c/Users/HP/Downloads/maple-main/maple-main db reset --local
wsl -d Ubuntu -- /tmp/maple-supabase-cli/supabase --workdir /mnt/c/Users/HP/Downloads/maple-main/maple-main test db
wsl -d Ubuntu -- /tmp/maple-supabase-cli/supabase --workdir /mnt/c/Users/HP/Downloads/maple-main/maple-main gen types typescript --local --schema public
```

The downloaded CLI is temporary tooling outside the repository. No dependency was
added to the Expo app. Type-generation stdout is copied to
`client/src/types/database.ts` only after generation succeeds; stderr is not part
of that file. Types are schema descriptions, not authorization guarantees: generated
Insert/Update shapes include protected columns, while database grants reject those
columns for ordinary clients. Do not hand-edit the generated types.

Windows reserves 54298-54397 on this machine, including Supabase's default ports.
The committed local configuration therefore uses **55320-55329** (API 55321,
database 55322, Studio 55323). It exposes only `public`; `private` is not exposed
or added to the API search path. Automatic exposure/grants are disabled, and the
migration explicitly revokes defaults before granting the required privileges.

There is no seed.sql and seeding is disabled. Fake Auth/profile/member fixtures
exist only in the transactional tests and roll back. No environment contract or
client keys are needed yet.

## Schema contract

Migration: `migrations/20260924100930_profiles_organizations_foundation.sql`.

Enums:

- `profile_role`: organizer, sponsor
- `organization_member_role`: admin, member
- `organization_type`: event_company, brand, agency, university_club

| Table | Purpose / key | Foreign keys | Constraints / indexes |
|---|---|---|---|
| profiles | Public identity; PK id | id -> auth.users(id), CASCADE | Unique 3-30 character lowercase URL-safe handle; nonblank bounded name; bounded headline/bio; completeness 0-100; PK and handle indexes |
| organizations | Public organization; PK id | created_by -> profiles(id), RESTRICT | Unique 3-64 character lowercase slug; bounded name/about; domain lowercase and trimmed when supplied; PK, slug, created_by indexes |
| organization_members | Membership; PK (org_id, profile_id) | org_id -> organizations(id), CASCADE; profile_id -> profiles(id), CASCADE | Composite PK prevents duplicates and indexes org_id; additional profile_id index |
| user_roles | Private Maple operational assignment; PK user_id | user_id -> auth.users(id), CASCADE | Only role='admin' accepted; PK index |

All timestamps are timestamptz; the local database uses UTC. Organization creator
deletion is restricted deliberately: ownership transfer and complete account
removal require a later contract. Normal clients cannot delete profiles or
organizations. No public sponsor budget or premium entitlement flag exists.
Completeness starts at 0; only privileged backend operations may set it. A future
checkpoint will define its calculation. No speculative domain/search index exists.

## Effective PostgreSQL grants

RLS is enabled on all four tables. `PUBLIC`, `anon`, `authenticated`, and
`service_role` table defaults are revoked before granting the following:

| Table | anon | authenticated | service_role |
|---|---|---|---|
| profiles | SELECT | SELECT; column INSERT and UPDATE below | SELECT, INSERT, UPDATE, DELETE |
| organizations | SELECT | SELECT; column INSERT and UPDATE below | SELECT, INSERT, UPDATE, DELETE |
| organization_members | None | SELECT, restricted to own rows by RLS | SELECT, INSERT, UPDATE, DELETE |
| user_roles | None | None | SELECT, INSERT, UPDATE, DELETE |

There is **no table-level INSERT or UPDATE grant** for authenticated users.
There are no client DELETE, TRUNCATE, REFERENCES or TRIGGER grants. Service-role
CRUD is explicit; inherited TRUNCATE, REFERENCES and TRIGGER grants are removed.

Authenticated column grants:

- profiles INSERT: id, role, handle, name, headline, bio, photo_url, location,
  categories, regions, audience_types, audience_band, gives.
- profiles UPDATE: handle, name, headline, bio, photo_url, location, categories,
  regions, audience_types, audience_band, gives.
- organizations INSERT: id, slug, name, type, domain, logo_url, cover_url, about,
  website, created_by.
- organizations UPDATE: slug, name, type, domain, logo_url, cover_url, about, website.

This protects profile role after creation; completeness on both insert and update;
organization verification on both insert and update; and all membership writes,
including role and verified_email. Identity keys, creator identity and timestamps
also cannot be overwritten by clients. Domain changes clear verified in a BEFORE
UPDATE trigger, including changes made through privileged operations.

## RLS policy inventory

`uid` below means `(select auth.uid())`. A dash means the condition is not applicable.

| Policy / table | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| profiles_public_read / profiles | SELECT | anon, authenticated | true | - |
| profiles_insert_own / profiles | INSERT | authenticated | - | id = uid |
| profiles_update_own / profiles | UPDATE | authenticated | id = uid | id = uid |
| organizations_public_read / organizations | SELECT | anon, authenticated | true | - |
| organizations_insert_own / organizations | INSERT | authenticated | - | created_by = uid |
| organizations_update_admin / organizations | UPDATE | authenticated | private.is_org_admin(id) | private.is_org_admin(id) |
| organization_members_read_own / organization_members | SELECT | authenticated | profile_id = uid | - |

No client DELETE policies, membership write policies, or user_roles policies exist.
Service-role SQL uses its built-in BYPASSRLS capability with the explicit grants
above. Having a row in user_roles does not change a normal user's database role
or organization permissions.

## Atomic organization creation and helpers

A user must first create their own profile. An organization insert must specify
that profile as created_by; RLS checks ownership and the FK enforces existence.
The AFTER INSERT trigger inserts the creator's admin membership in the same
statement/transaction. Any membership error rolls back the organization insert.
No second client write is required or permitted.

All helper functions live in the non-exposed `private` schema, have
`SET search_path = ''`, and are owned by postgres. All table/function references
are schema-qualified. Built-in functions resolve through pg_catalog.

| Function | Security | References | Direct EXECUTE grants | Trigger / purpose |
|---|---|---|---|---|
| private.touch_updated_at() | INVOKER | NEW row, statement_timestamp() | postgres owner only | profiles_updated_at and organizations_updated_at, BEFORE UPDATE |
| private.clear_domain_verification() | INVOKER | OLD/NEW row | postgres owner only | organizations_domain_verification, BEFORE UPDATE |
| private.add_organization_creator() | DEFINER | public.organization_members | postgres owner only | organizations_creator_admin, AFTER INSERT |
| private.is_org_admin(uuid) | INVOKER, STABLE | public.organization_members, auth.uid() | postgres owner and authenticated | Organization UPDATE RLS |

Trigger execution does not require a direct client EXECUTE grant. The creator
trigger is the only elevated helper and is not a callable client API. Authenticated
users have schema USAGE solely to resolve the admin lookup, not CREATE privileges.
The lookup uses the user's own visible membership row. Membership SELECT RLS checks
profile_id directly and never queries organizations or calls the helper, so no
policy recursion occurs. No separate operational-role lookup is needed yet.

## Security tests and validation

`tests/identity_security.test.sql` uses pgTAP and rolls back every fixture and
statement. Fixture setup uses postgres for Auth users, a normal member, an existing
operational role and timestamp test data. Actual application operations run under
`SET LOCAL ROLE authenticated` plus explicit `request.jwt.claims`; anonymous
assertions use `anon`. The positive verification assertion actually switches to
`service_role`. Catalog assertions use postgres and supplement, not replace, the
application-user tests. The atomicity test injects a temporary failing membership
trigger inside the rolled-back test transaction.

Verification results and the full assertion inventory are recorded below. No
production resources, external email delivery, client connectivity, or other
product subsystems are configured by this checkpoint.

### Assertion results (local clean-reset run)

| # | Test | Result | Assertion SQL role |
|---|---|---|---|
| 1 | application assertions use authenticated SQL role | PASS | authenticated |
| 2 | JWT resolves to User A | PASS | authenticated |
| 3 | own profile insert with chosen role succeeds | PASS | authenticated |
| 4 | other profile insert rejected by RLS | PASS | authenticated |
| 5 | one profile per Auth user | PASS | authenticated |
| 6 | own normal update succeeds | PASS | authenticated |
| 7 | own update persists | PASS | authenticated |
| 8 | other profile update affects zero rows under RLS | PASS | authenticated |
| 9 | other profile remains unchanged | PASS | authenticated |
| 10 | role change rejected | PASS | authenticated |
| 11 | completeness update rejected | PASS | authenticated |
| 12 | completeness insert rejected | PASS | authenticated |
| 13 | profile timestamps cannot be forged | PASS | authenticated |
| 14 | protected completeness remains its default | PASS | authenticated |
| 15 | protected role remains unchanged | PASS | authenticated |
| 16 | handle must be lowercase | PASS | authenticated |
| 17 | handle rejects URL-unsafe characters | PASS | authenticated |
| 18 | handle minimum length enforced | PASS | authenticated |
| 19 | handle maximum length enforced | PASS | authenticated |
| 20 | handle uniqueness enforced | PASS | authenticated |
| 21 | direct profile deletion denied | PASS | authenticated |
| 22 | org creation with profile succeeds | PASS | authenticated |
| 23 | creator becomes admin in same organization insert | PASS | authenticated |
| 24 | invoker helper recognizes creator under authenticated RLS | PASS | authenticated |
| 25 | wrong created_by rejected by RLS | PASS | authenticated |
| 26 | verification cannot be set on organization insert | PASS | authenticated |
| 27 | org admin normal update succeeds | PASS | authenticated |
| 28 | organization update persists | PASS | authenticated |
| 29 | org admin self-verification rejected | PASS | authenticated |
| 30 | org admin cannot transfer creator identity | PASS | authenticated |
| 31 | direct organization deletion denied | PASS | authenticated |
| 32 | random user helper returns false without RLS recursion | PASS | authenticated |
| 33 | random org update affects zero rows | PASS | authenticated |
| 34 | other users cannot enumerate memberships | PASS | authenticated |
| 35 | privileged membership creation rejected | PASS | authenticated |
| 36 | org creation without profile rejected by FK | PASS | authenticated |
| 37 | failed creation leaves no organization | PASS | authenticated |
| 38 | member fixture is a real normal member | PASS | authenticated |
| 39 | member self-promotion rejected | PASS | authenticated |
| 40 | verified_email self-assertion rejected | PASS | authenticated |
| 41 | membership deletion denied | PASS | authenticated |
| 42 | normal member cannot edit organization | PASS | authenticated |
| 43 | user_roles SELECT rejected | PASS | authenticated |
| 44 | user_roles INSERT rejected | PASS | authenticated |
| 45 | user_roles UPDATE rejected | PASS | authenticated |
| 46 | user_roles DELETE rejected | PASS | authenticated |
| 47 | user cannot grant self Maple admin | PASS | authenticated |
| 48 | updated_at trigger permits normal write | PASS | authenticated |
| 49 | updated_at refreshed while created_at preserved | PASS | authenticated |
| 50 | privileged assertion uses service_role | PASS | service_role |
| 51 | service_role verification succeeds | PASS | service_role |
| 52 | service_role verification persisted | PASS | service_role |
| 53 | normal update of verified organization succeeds | PASS | authenticated |
| 54 | unchanged domain preserves verification | PASS | authenticated |
| 55 | admin can change domain | PASS | authenticated |
| 56 | domain change clears verified | PASS | authenticated |
| 57 | membership failure aborts organization creation | PASS | authenticated |
| 58 | failed membership leaves no orphan organization | PASS | authenticated |
| 59 | anonymous assertions use anon SQL role | PASS | anon |
| 60 | anonymous profile insert rejected | PASS | anon |
| 61 | anonymous base profile read allowed | PASS | anon |
| 62 | anonymous organization read allowed | PASS | anon |
| 63 | anonymous membership read rejected | PASS | anon |
| 64 | anonymous app-role read rejected | PASS | anon |
| 65 | anonymous private helper access rejected | PASS | anon |
| 66 | RLS enabled on all four tables | PASS | postgres (catalog check) |
| 67 | profile UPDATE uses safe column grants without broad table grant | PASS | postgres (catalog check) |
| 68 | organization UPDATE uses safe column grants | PASS | postgres (catalog check) |
| 69 | ordinary roles have no app-role table grants | PASS | postgres (catalog check) |
| 70 | creator trigger is not a callable client API | PASS | postgres (catalog check) |
| 71 | service_role retains explicit table UPDATE grant | PASS | postgres (catalog check) |
| 72 | no public budget or premium entitlement fields | PASS | postgres (catalog check) |
| 73 | service_role has only the explicitly required CRUD privileges | PASS | postgres (catalog check) |
| 74 | local database timezone is UTC | PASS | postgres (catalog check) |

### Checkpoint outcome

Starting branch: main. Starting HEAD:
`ee12cb14503c97e8e190da93532ab72b846565fb`. Starting working tree was clean.
No Checkpoint 2 commit, push, merge, rebase, or remote Supabase operation occurred.

| Command / check | Result | Evidence |
|---|---|---|
| supabase init | PASS | Standard config and ignore files created |
| supabase start (WSL, configured ports) | PASS | Local stack healthy; migration applied |
| supabase db reset --local | PASS | Fresh local database rebuilt from the single migration |
| supabase test db | PASS | 74/74 assertions after clean reset |
| supabase db lint --local --schema public,private --level warning | PASS | No schema errors |
| supabase gen types typescript --local --schema public | PASS | Generated public schema types; no handwritten interfaces |
| Live catalog audit | PASS | All RLS, policies, column/table grants and function ACLs inspected |
| npm run typecheck | PASS | Generated types compile with the existing client |
| npm run lint | PASS | No client lint errors |
| npm run build:web | PASS | Static export to client/dist, including / |
| Changed-file security/scope scan | PASS | Six new scoped files; no detected credentials; no existing client edits |

Initial Windows CLI startup failed because Docker was only available in WSL.
Initial WSL startup failed because Windows reserved the default database port.
Both setup issues were resolved without touching unrelated services. The final
local stack is left running for review. The first test run exposed an invalid
nested data-modifying CTE in the test SQL; it was corrected to a top-level CTE,
and the complete suite subsequently passed against fresh databases.

Type generation emits a pg-meta Node MaxListenersExceededWarning while exiting
successfully. The generated file contains TypeScript only and passes typecheck.
No client packages/configuration changed, so Expo Doctor was not rerun.
No production/cloud project is linked. No persistent fake seed records, secret
files, environment values, Supabase JS client, sessions, hooks, or API integration
were added. Runtime .temp/.branches directories are ignored.

Security conclusions: all four tables have RLS; ordinary users have no user_roles
access; no public budget or premium entitlement column exists; protected fields
are enforced by grants, with domain verification reset by trigger. Service-role
verification succeeds. Profile role/completeness and membership role/verified_email
cannot be self-modified. Organization creation requires a profile and cannot leave
an orphan organization when its creator membership fails.

No auth/onboarding/profile/organization/admin UI, events, opportunities, search,
Quick Pitch, pitches, messaging, notifications, or billing was built. The smallest
suggested next checkpoint is an explicitly scoped email-OTP session foundation;
no such integration was started here.

References for the security approach:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/local-development/cli/getting-started
