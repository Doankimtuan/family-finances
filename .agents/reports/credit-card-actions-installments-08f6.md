# ViNha Money Track — 08F.6

## Scope

Polished only the credit-card Pay Card sheet, local installment conversion sheet, active-installment tracking action, and their shared sheet composition. Money Hub, normal account flows, billing calculations, ledger commands, and schema were left unchanged.

## Semantics audited

- `stopCreditCardInstallmentTracking` validates the installment ID, checks household authorization, and updates only `credit_card_installments.status` to `stopped`. It does not call a bank, cancel a bank agreement, alter card debt, or create a payment. Stopped records remain stored but are filtered from the visible progress/schedule list.
- `settleCard` validates the payment, then calls the atomic `settle_card_payment` RPC. It records one source-account balance change and one linked card-liability payment; it is not income or spending. The Pay Card form now pre-fills the open statement's remaining amount (`leadMonth.remaining`), with current outstanding as the fallback when no open statement exists.

## Changes

- Renamed and demoted the local action to “Stop tracking installment” / “Ngừng theo dõi trả góp”. It now requires confirmation and explicitly says what ViNha will stop showing and what remains unchanged.
- Removed the duplicate Pay Card body heading; the sheet header owns the title.
- Replaced the technical settlement helper with consumer-facing source/balance language and clarified the amount default below the field.
- Moved Pay Card and Convert-to-installment forms to `ActionSheetLayout`, including safe-area-aware sticky footers. Action forms remount on close/open so abandoned input is discarded.
- Reduced the selected purchase from a card-like financial object to a compact context row.

## Verification

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — 128 files / 944 tests passed.
- `npx playwright test tests/e2e/credit-card-installments.smoke.spec.ts --workers=1` — 5 skipped because E2E credentials are not configured.
- Targeted Prettier check and `git diff --check` — passed.
- Authenticated browser evidence was unavailable in this environment; the current unauthenticated browser can reach `/en/money` but cannot inspect a card fixture. No browser result is claimed beyond the credential-gated suite status above.
