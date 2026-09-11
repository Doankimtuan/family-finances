# Plan Inbox Enrichment Optimization

Date: 2026-09-11  
Scope: authenticated Plan hub inbox enrichment only  
Status: **COMPLETE**  
Prototype: **ACCEPTED**

## 1. Executive Summary

The inbox enrichment path had one avoidable waterfall after the bounded
`inbox_items` read:

```text
base inbox rows
  -> transactions
  -> savings
  -> loans
  -> liabilities
  -> active owner memberships
```

The selected candidate was Option B: keep the existing PostgREST reads and
start every source read discovered from the base rows in one `Promise.all`
wave. Active-owner membership validation remains after those reads because its
IDs are returned by the source rows and its result controls privacy/capability
mapping.

The candidate preserved raw data, UI mapping, assignment filtering, ownership
validation, RLS boundaries, and all public Plan contracts. The direct
authenticated benchmark improved median inbox-path latency from **849 ms to
630 ms** and p95 from **932 ms to 648 ms**, with the same four HTTP calls and
the same 7,294 response bytes in the representative household. The Plan
decisions marker improved from **1,368 ms to 1,262 ms** in paired 10-load
browser samples.

## 2. Current Inbox Architecture

`listOpenInboxItems()` is the bounded open-queue read used by the Plan hub,
Health detail, the Inbox queue, archived/detail reads, and Plan jar detail.

The flow is:

1. `assertMoneyActionAllowed()` resolves the authenticated active household,
   current user, and current membership.
2. `inbox_items` is read with the canonical pending-kind filter, household
   filter, current-user assignment visibility filter, newest-first ordering,
   and `INBOX_OPEN_PAGE_SIZE` limit.
3. `enrichWithTransactionDetails()` derives source IDs by canonical Inbox kind.
4. Source rows are read from transactions, savings, loans, and liabilities.
5. `listActiveMembershipIds()` validates which personal-resource owners are
   still active household members.
6. `resolveFinancialCapabilities()`,
   `resolveInboxSourceCapabilities()`, and `mapInboxRow()` produce the same
   `InboxReviewItem[]` contract used by the Plan decisions view model.

## 3. Enrichment Dependency Graph

### Before

```text
W0  inbox_items
      |
W1  transaction source details
      |
W2  guided savings ownership
      |
W3  loan ownership (conditional)
      |
W4  liability ownership (conditional)
      |
W5  active owner-membership validation
      |
    capability mapping -> InboxReviewItem[]
```

Only present source kinds create a read. In the measured household the active
queue contained six rows: four transaction-source rows and two guided-savings
rows. Therefore the observed path was four remote waves: base queue, transaction
details, savings ownership, and active owner-membership validation.

### After

```text
W0  inbox_items
      |
W1  transactions || savings || loans || liabilities
      |
W2  active owner-membership validation
      |
    capability mapping -> InboxReviewItem[]
```

The source reads remain conditional and use the same selected fields and
filters. Only their dependency depth changed.

### Exact enrichment inventory

| Step               | Source and selected fields                                                                               | Dependency                                            | Conditional |     Measured rows / bytes | Consumer                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------- | ------------------------: | ------------------------------------------- |
| Base queue         | `inbox_items`: 18 queue/display fields, assignment and status filters                                    | Session allowance                                     | No          |               6 / 6,121 B | Plan decisions, Inbox queue, Health         |
| Transaction source | `transactions`: `id`, `note`, `categories(name)`, `accounts(name, financial_scope, owner_membership_id)` | Base rows with `source_type=transaction`              | Yes         |                 4 / 834 B | Inbox title/details and ownership           |
| Savings source     | `savings`: `id`, `financial_scope`, `owner_membership_id`                                                | Savings/early-withdrawal kinds and context `savingId` | Yes         |                 2 / 243 B | Ownership/capability only                   |
| Loan source        | `loans`: `id`, `financial_scope`, `owner_membership_id`                                                  | EMI/loan-attention kinds and context `loanId`         | Yes         | 0 / no request in fixture | Ownership/capability only                   |
| Liability source   | `liabilities`: `id`, `financial_scope`, `owner_membership_id`                                            | EMI/debt-attention kinds and context `debtId`         | Yes         | 0 / no request in fixture | Ownership/capability only                   |
| Owner validation   | `household_members`: `id`, active owners only                                                            | Owner IDs returned by source reads                    | Yes         |                  2 / 96 B | Former-owner and non-owner capability state |

