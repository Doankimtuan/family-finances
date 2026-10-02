# Accounts Implementation Changes

## UI and navigation

- Replaced the dedicated Accounts directory's flat listing with a real owned-balance summary and grouped bank, cash/e-wallet, and credit-liability sections.
- Added dedicated Add Account and Add Credit routes using the existing account form and create action. The supported type, settings, identity, opening-balance, and scope contracts are unchanged.
- Added application-layer display totals for account groups. They sum existing eligible asset account balances; the existing total-owned-balance and card queries remain authoritative.
- Account detail back links and successful archive navigation return to the Accounts directory.
- Added localized English/Vietnamese copy for the grouped directory, create sections, and financial explanations.
- Preserved the existing general transaction capture shortcut, edit/archive, credit payment/refund/installment, and activity flows. No unsupported account-prefilled action or mock value was introduced.

## Files by role

- Routes and server loading: `app/[locale]/(product)/money/accounts/page.tsx`, `account-create-page.tsx`, `new/page.tsx`, `new-credit/page.tsx`.
- Directory and forms: `money-accounts-directory.tsx`, `money-accounts-scan.tsx`, `add-account-form.tsx`.
- Application display model and route constants: `modules/ledger/application/money-hub-view-model.ts`, `modules/shared-kernel/app-path.ts`.
- Localization: `messages/en/money.json`, `messages/vi/money.json`.
- Tests: account-form, money-hub view-model, and money-reality-hub tests.
- Route checklist and component checklist were updated for Accounts only.

## Safety and scope

- No Server Action, ledger command/schema, or Supabase schema changes.
- New route constants and two route files were added; detail links now return to Accounts.
- No changes to Savings, Investments, Loans, Personal Lending, Plan, Inbox, or Together behavior.
- No live account was created, edited, archived, paid, or otherwise mutated.
- Exact Stitch detail parity remains an open item; see `visual-qa.md`.
