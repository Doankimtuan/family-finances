# Phase 3D — Inbox performance

## Loading path

The Inbox route calls the bounded open-page query, which scopes rows to the active household and current user's assignment visibility, filters supported pending kinds, orders by creation time and id, and requests one extra row for pagination. It enriches only returned source IDs, with independent transaction, saving, loan, and liability lookups run in parallel when those ID groups exist. The route starts staleness and debt/loan attention workers after the response path.

The Plan emergency banner uses `listOpenInboxItems` because it needs item details; the smaller attention query would not provide its item, assignee, or emergency context.

## Measurements

- Inbox transitions used a median of 4 Supabase REST/RPC calls per sample: membership, `inbox_items`, and the two post-response maintenance/attention RPCs when present.
- The Inbox REST request measured 282 ms median on warm Plan → Inbox and 269 ms median on warm Money → Inbox. Background RPC durations were generally 257–283 ms median and can appear in the capture window after the response path.
- The actual page queue query selected `inbox_items_open_read_cursor_idx`; execution was 0.159 ms and 5 shared-buffer hits for an empty disposable queue. This is not a load test.
- Data-bearing Inbox summary appeared at 945 ms median / 1,045 ms p95 on warm Plan → Inbox and 924 / 1,293 ms on warm Money → Inbox.

## Decision

The bounded query and existing cursor index are appropriate for the observed data. The generic household/status/created index already exists, so a new index would be redundant for this evidence. No Inbox query, worker, or schema change was made.

## Source files

- [Inbox route](<../../../app/[locale]/(product)/inbox/page.tsx>)
- [Inbox query and enrichment](../../../modules/inbox/application/queries/review-items.ts)
- [Inbox kind and page-size constants](../../../modules/inbox/application/inbox-constants.ts)