The measured aggregate response payload was 7,294 B in both shapes. No account
or category lookup is separate: the transaction read returns those relations.
No source mapping moved into SQL.

## 4. Privacy / Ownership Contract

- Assigned Inbox rows remain visible only when `assigned_to_user_id` is null
  or equals the authenticated user. The base filter was unchanged.
- Transaction display data remains `note`, category name, and account name.
  Transaction account ownership remains `financial_scope` plus
  `owner_membership_id` from the nested account relation.
- Savings, loans, and liabilities remain household-scoped ownership reads.
  Their fields are used only to resolve source capability.
- Household-scoped resources remain actionable for an active household
  member. Personal resources owned by the current membership remain
  actionable.
- Personal resources owned by another active membership remain read-only.
- Personal resources whose owner membership is inactive remain
  `READ_ONLY_FORMER_OWNER`.
- Missing source rows or source-read errors continue to map to the existing
  unavailable/readable state rather than silently granting action capability.
- Foreign household source IDs cannot be selected through the household-
  scoped savings/loan/liability reads; transaction visibility remains guarded
  by the existing transaction RLS policy.
- Anonymous and no-membership callers still fail the existing
  `assertMoneyActionAllowed()` gate. The Plan route redirects anonymous users
  to login.

The second `household_members` read is genuinely required. The session gate
only proves the current member is active; it cannot prove that every personal
source owner is active. It was retained.

## 5. Baseline

Commands:

```text
npm run build
VINHA_PERF_TRACE=1 npm run start
```

The fresh baseline used 10 warm authenticated Chromium loads at 440 px. This
sample supersedes the earlier ~1,565 ms decisions reference for the current
fixture/network condition.

| Metric             |      Min |   Median |      P75 |      P95 |      Max |
| ------------------ | -------: | -------: | -------: | -------: | -------: |
| Response start     |   219 ms |   231 ms |   263 ms |   406 ms |   406 ms |
| Pulse visible      |   462 ms | 1,078 ms | 1,093 ms | 1,270 ms | 1,270 ms |
| Jars visible       |   608 ms | 1,088 ms | 1,143 ms | 1,271 ms | 1,271 ms |
| Decisions visible  | 1,144 ms | 1,368 ms | 1,873 ms | 1,880 ms | 1,880 ms |
| Full Plan complete | 1,147 ms | 1,371 ms | 1,879 ms | 1,889 ms | 1,889 ms |

The representative warm Plan inventory remains 19 server fetches after the
previous jar-budget optimization. The inbox portion is four calls on this
fixture: base queue, transaction details, savings ownership, and owner
membership validation.

## 6. Candidate Designs

| Option                               | Result                        | Reason                                                                                                            |
| ------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| A. Keep current shape                | Rejected                      | Preserves the confirmed serial tail.                                                                              |
| B. Parallelize existing enrichments  | **Selected**                  | Smallest diff; no new RPC, schema, UI, or security boundary.                                                      |
| C. Narrow inbox-source RPC           | Rejected                      | More database/security surface for the same reads; no need demonstrated.                                          |
| D. Extend base PostgREST read        | Rejected                      | Polymorphic source IDs and nested ownership do not form one safe relationship without changing the read contract. |
| E. Reuse existing membership/context | Rejected for owner validation | Current active membership is insufficient to validate other and inactive owners.                                  |

## 7. Selected Prototype

Option B starts the existing transaction, savings, loan, and liability queries
after deriving all IDs from the base rows, then awaits them together. The
existing error flags, ownership maps, active-membership validation, capability
resolution, and mapper are unchanged.

Changed production file:

- `modules/inbox/application/queries/review-items.ts`

