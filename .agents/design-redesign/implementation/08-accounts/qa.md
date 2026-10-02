# Accounts QA

## Automated checks

| Check                       | Result | Notes                                                                                                                                                    |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`         | PASS   | Completed with exit code 0.                                                                                                                              |
| `npm run lint`              | PASS   | Completed with exit code 0.                                                                                                                              |
| `npm run test`              | PASS   | 241 files and 1,585 tests passed.                                                                                                                        |
| Accounts-focused unit tests | PASS   | 7 files, 92 tests passed: account forms, Money hub model and rendering, ledger account/transfer semantics, financial semantics, and currency formatting. |
| `npm run build`             | PASS   | Next.js production build completed and emitted both new account routes.                                                                                  |
| Prettier check              | PASS   | All changed Accounts source and test files passed.                                                                                                       |
| `git diff --check`          | PASS   | No whitespace errors.                                                                                                                                    |

The credentialed Playwright E2E suite was not run because `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are unavailable in this environment. The authenticated browser was used for read-only route and interaction QA instead.

## Browser QA

- EN Light: Accounts Overview, Add Account, Add Credit, Asset Detail, and Credit Detail at 360, 390, and 430 CSS pixels.
- VI Light, EN Dark, and VI Dark: all five screens at 390 CSS pixels.
- EN Light: Overview and both create pages at 440, 768, and 1280 CSS pixels.
- The existing Money overview account preview was rechecked at 390 CSS pixels after restoring its ownership, credit-limit, available-credit, and utilization details; it had no horizontal overflow.
- Every checked route rendered without horizontal overflow. At wider widths the centered 440px shell remained intact.
- Account type and billing-day selects opened and closed with Escape. Form fields received keyboard focus. Edit and archive surfaces were opened and canceled; no account mutation was submitted.
- At a simulated 390×550 viewport, the sticky form action remained visible while focusing amount fields. A native mobile keyboard was unavailable in desktop Chromium.
- Large VND values passed the currency-formatting unit test without losing digits.
- Clean reload after QA produced no new browser console errors. Earlier transient development compilation/HMR errors were resolved after the runtime import fix and clean reload.

## Accessibility and design status

- Shared field primitives supply labels and errors; route titles, account controls, group headings, and detail headings were present in the accessibility tree.
- The key account actions meet the 44px minimum target used by the shared UI. Dialog/sheet focus and cancellation were checked without submitting changes.
- Exact Stitch visual parity remains incomplete for the overview and both create screens because the references include account actions/provider data that are unsupported by current APIs, and for both detail screens because their compositions still differ materially. See `visual-qa.md`.
- Performance inspection found no serial data-request waterfall, unexpected client migration, or visible layout-shift regression in the checked routes.
