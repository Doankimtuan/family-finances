# Together Performance Investigation

Measured: 2026-09-11

Status: **PARTIAL** — read-only application tracing and browser benchmarks are complete. Live PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` was unavailable: `psql` is absent, the installed Supabase CLI has no SQL-query command, and hosted PostgREST plan media returned HTTP 406 `PGRST107`.

No schema, RLS, Auth, household, membership, invitation, role, ownership, or financial data changed.

## 1. Executive Summary

The authenticated Together hub is a small, two-wave path:

- **6 warm Supabase/Auth HTTP fetches** per `/en/together` document;
- **2 dependency waves**;
- **714 ms median** to the Together page marker across 10 warm loads;
- **826 ms median** full browser load across the same baseline;
- **314 ms median TTFB** across a separate 10-load warm batch;
- no client REST/SWR/React Query refetch on initial hydration;
- no profile/avatar table read and no member-level profile N+1;
- no separate pending-invite count; count is derived from fetched rows;
- no confirmed duplicate Together domain HTTP read on the hub.

Useful Together content is page-wide blocked after the auth gate. The route has
loading fallbacks and a Suspense footer, but no meaningful Together section
boundary. This is a perceived-latency contributor, not evidence that a hub RPC
is justified.

The measurable Together-specific hotspot is `/[locale]/together/members`:
**10 fetches across 3 waves**, with five ownership-impact reads waiting for
member IDs. That is the first target only if Members latency needs work.

## 2. Route Architecture

```text
proxy.ts
└── next-intl routing + Supabase updateSession/getClaims
    └── /[locale]/(product)/layout.tsx
        ├── requireProductSession()
        ├── ChromeShell(product)
        └── Suspense: ProductNavigation → unread Inbox HEAD
            └── /[locale]/(product)/together
                ├── Together hub
                ├── /members
                ├── /invitations
                │   └── /new (admin-only)
                ├── /policies
                ├── /preferences
                ├── /settings
                │   └── /account
                └── server actions

/[locale]/(onboard)/together/onboard
└── auth user → active membership → create household or redirect

/[locale]/(invite)/invite/[token]
└── auth user + invitation preview RPC → accept/decline actions
```

| Route                                 | Responsibility                           | Loading/error behavior                 |
| ------------------------------------- | ---------------------------------------- | -------------------------------------- |
| `/[locale]/together`                  | Authenticated household hub              | `together/loading.tsx`; page-wide wait |
| `/[locale]/together/members`          | Member list, roles, leave/remove, impact | `members/loading.tsx`; page-wide wait  |
| `/[locale]/together/invitations`      | Pending invitations and revoke           | `invitations/loading.tsx`              |
| `/[locale]/together/invitations/new`  | Admin-only invite form                   | Non-admin redirects to invitations     |
| `/[locale]/together/policies`         | Policy read/edit and audit events        | `policies/loading.tsx`                 |
| `/[locale]/together/preferences`      | Household locale/preferences             | `preferences/loading.tsx`              |
| `/[locale]/together/settings`         | User identity, household prefs, links    | `settings/loading.tsx`                 |
| `/[locale]/together/settings/account` | Account lifecycle controls               | Parent settings fallback               |
| `/[locale]/together/onboard`          | No-household onboarding                  | Onboard chrome; no product layout      |
| `/[locale]/invite/[token]`            | Invite preview and consent               | Invite fallback; no product nav        |

Relevant actions are `together/actions.ts`, `invite-actions.ts`,
`members/actions.ts`, `policies/actions.ts`, `preferences/actions.ts`, and
`(onboard)/together/onboard/actions.ts`. No Together-specific route handler
exists.

## 3. Primary Target

PRIMARY TARGET: `/[locale]/together` (measured as `/en/together`)

SECONDARY TARGETS: `/[locale]/together/members`, `/invitations`,
`/invitations/new`, `/settings`, `/preferences`, `/policies`,
`/settings/account`, `/onboard`, and `/invite/[token]`.

The normal post-onboarding Together surface is the hub. Members is the
measured secondary hotspot.

## 4. Server Component / Streaming Structure

```text
ProductLayout
├── requireProductSession()
├── Together page
│   ├── requireTogetherMembership()
│   ├── listHouseholdMembers()
│   └── listPendingInvitations()
└── Suspense ProductNavigation
    └── countUnreadOpenInboxItems()