Database changes: **none**  
Financial data mutations: **none**  
Plan UI contract changes: **none**  
Client-side reads: **none**

## 8. Raw Equivalence

Twenty interleaved authenticated paired comparisons used the same household,
base queue shape, source projections, ownership fields, and owner-membership
validation.

Compared per item/source:

- Inbox ID, kind, status, assignment, and source ID/type;
- transaction note, account, and category relations;
- savings/loan/liability ownership fields;
- owner membership activity rows and error states.

Result: **20/20 raw semantic matches**. No row, ordering-independent field,
ownership, or error-state mismatch was observed.

## 9. UI Equivalence

Both shapes feed the same existing `mapInboxRow()` and capability-resolution
logic. No Plan or Inbox rendering file changed.

Evidence:

- focused Inbox integration/error/queue suite: **30/30 passed**;
- authenticated Plan hub smoke: **2/2 passed**;
- 10/10 after-profile Plan loads rendered decisions and all existing markers;
- no console errors or horizontal overflow in the after-profile;
- display titles, source labels, capability states, assignment filtering,
  empty behavior, and guided-savings actions remain owned by the existing
  mapper and UI contracts.

Verdict: **PASS**.

## 10. RLS / Tenancy

The candidate did not change a query table, selected field, household filter,
auth gate, RLS policy, or database function. Existing policies remain the
security boundary: `inbox_items` is household-member scoped; transactions use
the existing active-membership policy; savings, loans, liabilities, and
household members retain their existing household policies.

| Probe                             | Result | Evidence                                                                                                                           |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| A. Active member with Inbox items | PASS   | Authenticated direct benchmark: 20/20 successful reads; expected six base rows and six source rows.                                |
| B. Active member with no Inbox    | PASS   | Existing bounded path performs no source reads when no source IDs exist; queue contract tests pass.                                |
| C. Non-member                     | PASS   | Existing RLS/policy evidence; no candidate boundary changed.                                                                       |
| D. Foreign household source       | PASS   | Household-scoped source filters and unchanged transaction RLS; no source leakage in 20 paired reads.                               |
| E. Inactive owner                 | PASS   | `listActiveMembershipIds()` remains after source reads and only returns active owners; former-owner capability logic is unchanged. |
| F. Anonymous                      | PASS   | Existing money-action gate plus unauthenticated Plan redirect; Plan hub E2E passed.                                                |

No disposable fixture or live mutation was created for this phase. The matrix
is a contract-preservation check against the unchanged RLS/query boundary and
the existing live policy evidence from the preceding Plan audits.

## 11. Direct Benchmark

The direct benchmark used 20 authenticated sequential samples per shape after
warmup. Each sample included the base Inbox read, all conditional source
reads, and active owner-membership validation. The representative household
had transaction and savings sources; loan and liability reads were correctly
skipped because no matching Inbox kinds were present.

| Shape              | Calls | Waves | Median |    P75 |    P95 |      Max | Response bytes | Errors |
| ------------------ | ----: | ----: | -----: | -----: | -----: | -------: | -------------: | -----: |
| Current sequential |     4 |     4 | 849 ms | 852 ms | 932 ms | 1,121 ms |        7,294 B |      0 |
| Candidate parallel |     4 |     3 | 630 ms | 639 ms | 648 ms |   648 ms |        7,294 B |      0 |

The win is dependency depth, not payload reduction or call-count reduction.

## 12. Decision Gate

| Gate                              | Result                                               |
| --------------------------------- | ---------------------------------------------------- |
| Raw equivalence                   | PASS — 20/20                                         |
| UI equivalence                    | PASS                                                 |
| RLS / privacy                     | PASS by unchanged security contract and evidence     |
| Calls or waves decrease           | PASS — waves 4 → 3                                   |
| Median or p95 improves materially | PASS — median -219 ms; p95 -284 ms                   |
| Maintainable architecture         | PASS — existing reads, mapper, and policies retained |

Decision: **ACCEPT**.

## 13. Implementation

`enrichWithTransactionDetails()` now:

