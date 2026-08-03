# Remaining roadmap (post Accounts MVP)

| Item | Notes | Gate |
|------|-------|------|
| Account transfers | Tech spec lists transfer; no Product AC | Product + ledger command + capture UX |
| Credit card accounts + billing | Full analysis in `credit-card-analysis.md` | Product SoT change (override D-01) |
| Convert txn → installment | Tech spec `ConvertToInstallment` | Product + cards surface |
| Restore archived accounts | Legacy had no restore | Product + list archived UX |
| Brokerage in create UI | Schema allows; Scope lists trading OOS | Product Wealth / F-Wealth |
| Stale-activity health | MVP uses balance-only chips | Cheap last-tx enrichment |
| Preselect account on capture | Detail quick action links Money Add | Capture query param support |
| WithdrawSavings / richer savings | Tech spec beyond maturity enqueue | Separate story |
| Hard delete accounts | Prefer soft archive | Avoid unless compliance requires |

## Explicit non-goals until Product says otherwise

- Min payment product field / TDSR proxy as UX
- Auto-pay automation
- Interest accrual engine for cards
- Per-member personal wallets