```

The hub starts member and invitation reads with `Promise.all` after the gate,
then awaits all results before returning useful page content. Members adds a
second await after member IDs are available:

```text
gate → member/household reads → five ownership-impact reads → MemberList
```

Verdict: **PARTIAL streaming**. Loading fallbacks and the footer can stream,
but meaningful Together content is page-wide blocked. There is no client
refetch after initial hydration.

## 5. Remote Request Inventory

Representative warm hub trace: run 1 of the 10-load trace. Offsets are
normalized to the first remote fetch; `at`/duration came from
`VINHA_PERF_TRACE=1`.

|   # | Class          | Method / endpoint                          | Source                                                           | Fields / filters                                                                       |   Rows | Bytes |      Offset |         Duration | Dependency / cache                                             | Consumer                        |
| --: | -------------- | ------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -----: | ----: | ----------: | ---------------: | -------------------------------------------------------------- | ------------------------------- |
|   0 | AUTH logical   | `getClaims()`; warm local JWT verification | `proxy.ts` → `update-session.ts`; `get-verified-auth-subject.ts` | Verified `claims.sub`                                                                  |    n/a |   n/a | before HTTP | 0–5 ms warm span | Separate proxy context; no warm HTTP                           | Auth gate                       |
|   1 | AUTH           | `GET /auth/v1/user`                        | `get-session-user.ts`                                            | Supabase User; bearer session                                                          |      1 | 2,171 |        0 ms |           330 ms | Parallel with membership; React `cache()`                      | Gate identity, settings email   |
|   2 | TENANCY        | `GET /rest/v1/household_members`           | `resolve-active-membership.ts`                                   | `id,household_id,role,user_id`; current user; active; `maybeSingle()`                  |      1 |   167 |       +7 ms |           350 ms | Parallel with Auth; React `cache()`                            | Active household/role           |
|   3 | HOUSEHOLD      | `GET /rest/v1/households`                  | `list-household-members.ts`                                      | `id,name`; active household; `maybeSingle()`                                           |      1 |    65 |     +359 ms |           271 ms | After gate; parallel; client factory cached                    | Household header                |
|   4 | MEMBERS        | `GET /rest/v1/household_members`           | `list-household-members.ts`                                      | `id,user_id,role,email,display_name`; household; active; `joined_at ASC`               |      3 |   496 |     +360 ms |           276 ms | After gate; parallel; session/membership cached                | Hero/member preview/count/roles |
|   5 | INVITES        | `GET /rest/v1/household_invitations`       | `list-pending-invitations.ts`                                    | `id,email,token,expires_at,created_at`; household; pending; expiry > now; newest first |      0 |     2 |     +360 ms |           315 ms | After gate; parallel; session/membership cached                | Pending section/count/nav       |
|   6 | COUNT / SHARED | `HEAD /rest/v1/inbox_items`                | `review-items.ts:countUnreadOpenInboxItems` via layout           | Pending, unread, active kinds, unassigned/current user; exact count                    | body 0 |     0 |     +361 ms |           507 ms | Shared footer wave; not hub-content blocking; allowance cached | Inbox badge                     |

Warm total: **6 HTTP fetches**. A cold process may add a Supabase JWKS fetch
during `getClaims()`; that is Auth setup, not a Together domain read. No
service-role client is used.

## 6. Dependency Graph

```text
Proxy getClaims() [warm local verification]
        │
        ▼
getSessionMembership()
├── getSessionUser() ─────────────── GET /auth/v1/user
└── getVerifiedAuthSubject()
    └── resolveActiveMembership() ── GET /household_members (current member)
        │
        ├── listHouseholdMembers()
        │   ├── GET /households (id, name)
        │   └── GET /household_members (active member display fields)
        ├── listPendingInvitations()
        │   └── GET /household_invitations (pending rows)
        └── ProductNavigation
            └── HEAD /inbox_items (shared unread badge)