1. derives transaction, savings, loan, and liability source IDs;
2. creates the same conditional PostgREST reads;
3. awaits the source reads in one `Promise.all` wave;
4. applies the existing response/error mapping;
5. validates active owner memberships and maps capabilities exactly as before.

No raw source read was removed. No mutation path uses this query. Other Inbox
callers (`listOpenInboxPage`, archived reads, and `getInboxItem`) receive the
same enrichment behavior because they share this helper.

## 14. Fetch Inventory Before vs After

| Measure                                    | Before | After |
| ------------------------------------------ | -----: | ----: |
| Warm Plan fetches                          |     19 |    19 |
| Inbox remote calls, representative fixture |      4 |     4 |
| Inbox dependency waves                     |      4 |     3 |
| Plan jar-budget RPC                        |      1 |     1 |
| Client Supabase reads                      |      0 |     0 |
| Financial mutations                        |      0 |     0 |

The after server trace showed transaction and savings requests starting at the
same offset, followed by the owner-membership request after both completed.

## 15. Plan Timing Before vs After

Warm authenticated Chromium at 440 px, 10 loads per shape:

| Marker             | Before median | After median | Before P95 | After P95 |
| ------------------ | ------------: | -----------: | ---------: | --------: |
| Response start     |        231 ms |       241 ms |     406 ms |    448 ms |
| Pulse visible      |      1,078 ms |       545 ms |   1,270 ms |  1,303 ms |
| Jars visible       |      1,088 ms |       547 ms |   1,271 ms |  1,304 ms |
| Decisions visible  |  **1,368 ms** | **1,262 ms** |   1,880 ms |  1,362 ms |
| Upcoming visible   |      1,370 ms |     1,264 ms |   1,884 ms |  1,364 ms |
| Goals visible      |      1,370 ms |     1,266 ms |   1,887 ms |  1,366 ms |
| Full Plan complete |  **1,371 ms** | **1,267 ms** |   1,889 ms |  1,369 ms |

Pulse/jars are affected by normal sibling streaming and network variance; the
inbox KPI is decisions visibility.

## 16. Remaining Bottlenecks

- Hosted Supabase request latency remains the dominant floor.
- Plan decisions still shares the broader Plan view-model fan-out with goals,
  pulse, and budget data.
- The upcoming preview still has independent cross-domain reads.
- Household projections remain overlapping but parallel.
- The inbox source call count did not decrease; only the serial dependency
  depth decreased.

## 17. Recommended Next Step

**C — STOP PLAN OPTIMIZATION.** The inbox tail is now one parallel enrichment
wave, decisions/full completion are near the existing target range, and the
remaining work is optional secondary fan-out rather than a demonstrated
Inbox bottleneck.

## 18. Raw Evidence

Repository evidence:

- `npm run build` — PASS.
- `npm run typecheck` — PASS.
- `npx eslint modules/inbox/application/queries/review-items.ts` — PASS.
- Focused Inbox tests — **30 passed**.
- Full Vitest — **1,446 passed, 4 pre-existing unrelated failures** in market
  valuation, transaction pagination, app-shell foundation, and auth welcome
  presentation query-shape tests.
- Full lint — **10 pre-existing errors** in profiling scripts under `output/`;
  no error in the changed production file.
- Authenticated Plan hub E2E — **2 passed**.

Measurement artifacts:

- `output/playwright/plan-perf/inbox-baseline-timing.json` — fresh 10-load
  baseline.
- `output/playwright/plan-perf/inbox-after-timing.json` — fresh 10-load
  after-profile.
- `/tmp/plan-inbox-after-server.log` — traced after server evidence.
- Direct benchmark: 20 authenticated samples per shape, sequential per shape;
  raw semantic equivalence **20/20**.

Database/security evidence:

- No migration, RPC, RLS policy, Auth setting, service-role read, financial
  mutation, or infrastructure change was made.
- Existing Plan and Inbox policy evidence remains applicable because the
  candidate changed only scheduling of the same authenticated reads.

Final classification: **MEANINGFUL WIN**.
