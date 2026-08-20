# ViNha Transactions Track — 09E Transaction Detail, Correction & Reversal

Date: 2026-08-20

## Summary

Implemented the generic transaction detail and ordinary correction flow without changing the Transactions list, create flow, transfer flow, refund form, Home, or product detail screens.

## Detail IA

Detail now presents a compact semantic header, signed/neutral event amount, meaning and context, product context, relationship history, capability-gated actions, and back navigation. Transfers continue to render as one user-level event.

## Semantic event model

The route consumes `getTransactionActivity` for direction, sign, owner, product event, and generic action capabilities. A typed transaction read result distinguishes unavailable reads from not-found records. Card payment ownership is enriched from the authoritative `card_payments` relation.

## Direction/classification

Income and expense signs come from the projector. Transfers remain unsigned. Refunds use refund semantics. Card purchases, card payments, savings, investment, debt, loan, and liability events use owner/product semantics rather than a generic non-expense rule.

## Money effect

The summary uses the shared amount formatter and `FinancialValue`. Context rows show the affected account and localized effective date without raw ISO dates or hidden raw amounts.

## Meaning/context

Notes, categories, jars, tags, status, and product context are shown only where useful. A note is used once as the event context title rather than repeated as a separate body row.

## Refund relationships

Original expenses show partial/full refund states and linked refund entries. Refund events link back to the original event. Refund actions remain capability- and status-gated; refund amounts use `FinancialValue`.

## Correction relationships

Correction history is presented as “Change history” with original and corrected event links. Raw reversal rows, ledger IDs, and storage terminology are not exposed. The original fact remains visibly preserved in the relationship story.

## Correction form

The manual correction form was migrated to RHF/Zod and shared controlled fields. It now supports the existing ordinary correction contract: type, amount, account, effective date, category, jar, and note. It shows original context, before/after preview, append-only consequence copy, and a user-level receipt.

## Action capabilities

Generic correction and refund actions consume canonical capability state plus the existing correctable/refundable status policies. Transfers, refunds, card/product events, and already corrected/reversed events do not expose generic correction. Unsupported direct correction routes show a truthful blocked state.

## Product-owned events

Product ownership is surfaced as quiet context for card, savings, investment, debt, and loan events. No fabricated owner navigation or generic product editing was added.

## Status semantics

Statuses use consumer-facing wording such as Recorded, Needs category, Partially refunded, Fully refunded, and Reversed. Relationship surfaces distinguish refund history from change history.

## Privacy/accessibility

Read-only financial values, before/after values, relationship history, and receipts render through `FinancialValue`. Controls use shared labeled fields and 44px targets. No raw ledger IDs are rendered as user-facing text.

## Error/loading states

Detail, correction, and refund routes distinguish not-found from read failure. Unsupported correction routes use warning status copy and return to the actual transaction. Existing shared loading/route transitions remain unchanged; no bespoke motion was added.

## Responsive/theme

The centered 440px shell, shared semantic tokens, light/dark themes, and reduced-motion behavior remain intact. No marketing layout, Bento grid, or new animation dependency was introduced.

## Browser evidence

Chromium opened `/en/money/transactions/example`; the protected detail route correctly redirected to `/en/login`. Public smoke screenshots were captured at 390, 440, 768, and 1280px under `output/playwright/transactions-detail-09e/`.

Authenticated populated detail, correction, refund, product-event, privacy, and dark-mode screens were not claimed because this checkout has no usable authenticated browser fixture/database session.

## Validation

Passed:

- `npm run lint`
- `npm run typecheck`
- `npm run test -- --run` — 130 files, 971 tests
- `npm run build`
- focused `correct-transaction-form` tests — 2 tests
- `git diff --check`

Targeted Prettier checks passed for the 09E source, test, and report files. The
repo-wide `npm run format:check` remains red on 2,212 pre-existing files,
including archived/history artifacts and unrelated modules; those files were
not reformatted as part of 09E.

The suite retains existing HeroUI PressResponder and fail-closed Supabase mock warning output; no tests failed.

## Final verdict

**TRANSACTIONS DETAIL/CORRECTION READY WITH FIXTURE GAPS**
