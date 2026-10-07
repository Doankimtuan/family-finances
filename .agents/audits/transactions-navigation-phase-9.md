# Transactions Navigation Phase 9 — One-Wave Transfer Detail

Date: 2026-10-07

## Migration

Added `public.get_transaction_detail_rows(p_transaction_id uuid, p_household_id uuid) RETURNS SETOF public.transactions` in `supabase/migrations/20261007033708_transaction_detail_rows.sql`.

The function is `STABLE SECURITY INVOKER` with an empty `search_path`. Its materialized selected-row CTE anchors on both the transaction ID and supplied household before deriving a transfer group. It accepts no transfer-group ID. Transfer rows are filtered to the selected household and ordered source-first; non-transfer selections return only the selected row.

The migration revokes execute from `PUBLIC` and `anon`, then grants it to `authenticated`. It does not alter transaction grants, RLS, or policies. Unit coverage checks this migration contract as text; the resulting function and ACLs were not inspected in a database.

The local Supabase stack could not start because Docker is unavailable. The configured endpoint is the shared hosted project identified by the repository’s data-isolation audit; that audit requires operational controls and a confirmed backup before remote DDL. The migration was therefore not applied, replayed, or pushed.

## Production integration

The detail route now calls `getTransactionDetailReadResult()`. It calls the RPC through the normal authenticated server client, applies the existing `TX_SELECT`, maps rows with `mapTransactionRow`, validates transfer groups with `isCompleteTransferGroup()`, and projects the activity with `createTransactionActivities()`.

The RPC is used for both transfer and ordinary detail because the server has no trustworthy transaction type before reading the selected row. Ordinary Expense/Income receives its selected row only. The activity promise stays separate from the selected-row result so audit and tag reads can start after the row arrives, preserving their secondary boundary.

RPC errors return the existing safe read-error state. There is no GET fallback. A one-row or malformed transfer does not produce a Transfer activity.

## Request topology

Code and mocked-client tests show one transaction-detail RPC call and no follow-up transaction GET for Transfer. They also verify the server-derived household is passed and no group ID is sent.

Production request count remains unverified because the migration is not installed. No browser request trace was collected.

## Security

- Function definition explicitly uses invoker security and an empty search path.
- The selected row is filtered by transaction ID and server-supplied household before the transfer group is derived.
- Peer rows use the selected household and remain subject to normal transaction RLS.
- The application stops before creating a Supabase client when active membership is unavailable.
- Migration-contract and unit tests cover grants, household argument selection, no-membership behavior, and missing selected rows.
- Authenticated success, anonymous denial, wrong-household results, active-membership enforcement in PostgreSQL, and actual production grants were not runtime-verified for this permanent function.

The Phase 8.1 temporary prototype previously passed authenticated, anonymous, and wrong-household checks; those results are prototype evidence, not verification of this migration.

## Correctness

Focused tests cover both selected leg orientations, identical source-first activity IDs, source-note preference and destination-note fallback, and all malformed cases: missing leg, three rows, duplicate type, amount/currency/date/savings-kind mismatch, non-posted leg, same account, same transaction row, and selected row absent.

Ordinary rows produce an ordinary activity from the one-row RPC response. RPC failure returns an error and does not become an empty transaction or trigger an extra GET. No live rendered fingerprint comparison was performed.

## Transfer performance

No same-run Phase 8 control versus Phase 9 benchmark was collected. Phase 8.1 numbers below are historical references only; they are not Phase 9 results.

| Metric                |     Phase 8.1 control reference, p50 / p75 | Phase 9, p50 / p75 |        Delta |
| --------------------- | -----------------------------------------: | -----------------: | -----------: |
| Session gate          |                               300 / 447 ms |       Not measured | Not measured |
| Transaction read      | Selected 263 / 308 ms; pair 262.5 / 278 ms |       Not measured | Not measured |
| Transaction requests  |                                2 per route |       Not measured | Not measured |
| Activity ready        |                             524.5 / 604 ms |       Not measured | Not measured |
| Route return          |                             803.5 / 883 ms |       Not measured | Not measured |
| Click → complete hero |                               896 / 959 ms |       Not measured | Not measured |

The Phase 8.1 prototype measured 664 / 699 ms click-to-hero and 1,317 decoded bytes for the one-wave RPC, versus 1,968 bytes across the two control reads. Those prototype measurements do not establish Phase 9 performance or payload size.

Cold-ish and warm samples, server-to-browser tail, and Phase 9 payload were not measured.

## Ordinary Detail regression

Expense and Income remain on one authoritative selected-row read, followed by the same activity projection and deferred audit/tag boundaries. Their underlying read is now the detail RPC so the route can identify transfers without a preliminary GET.

The required five warm ordinary samples were not collected. Phase 7’s historical ordinary hero reference was 728.5 / 734 ms p50 / p75; there is no comparable Phase 9 measurement. Ordinary performance is unverified.

## Phase regressions

- **Phase 1 Back:** navigation code was not changed; automated transaction return-navigation tests pass. No browser Back trace was collected in this phase.
- **Phase 5 List:** list scanner, transfer completeness logic, and pagination were not changed.
- **Phase 6 Session:** session gate and membership code were not changed; existing route gate tests remain green.
- **Phase 7 Detail:** ordinary audit/tag reads remain secondary and Transfer does not start either read, covered by route tests. No browser regression evidence was collected.

## Validation

- Focused transaction-detail and route tests: **27 passed**.
- `npm run lint`: **passed**.
- `npm run typecheck`: blocked by the two existing translator-type errors in untouched `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340; no Phase 9 type errors remain.
- `npm run test`: **1,794 passed, 5 failed** across 261 files. The failures are the existing English/Vietnamese `money.savingsPage.summaryCaption` key-parity mismatch, three account presentation tests missing `NextIntlClientProvider`, and the existing money-privacy wrapping expectation.
- `npm run format:check`: **failed** on repository-wide formatting debt. Phase 9 TypeScript files were formatted; unrelated skill, audit, and application files remain unformatted.
- Build was not run because typecheck is blocked by the existing Home errors.
- Browser benchmark and E2E were not run. The candidate RPC is not installed, and the repository audit warns that the configured shared hosted database is not an isolated test target.
- No financial transactions or other application data were written.

## Remaining bottleneck

Closeout needs an isolated database (or the required operational controls and confirmed backup for the hosted project), then migration replay/catalog checks, authenticated and denied-call verification, and same-run transfer plus ordinary browser samples. No Phase 10 optimization is proposed.

**TRANSACTIONS PHASE 9 PARTIAL — INVESTIGATE BEFORE CLOSEOUT**