```

## 7. Dependency Waves

### Hub

| Wave | Reads                                                                           | Role                                                    |
| ---: | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
|    1 | Auth user + current active membership; claims verification warm/local           | Trusted user and household context                      |
|    2 | Household identity + active members + pending invitations + shared Inbox `HEAD` | Domain content unlock; Inbox is independent footer work |

Wave 1 starts at offsets 0–7 ms. Wave 2 starts at 359–361 ms. Household,
members, and invitations are parallel; none depends on member IDs.

### Members detail

Members has **10 fetches across 3 waves**:

1. Auth user + active membership;
2. household + member list + shared Inbox count;
3. `accounts`, `savings`, `investment_holdings`, `loans`, and `liabilities`
   ownership-impact reads, parallel but dependent on member IDs.

## 8. Production-Like Baseline

```text
npm run build                         ✅ passed
VINHA_PERF_TRACE=1 npm run start     ✅ production server on port 3132
```

Chromium, authenticated E2E user, 440 × 900, English, warm process, 10
sequential document loads after warmup.

| Metric                                        |                                            Result |
| --------------------------------------------- | ------------------------------------------------: |
| Together marker                               |         **714 ms median**, p75 736, p95/max 1,156 |
| Full browser load                             |         **826 ms median**, p75 901, p95/max 1,159 |
| TTFB / response start, separate 10-load batch | **314 / 315 ms median**, p75 340/341, p95 736/737 |
| Encoded document                              |                           **66,747 bytes median** |
| Decoded document                              |                                 **287,122 bytes** |
| Server Supabase/Auth fetches                  |                      **6 on every recorded load** |
| Useful member preview                         |                                         **10/10** |
| Pending invitation preview                    |                        **0 current fixture rows** |

The outliers were hosted request variance, not a new application dependency
wave.

## 9. Auth / Active Household

`requireProductSession()` is the product-layout security boundary;
`requireTogetherMembership()` delegates to it and preserves the requested
route for post-login behavior.

Request-local caches:

- `getSessionUser()`;
- `getVerifiedAuthSubject()`;
- `resolveActiveMembership()`;
- `getSessionMembership()`;
- `createSupabaseServerClient()`;
- `assertMoneyActionAllowed()` used by the Inbox badge.

Layout, page, member, invitation, and Inbox helpers call these helpers again in
source, but the warm hub emits one Auth user HTTP request and one membership
HTTP request. Auth is a measurable hosted floor; this investigation does not
change Auth.

## 10. Together Domain Contract

### Raw data

- Active membership: membership ID, household ID, user ID, role.
- Household: ID/name on the hub; broader fields on settings/preferences/
  policies routes.
- Active members: membership ID, user ID, role, denormalized email/display
  name; active rows ordered by `joined_at`.
- Pending invitations: ID, email, token, expiry, creation time.
- Settings/preferences: Auth email plus household locale, timezone, currency,
  policy modes, and name.
- Member impact inputs: owner-membership IDs from five financial tables.
- Policy events: ID, type, created time, newest five.

### Derived capability/UI state

- `isSelf`, normalized role, `isAdmin`, `canInvite`, solo-admin warning;
- pending count from `pendingInvitations.length`;
- labels, initials, display names, and role hints;
- `canEdit` from trusted membership role;
- member action capability from self/role/admin count/impact;
- ownership impact totals counted in TypeScript, not final balances.

The hub does not load policies, preferences, ownership impact, or a separate
member-count endpoint.

## 11. Members

`listHouseholdMembers()` selects exactly the fields used for the member UI and
returned **3 active rows / 496 bytes** in the direct benchmark. Role mapping is
TypeScript. There is no nested Auth/Profile relation and no per-member query.

The Members route then calls `listMembershipImpactSummaries(memberIds)`, which
issues five parallel reads, selecting only `owner_membership_id` and filtering
by household plus the member ID set:

- `accounts`;
- `savings`;
- `investment_holdings`;
- `loans`;
- `liabilities`.

It counts rows per member in TypeScript for leave/remove confirmation UI. This
is the confirmed ID-dependent third wave.

## 12. Profile / User Metadata

No `profiles` table read, `auth.users`-derived per-member read, avatar URL
read, or client profile fetch exists in Together. Member identity is already
denormalized on `household_members.email` and `display_name`; the UI renders
initials and does not fetch avatars. Settings uses `user.email` from the one
cached Auth user response.

Verdict: **no avatar/profile N+1 risk confirmed**.

## 13. Invitations

The hub calls `listPendingInvitations()` once. It reads complete pending rows,
then derives the count from `pendingInvitations.length`. There is no separate
invite-count request.

The current direct read returned **0 rows and 2 bytes**, with a 20-sample
median of **282.51 ms**, p95 **498.28 ms**, and max **1,058.49 ms**. All 20
responses were HTTP 200; zero rows is fixture state, not an error.

The invitation list route repeats the same domain read on its own document
request, which is route isolation rather than an intra-request duplicate. The
new-invitation route performs no invitation list read and redirects non-admins
to the invitation list.

Create/revoke/accept/decline are server actions backed by existing RPCs. They
are mutations outside the read-only baseline. Revoke refreshes the route;
create redirects to invitations; accept redirects to the authenticated home
entry.

## 14. Household Settings / Ownership

The hub loads only household identity/name. Settings are separate:

- `/settings` calls `getHouseholdPreferences()` and reads one household row
  containing name, locale, timezone, base currency, month-close mode, and
  income-allocation mode; user email comes from cached Auth;
- `/preferences` calls the same household context loader and exposes locale,
  fixed timezone/currency values, and `canEdit`;
- `/policies` reads policy fields from `households` and five newest policy
  events in parallel after the gate;
- `/members` reads ownership-impact IDs from five financial tables only for
  confirmation semantics.

There is no separate household-member count query. The hub uses member-list
length. There is no separate owner query on the hub. Roles and ownership
capabilities are derived from the trusted membership gate and member rows.

Direct settings/prefs household reads were **288.90 ms** and **279.54 ms**
median respectively; policy events were **283.24 ms** median. The migration
already includes `idx_household_members_household_active`,
`idx_household_invitations_household_status`, and
`idx_household_policy_events_household_created`; no new index is justified.

## 15. Onboarding Observations

`/[locale]/together/onboard` is outside the product layout and does not load
the Inbox badge, member list, invitations, or household settings.

Its authenticated path is:

```text
getSessionUser()
  ↓
