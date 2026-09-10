# Phase 12 — Implementation notes

**Status:** Presentation implemented. Authenticated browser validation is blocked by the existing login hydration gate (`Log in` stays `disabled` because `busy || !hydrated`). Does not overwrite `.agents/design-system.md`. Next phase is Together — not started.

## What this phase did

Make Inbox answer:

> What needs my attention, and what can I finish now?

without turning it into a notification dump, a second ledger, or a financial-advice surface.

## Files changed

### Queue

- `app/[locale]/(product)/inbox/page.tsx` — count-aware summary headline
- `app/[locale]/(product)/inbox/inbox-queue-list.tsx` — kind groups, 44px filters, wrap chips, filtered-empty + clear
- `app/[locale]/(product)/inbox/inbox-queue-row.tsx` **new** — scan row with financial-number kind
- `app/[locale]/(product)/inbox/inbox-queue-tabs.tsx` — 44px tabs, `aria-controls`, roving tabindex, arrow/Home/End
- `app/[locale]/(product)/inbox/inbox-queue-transition.tsx` — `role="tabpanel"` + `aria-labelledby`
- `app/[locale]/(product)/inbox/inbox-queue-skeleton.tsx` — 44px loading chrome

### Detail / actions

- `app/[locale]/(product)/inbox/[id]/page.tsx` — amount kind, omit missing amounts, source context before the action panel
- `app/[locale]/(product)/inbox/inbox-detail-context.tsx` — amount block only when a label exists
- `app/[locale]/(product)/inbox/inbox-decision-panel.tsx` — early-withdrawal net/penalty as `ESTIMATE`; mutation payloads unchanged
- `app/[locale]/(product)/inbox/inbox-financial-amount.tsx` **new** — `FinancialValue` + `data-financial-kind`

### Presentation helpers / constants / copy

- `app/[locale]/(product)/inbox/inbox-presentations.ts` — `inboxAmountKind`, `inboxAmountLabel`, `groupInboxItemsByKind`, `isInboxFilterActive`
- `modules/inbox/application/inbox-constants.ts` — test-id helpers only (`inboxGroupTestId`, `inboxFilterTestId`, extra `INBOX_TEST_ID` keys)
- `messages/en/inbox.json` / `messages/vi/inbox.json`

### Tests

- `tests/unit/phase-12-inbox.test.tsx` **new**
- `tests/unit/inbox-scan-hierarchy.test.tsx` — kind group assertion

Not changed: queries, commands, RPCs, mappers, `actions.ts` server contracts, event generation, navigation architecture.

## Route / helper usage

- `APP_PATH.INBOX`, `inboxItemPath`, `inboxQueuePath`
- Source: `moneyTransactionPath`, `moneySavingsPath`, `moneyLoanPath`, `moneyDebtPath`, `planJarPath`, `APP_PATH.PLAN`
- Query keys: `INBOX_TAB_QUERY`, `INBOX_RECEIPT_QUERY` (unchanged names)

## Read models reused

- `listOpenInboxPage` / `listArchivedInboxItems` / `getInboxItem`
- `listCaptureJars` on detail (existing)
- `InboxReviewItem` as-is

## Mutation contracts reused

`resolveInboxAction({ inboxItemId, jarId })`, `dismissInboxAction({ inboxItemId })`, `acknowledgeInboxAction({ inboxItemId, action })`, savings acknowledge actions with the same fields as before.

## Shared components reused

`TopAppBar`, `Page`, `Card`, `EmptyState`, `StatusAlert`, `StatusBadge`, `FilterChip`, `ReviewCard`, `FinancialValue`, `FinancialPrivacyToggle` (via `InboxPrivacyToggle`), `BottomActionBar`, `SelectField`, `AppIcon`, `IconContainer`, `Button`, `Input`, `Heading`, `Text`, `Skeleton`, `MutationOfflineBanner`.

## New local components

- `InboxQueueRow`
- `InboxFinancialAmount`
- presentation helpers in `inbox-presentations.ts` (not a new data layer)

## Presentation decisions

- Summary-first: headline uses the real open/archived count; no attention score.
- Open / Archived stay the existing tab contract with accessible selected state (weight + elevation + `aria-selected`, not color alone).
- Kind grouping is presentation-only, first-seen order, intra-group query order preserved.
- Filter chips wrap instead of clipping (scan-friendly; 44px).
- Filtered empty explains the filter and offers Clear filter.
- Detail: decision context → identity/source card → amount-is-context (when an amount exists) → facts → source/read meta → existing action panel.
- Archived rows remain non-navigating (existing interaction). History stays readable, not a second action queue.
- One primary sticky action in the existing decision panel; dismiss stays secondary.

## Privacy / accessibility

- Amounts wrap `FinancialValue`. Row `aria-label` is title + read/unread only (no money).
- Privacy toggle stays on summary and detail context.
- Tabs: `tablist` / `tab` / `tabpanel`, `aria-controls`, `aria-labelledby`, arrow keys.
- Controls targeted at `min-h-11` (44px): tabs, search, filter chips, clear, load more.
- Rows remain `min-h-14`.

## Refactor review

- No new domain literals at call sites; kinds/tabs/test ids go through inbox constants.
- Amount kind uses a `Record<InboxItemKind, FinancialNumberKind>` lookup.
- Grouping uses `Map` + first-seen order, not a new ranking algorithm.
- `useMemo` kept only for the existing search/kind filter.
- Decision panel was not rewritten beyond amount presentation.

## Deferred

- Authenticated 390/440/768/1280 + light/dark Inbox verification (login hydration gate).
- Mapper `Number(row.amount)` still coalesces a persisted null to `0` before the UI. Changing that is a read-model contract change — out of scope.
- Archived items still do not link to detail (existing architecture).
