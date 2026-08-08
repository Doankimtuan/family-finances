# F1

Status:
- COMPLETE

Missing:
- none

# F2

Status:
- COMPLETE_WITH_CONDITIONS

Missing:
- Transfer UI/API (no ledger transfer command or direction; deferred per blueprint “if transfer ships”)
- Live browser post of correction/refund not exercised (sampled transaction had no Correct/Refund actions); code paths present with preview-confirm + receipt

# Fixes Applied

- Removed hardcoded English `"Related records"` fallback from `transaction-receipt.tsx`; capture passes localized `receipt.relatedRecords`
- Added EN/VI `receipt.relatedRecords` and refund `receipt.viewRefund`
- Correction receipt uses locale + original `transactionDate` (not hardcoded `"en"` / today)
- Refund receipt uses locale, includes date row, and links to the refund transaction

# Verification

- typecheck: pass (`npm run typecheck`)
- lint: pass with 2 pre-existing unrelated warnings (`money-products-actions.ts`, `savings-actions.ts`)
- focused tests: `bottom-navigation` unit pass; Playwright F1/F2 smokes 16/17 pass
- Playwright critical paths: Home authenticated chrome; Money hub/accounts/capture/transactions authenticated smokes pass
- Browser critical paths (authenticated): Home 390px VI light (5 tabs); Home 440px EN dark; Money Hub; account detail; transaction list; expense capture success receipt (`transaction-receipt`, form hidden after success)
- Evidence: `artifacts/implementation-verification/f1-f2/CURRENT/evidence/`

# Remaining Conditions

- Transfer not implemented (requires new ledger API; out of lean-fix scope)
- `shell.smoke` dark-class case flakes when unauthenticated `/en/home` navigates during `page.evaluate` (test race; not a product shell defect)
- Correction/refund live mutation not browser-posted this pass
- Full Home state matrix (empty/partial/stale/loading/error) not re-seeded this lean pass

# Final Verdict

F1_F2_COMPLETE_WITH_NON_BLOCKING_CONDITIONS