resolveActiveMembership(user.id)
  ├── membership exists → redirect to Home
  └── no membership → render onboarding wizard
```

The no-household path is two sequential remote operations after warm proxy
verification: Auth user, then membership. Creating a household uses the
existing `create_household_with_essentials` RPC and hard-redirects to Home; no
client refresh loop was found.

The benchmark user already has a household, so onboarding correctly redirected
and could not provide a clean no-household content baseline without changing
fixture state. No onboarding optimization is recommended.

## 16. Duplicate / Overlapping Reads

| Observation                                                                 | Classification                                         | Evidence                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Auth user helper called by layout, page, and loaders                        | Necessary/cache-hit                                    | One `/auth/v1/user` HTTP fetch on hub                           |
| Active membership helper called by gate, loaders, and Inbox gate            | Necessary/cache-hit                                    | One current-membership HTTP fetch on hub                        |
| Current membership lookup and full member list both use `household_members` | Necessary, not duplicate                               | Different projections and purposes                              |
| Household identity and member rows are separate reads                       | Necessary/parallel                                     | Different projections; same wave                                |
| Pending invitations plus invite count                                       | Not duplicated                                         | Count derived from fetched rows                                 |
| Members five ownership reads                                                | Overlapping but distinct                               | Five tables; all needed for current counts                      |
| Auth user plus member email                                                 | Not a profile duplicate                                | Auth email for current user; denormalized row email for members |
| Layout Inbox count                                                          | Shared-layout contributor                              | One separate `HEAD`; not Together-specific                      |
| Together Link prefetch                                                      | Client amplification attempt; server cost inconclusive | Browser observed 0–4 completed prefetches in 10 loads           |
| Action refreshes                                                            | Conditional/action-triggered                           | Only after role/member/invite/policy/preference mutations       |

Confirmed duplicate Together-domain HTTP requests on the hub: **0**.

## 17. PostgreSQL Plans

Live `EXPLAIN (ANALYZE, BUFFERS)` output was not available in this run:

- `psql` is not installed in the execution environment.
- The Supabase CLI is installed, but no local SQL-query command is configured.
- Authenticated PostgREST plan-media requests returned `406 PGRST107`, so no plan was exposed through the API transport.
- No local PostgreSQL instance was available for an equivalent plan capture.

The schema already contains relevant supporting indexes, including the active-member household index, the one-active-membership-per-user constraint, the pending-invitation household/status index, the policy-event household/created index, and the open-unread Inbox index. Their effectiveness was not proven without a live plan.

Verdict: **INCONCLUSIVE**. No index, SQL, or RPC change is justified by this evidence alone.

## 18. Direct Benchmarks

The following are 20 sequential authenticated samples per endpoint, with one warmup excluded. All requests returned HTTP 200 and no benchmark errors.

| Endpoint class                | Rows / body | Median ms | P75 ms | P95 ms |   Max ms |
| ----------------------------- | ----------: | --------: | -----: | -----: | -------: |
| Auth user                     | 1 / 2,171 B |    302.27 | 346.70 | 437.59 |   663.57 |
| Active membership             |   1 / 167 B |    292.21 | 321.60 | 380.06 |   686.25 |
| Household identity            |    1 / 65 B |    293.14 | 307.91 | 353.30 |   421.13 |
| Active members                |   3 / 496 B |    282.95 | 304.55 | 360.58 |   361.42 |
| Pending invitations           |     0 / 2 B |    282.51 | 297.04 | 498.28 | 1,058.49 |
| Household settings projection |   1 / 154 B |    288.90 | 295.95 | 345.35 |   421.24 |
| Preferences projection        |   1 / 153 B |    279.54 | 286.10 | 386.26 |   436.84 |
| Policy events                 |     0 / 2 B |    283.24 | 309.93 | 484.49 |   498.30 |
| Shared unread Inbox `HEAD`    |     0 / 0 B |    483.52 | 525.55 | 716.99 |   917.41 |

These values are network-bound Supabase endpoint timings, not database execution timings.

## 19. Payload / Overfetch

The Together page is not payload-heavy. The measured warm full-load response was 66,747 encoded bytes and 287,122 decoded bytes, including the application document and framework assets. The Together-domain JSON projections were small: 65 B for household identity, 496 B for three active members, and 2 B for an empty invitation result.

The Auth user response was the largest measured domain response at 2,171 B, but it is a boundary cost shared by the session model rather than a Together-specific overfetch finding. Settings and preferences projections were also narrow. Members impact summaries returned only ownership keys and reduced them to counts in TypeScript; the issue there is request multiplicity, not response size.

Verdict: **LOW overfetch overall; MODERATE only at the shared Auth boundary**. No payload trimming is the first target.

## 20. Client / Post-Hydration Requests

No initial Together client component performs REST, Supabase, SWR, React Query, or `useEffect` data fetching. The page is server-rendered and does not add a post-hydration data wave.

Mutating actions intentionally call `router.refresh()` or redirect after success. That refresh is conditional on a user action and is not part of the initial hub request path.

Together-management links use the default Next.js link-prefetch behavior. A 10-load browser batch observed 0–4 completed RSC prefetch attempts per load; a separate clean probe observed six attempted RSC prefetches that were aborted by the browser before producing additional captured Supabase fetches. This confirms client prefetch activity, but server/database amplification is **INCONCLUSIVE** under the captured timing.

The initial hub inventory therefore remains six Supabase/Auth requests; no confirmed post-hydration Together-domain request was observed.

## 21. Root-Cause Classification

| Finding                                                                         | Classification                                               | Confidence |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------- |
| Hosted Auth/Supabase adds roughly 280–500 ms per remote request                 | Confirmed platform/network floor                             | High       |
| The hub waits for the full server render before main content is useful          | Confirmed perceived-latency contributor                      | High       |
| Members ownership-impact enrichment adds five reads and a third dependency wave | Confirmed Together-specific hotspot                          | High       |
| Shared Inbox unread `HEAD` is slower than most Together reads                   | Confirmed shared-layout cost, not Together-domain root cause | High       |
| Repeated auth and membership helper calls                                       | Cache-hit reuse, not duplicate HTTP work                     | High       |
| Profile/avatar N+1 reads                                                        | Not observed                                                 | High       |
| Separate invite row read plus invite count                                      | Not duplicated; count is derived locally                     | High       |
| Hub household/member/invite reads                                               | Parallel same-wave work, not a serial chain                  | High       |
| Together link prefetch                                                          | Confirmed browser behavior; server cost inconclusive         | Medium     |
| PostgreSQL index/query plan problem                                             | Unproven because plans were unavailable                      | Low        |
| Need for a client REST migration                                                | Not indicated; server render is already the source of truth  | High       |

Primary root cause: **the hub is dominated by the hosted Auth/Supabase request floor and page-wide server-render blocking; the only confirmed Together-specific multiplicity hotspot is the Members route's five-read ownership enrichment.**

## 22. Ranked Optimization Candidates

1. **Narrow the Members ownership-impact read model.** Replace the five per-table ownership-key reads with one trusted aggregate/read model if equivalent household scoping and counts can be proven. This is the clearest Together-specific request reduction; risk is medium/high because the current semantics and RLS boundaries must remain identical.
2. **Disable prefetch on Together-management links.** This is a low-risk browser-work reduction, but the captured server/database benefit is not yet proven.
3. **Unify the hub's household identity, active members, and pending invitations read path.** A server-side read model could reduce three same-wave reads to one, but the gain is bounded by parallel execution and increases security/contract surface.
4. **Stream independent Together sections.** Add section-level Suspense only if the UX accepts partial content and the page contract is deliberately changed; it improves perceived latency, not remote work.
5. **Revisit the shared Inbox badge/layout.** The Inbox `HEAD` is a measurable shared-shell cost, but changing it would affect product navigation beyond Together.
6. **Add indexes or rewrite SQL.** Reject as a first move until live PostgreSQL plans show a database bottleneck.
7. **Add cross-request caching.** Reject as a first move because the current React request cache already removes same-render duplicate helper work and broader caching would introduce freshness/invalidation complexity.

## 23. Recommended First Implementation

**First target:** `/[locale]/together/members`, specifically the ownership-impact enrichment after the member list.

Current measured route shape: 10 Supabase/Auth fetches across three waves, with a small three-run route probe median of 1,254 ms. The candidate implementation should return the same per-member counts from a narrow, trusted read model. The expected shape is six fetches across two waves if all member IDs can be resolved in that read; otherwise it is six fetches across three waves with only the five-table work collapsed.

Why this target: it is the only confirmed Together-domain third wave and request multiplicity hotspot. The hub's three domain reads are already parallel, so a hub-specific RPC is not justified by the current latency evidence.

Implementation gate: do not implement until the replacement has an equivalent result/RLS test and either a live SQL plan or a safe, measurable benchmark showing that the aggregate removes the five-call cost. If Members does not need faster navigation, stop here; the hub has no evidence-backed first optimization beyond optional prefetch suppression.

## 24. Raw Evidence

Source files inspected included:

- `app/[locale]/(product)/layout.tsx`
- `app/[locale]/(product)/together/page.tsx`
- `app/[locale]/(product)/together/loading.tsx`
- `app/[locale]/(product)/together/members/page.tsx`
- `app/[locale]/(product)/together/invitations/page.tsx`
- `app/[locale]/(product)/together/settings/page.tsx`
- `app/[locale]/(product)/together/settings/preferences/page.tsx`
- `app/[locale]/(product)/together/settings/policies/page.tsx`
- `app/[locale]/(product)/together/settings/account/page.tsx`
- `app/[locale]/(product)/together/invitations/new/page.tsx`
- `app/[locale]/(onboard)/together/onboard/page.tsx`
- Together actions, application loaders, `proxy.ts`, `perf-trace.ts`, navigation constants, and the Together management pattern.

Commands and observations:

- `npm run build` passed on Next.js 16.3.1.
- A production server ran with `VINHA_PERF_TRACE=1` and emitted structured Supabase/Auth fetch spans.
- Ten authenticated Chromium loads of `/en/together` at a 440 px viewport recorded six remote requests per load, all HTTP 200. The Together marker median was 714 ms; full-load median was 826 ms; TTFB median was 314 ms.
- A separate 20-sample direct benchmark measured the endpoint classes in Section 18.
- Three-load probes for the secondary Together routes measured: Members 10 fetches/3 waves; Invitations 4/2; Settings 4/2; Preferences 4/2; Policies 5/2; Account settings 3/1 effective main wave.
- Browser inspection found no initial client data-fetch effect. Link prefetch attempts were observed, but no additional Supabase fetches were confirmed from them.
- PostgREST plan-media attempts returned `406 PGRST107`; no database mutation, schema mutation, RPC creation, index creation, or application code change was performed.

Representative hub server trace, normalized to the first request:

```text
GET /auth/v1/user                         +0 ms   330 ms
GET /rest/v1/household_members (current)  +7 ms   350 ms
GET /rest/v1/households                   +359 ms 271 ms
GET /rest/v1/household_members (list)     +360 ms 276 ms
GET /rest/v1/household_invitations        +360 ms 315 ms
HEAD /rest/v1/inbox_items                 +361 ms 507 ms
```

Safety boundary: this was a diagnostic-only run. Production changes: **none**. Financial or household data mutations: **none**. The report is marked **PARTIAL** solely because live PostgreSQL execution plans were unavailable and prefetch server amplification was not conclusively measurable.
