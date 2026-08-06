# Design System Adjustments

## Code Adjustments Applied

### Phase E0.1 Visual Gate Adjustments

1. Extended `KpiBlock`, `Section`, `Balance`, and `TransactionRow`.
   - Reason: the existing primitives were structurally useful but too visually neutral for the acceptance gate.
   - Design-system effect: shared primitives now support prominent summary zones, bounded surfaces, amount class control, and denser transaction-row scanning.

2. Recalibrated Home, Money, transaction list, and Create Transaction visual hierarchy.
   - Reason: Phase E0 did not create a clearly observable difference.
   - Design-system effect: validates a stronger but still restrained Phase D interpretation for mobile fintech screens.

3. Fixed `money-hub.smoke.spec.ts` locator scope.
   - Reason: broad text matching became invalid once multiple legitimate phrases referenced real position and jar plans.
   - Design-system effect: future visual copy changes are less likely to break core route smoke evidence.

1. Added `Page` to `shared/patterns`.
   - Reason: Home, Money, transactions list, and capture repeated the same screen content rhythm.
   - Design-system effect: Phase D Page primitive is now real and reusable.

2. Added `Section` to `shared/patterns`.
   - Reason: Money hub needed grouped content without creating more cards.
   - Design-system effect: supports the "sections over nested cards" principle.

3. Added `BottomActionBar` to `shared/patterns`.
   - Reason: capture flow needed safe-area sticky primary action.
   - Design-system effect: resolves one Phase D mobile action capability for daily capture.

4. Added `TRANSACTION_AMOUNT_PREFIX` to ledger constants.
   - Reason: transaction rows repeated amount sign literals.
   - Design-system effect: amount sign meaning now comes from ledger application constants.

5. Added capture preview copy in English and Vietnamese.
   - Reason: daily capture needed a lightweight money movement preview before saving.
   - Design-system effect: validates the need for a future `MoneyMovementPreview`.

6. Excluded `history/` from Tailwind source scanning.
   - Reason: archived docs generated invalid `rounded-[var(--radius-*)]` CSS and blocked browser rendering.
   - Design-system effect: browser verification can run against active app code.

7. Added `MoneyMoreLink` client component.
   - Reason: Phosphor icons must not be imported directly into server pages.
   - Design-system effect: keeps icon usage aligned with client/server boundaries.

## Phase D Documentation Updates

No Phase D documentation was changed. Browser evidence did not prove a token or contract adjustment was necessary.

## Remaining Adjustments

- Rerun Phase E0.1 with credentialed browser evidence before promoting the new primitive variants as fully accepted.
- Promote `MoneyMovementPreview` only after authenticated confirmation and receipt states are verified.
- Decide whether `TransactionsFilterBar` becomes shared after another list needs the same search/segmented pattern.
- Add shaped loading skeleton guidance during a screen with observable loading state.
