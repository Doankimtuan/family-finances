# Inbox Benchmark Safety

**Audit date:** 2026-10-11

**Scope:** GET-path side effects, local maintenance isolation, and benchmark readiness. No hosted request, login, fixture setup, Inbox action, or financial mutation was run.

## 1. Automatic write-path inventory

| Reachable operation                                          | Classification                     | Evidence                                                                                                                                                                     |
| ------------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session user and active household membership                 | Confirmed read-only                | `getSessionUser()` calls Auth `getUser()`; `resolveActiveMembership()` selects the active member row. The Product layout uses the equivalent `requireProductSession()` gate. |
| Open queue, unread badge, archived queue                     | Confirmed read-only                | Inbox and membership queries use PostgREST selects/counts. The badge uses an exact-count `HEAD` request.                                                                     |
| Source enrichment and owner-membership validation            | Confirmed read-only                | Transaction, savings, loan, liability, and household membership reads are selects; the existing owner validation remains in the query path.                                  |
| Detail action-reference jars                                 | Confirmed read-only                | `listCaptureJars()` selects active jars for the authorized household.                                                                                                        |
| `run_inbox_staleness_worker`                                 | Confirmed mutating                 | The SQL function updates pending Inbox rows whose expiry has passed, changing status and expiry metadata.                                                                    |
| `sync_loan_debt_attention_inbox`                             | Confirmed mutating                 | The SQL function calls `produce_inbox_item` for loan/debt attention and archives obsolete pending attention rows. Both operations write Inbox rows.                          |
| Read/unread action                                           | Confirmed mutating, user-triggered | The server command rechecks `assertMoneyActionAllowed()` and updates only `read_at`. It is called by explicit server actions after a button press, not by a GET render.      |
| Resolve, dismiss, acknowledge actions and their revalidation | Confirmed mutating, user-triggered | These are explicit server actions. Revalidation runs after a successful command and is not reachable from the GET page render.                                               |

The two maintenance RPCs are the only confirmed writes reached automatically from the open queue GET. The staleness function is defined in `supabase/migrations/20260825125516_v1_baseline.sql`; the loan/debt function also invokes the Inbox producer defined in that migration. Both functions are `SECURITY DEFINER` and perform their own authenticated-household checks. No RLS, query, action, or RPC definition was changed.

## 2. GET-route side-effect classification

| GET surface           | Read path                                                                                                      | Automatic side effects                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product layout        | Product session/membership gate; unread count for the bottom-navigation badge                                  | No writes or revalidation.                                                                                                                         |
| `/inbox`              | Session and active membership; open page plus source enrichment and owner validation; badge runs in the layout | Schedules the two confirmed-mutating RPCs through `after()` after the page reads complete, unless local benchmark isolation is explicitly enabled. |
| `/inbox?tab=archived` | Session and active membership; archived queue plus source enrichment; badge runs in the layout                 | No maintenance client is created and no `after()` callback is scheduled.                                                                           |
| `/inbox/[id]`         | Session and active membership; selected Inbox item plus source enrichment/owner validation; capture jars       | No `after()`, automatic read-state update, action, or revalidation. Opening detail does not mark the item read.                                    |

Next 16.3.1 documents that `after()` runs after the response and can still run after an error, redirect, or `notFound`; its callback is therefore part of the GET safety boundary, even though it does not block first content. `createSupabaseServerClient()` itself creates a cookie-backed client; the mutating requests happen only when the two callbacks call their RPCs.

The read/unread control invokes the server action only on explicit user activation. `setInboxReadState()` authorizes server-side before issuing the `read_at` update; opening a detail route does not update local or server read state.

## 3. Local maintenance isolation design

No existing test-only injection seam was found. The smallest reversible seam is now in the Inbox page: it skips scheduling the `after()` callback only when both conditions hold:

- `NODE_ENV` is `development`.
- `INBOX_READ_ONLY_BENCHMARK` is exactly `true`.

The environment key and accepted value live in `modules/inbox/application/inbox-constants.ts`. Production always schedules maintenance, including when the opt-in variable is present. Missing or invalid settings also schedule maintenance. The guard runs after the same session, household, and queue reads and does not change query parameters, query results, source enrichment, owner validation, authentication, or RLS. The archived route remains unchanged.

This mode is for a local `next dev` server. It is not enabled for `next start` or production deployments. No `.env` file was edited and no permanent production flag was added.

## 4. Deterministic safety evidence

`tests/unit/inbox-maintenance-safety.test.tsx` exercises the actual page and worker functions with a fake Supabase client; it does not contact a database.

- Production schedules the callback and invokes both expected RPC names when the captured callback is executed against the fake client.
- Exact local benchmark opt-in schedules no callback and invokes zero RPCs.
- Missing, invalid, test, and production configurations all keep maintenance enabled.
- The rendered queue output and session, membership, and queue-read calls match between ordinary and isolated open-page renders.
- The archived GET reads the archive without creating a maintenance client or scheduling `after()`.
- `tests/unit/inbox-queue-contract.test.ts` verifies that read/unread changes remain behind the server authorization gate and update only `read_at`.
- `tests/unit/next-config-security.test.ts` verifies `logging.serverFunctions: false`; the setting remains present in `next.config.ts`.

