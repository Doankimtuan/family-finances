# Implementation Plan

1. Artifacts pack (this directory).
2. Ledger constants: `LoanType`, `LoanStatus`, `RepaymentFrequency` + `*_VALUES`.
3. Types: replace `InstallmentPlan` with `Loan` / `LoanPayment`; mappers.
4. SQL migration + `record_loan_payment`.
5. Commands/queries; remove convert + linkedInstallments.
6. App path + `money/loans` UI + i18n + LoanCard pattern.
7. Plan calendar, inbox/health copy touch-ups.
8. Tests + e2e testids.
9. Final verdict.