Focused validation: **36 tests passed across 5 files**, including Inbox query/capability contracts and Next logging configuration.

Repository validation:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.3.1.
- `git diff --check`: passed.
- `npm run test`: 1,842 passed; 5 failed in unrelated translation parity, account presentation context, and Money privacy assertions.
- `npm run format:check`: reported 193 repository files, including this new audit before formatting. This audit and the changed code/tests were formatted and checked separately; unrelated files were left untouched.

## 5. Credential readiness

The attachment says the previously exposed E2E password has not been confirmed rotated. No login was attempted, no credential/cookie/JWT/Auth header was read or logged, and no personal browser profile was used. `next.config.ts` still sets `logging.serverFunctions` to `false`.

**Current status: blocked pending explicit credential-rotation confirmation.**

## 6. Existing Inbox fixture availability

The repository has synthetic unit rows in `tests/fixtures/inbox-fixture.ts`; these prove mapper and pagination contracts but do not represent an authorized household or real RLS/source-enrichment coverage.

Historical closeouts record a six-item authenticated queue with transaction and savings sources, household-owned and other-active-owner cases, and a working detail path. They also record that loan/liability source rows, current-owner, former-owner, and foreign-household cases were unavailable in that run. This historical evidence does not establish the present state of any household or archived rows.

The populated Playwright spec invokes `scripts/inbox-populated-fixture.mjs setup` and cleanup, and its flow changes read state. Neither it nor any fixture-creating setup was run. With credential rotation unconfirmed, no currently approved read-only household inspection was available.

| Coverage                              | Current readiness                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Open item and detail                  | Historical evidence only; no current authenticated verification.                                    |
| Archived item                         | Not established by current read-only evidence.                                                      |
| Transaction/savings source enrichment | Historical evidence only; loan/debt source coverage was absent then.                                |
| Owner validation                      | Historical household/non-owner cases only; current/former/foreign live coverage remains incomplete. |

## 7. Instrumentation plan

The existing `VINHA_PERF_TRACE=1` wrapper logs method, URL pathname, status, request-start timestamp, and time until `fetch()` returns response headers; it does not log tokens, bodies, or row data. Existing Auth and membership spans report SDK call duration. Inbox table/source SDK results and local enrichment/mapping are not currently separated into spans.

For a cleared run, collect these stages with a per-run opaque label and aggregate counts only:

```text
Navigation click
  → Auth/session and active membership
  → base Inbox page SDK result
  → source batch SDK results
  → owner-membership validation SDK result
  → local mapping and queue model ready
  → RSC response headers/body completion and decoded bytes
  → first useful row visible

Parallel: unread badge count and completion
```

For detail, measure selected item read, source enrichment/owner validation, capture-jars read, detail context ready, and actions visible. Supabase measurements should separate request start, headers, body completion/bytes, SDK return, and mapping time. Record source type and row-count buckets only. Use browser DevTools/CDP for navigation/RSC request counts, RSC bytes, and first-content markers. Any body-size probe must avoid retaining or printing response content and should be run as a separate instrumented sample if stream cloning adds measurable overhead. Never log source IDs, item IDs, household/member IDs, content, financial values, cookies, tokens, or headers.

## 8. Safe benchmark protocol

Start only after the credential is confirmed rotated and an existing authorized household is approved for read-only use. Use a fresh Codex-controlled Brave context, never the personal profile. Run the local app with the exact benchmark setting and verify the safety test remains green before navigating. Do not run fixture setup or click resolve, dismiss, acknowledge, read, or unread actions.

Capture these independent paths:

1. Bottom Navigation → Inbox.
2. Open list → detail.
3. Detail → app Back.
4. Detail → browser-history Back.
5. Open ↔ Archived tab transition.

Record actual Supabase request counts and sequential waves, RSC request count and decoded bytes, first useful row/detail visibility, and search/filter/scroll restoration. Collect at least ten warm samples for the principal open-queue path and report p50/p75; keep one cold-ish sample separate. Do not use the September historical timings as the current baseline. No benchmark has been run in this phase.

## 9. Remaining security blockers

- Credential rotation remains unconfirmed, so authenticated browser access and current household fixture inspection are blocked.
- No present-day archived/source/owner-validation fixture matrix was verified; no shared rows were seeded or changed.
- The isolation test uses a fake client and proves route scheduling behavior, not hosted database state. The later benchmark must use only existing data and retain normal authentication/RLS.
- Isolation is deliberately limited to `next dev`; its browser timings are development-mode measurements and must not be reported as a production baseline.
- Owner validation and source visibility/capability behavior remain unchanged. The rejected embedded-owner shortcut was not reintroduced.

## Final decision

**INBOX PHASE 0.1 COMPLETE — ISOLATION VERIFIED, CREDENTIAL BLOCKED**
