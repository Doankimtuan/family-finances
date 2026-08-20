# Credit-card detail polish — 08F.4

## Summary

Polished only the credit-card account detail screen and its route-local UI:

- neutralized the ordinary-debt hero surface;
- made current outstanding the dominant amount;
- clarified billing-cycle terminology;
- promoted due date and next installment payment/date;
- kept one primary `Pay card` / `Thanh toán thẻ` action;
- kept installments bounded and activity flat;
- preserved all payment, installment, privacy, routing, and financial logic.

## Financial field mapping

| Source                                                                      | User-facing concept                                        | Screen use                                                                                          |
| --------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `buildCreditCardSummary().outstanding` from `computeOutstanding(months)`    | Current outstanding / `Dư nợ hiện tại`                     | Hero dominant amount and payment eligibility                                                        |
| `credit_card_settings.credit_limit` → `card.creditLimit`                    | Credit limit / `Hạn mức`                                   | Hero supporting value                                                                               |
| `computeAvailableCredit(creditLimit, outstanding)` → `card.availableCredit` | Available credit / `Hạn mức còn lại`                       | Hero supporting value                                                                               |
| `utilizationPercent(creditLimit, outstanding)` → `card.utilizationPct`      | Utilization                                                | Hero percentage and progress bar                                                                    |
| First non-settled `leadMonth.statementAmount`                               | Statement balance / `Số tiền sao kê`                       | Billing support surface                                                                             |
| First non-settled `leadMonth.paidAmount`                                    | Paid / `Đã thanh toán`                                     | Billing support surface                                                                             |
| `mapBillingMonthRow().remaining`                                            | Remaining statement payment / `Còn phải thanh toán kỳ này` | Billing dominant supporting amount and payment flow input                                           |
| First non-settled `leadMonth.dueDate` / `card.nextDueDate`                  | Due date / `Đến hạn`                                       | Billing surface and hero metadata                                                                   |
| First open billing month sorted by billing month                            | Current billing cycle / `Kỳ sao kê này`                    | Billing section heading and period                                                                  |
| `card.items` filtered to `CardBillingItemType.STANDARD`                     | Card activity / `Hoạt động thẻ`                            | Flat activity rows                                                                                  |
| `listCreditCardInstallments()` + `buildCreditCardInstallmentViewModel`      | Active card-origin installments                            | Bounded installment objects with fraction, next payment/date, extra cost, and local tracking action |

## Hero

`CreditCardHero` now uses a neutral token surface and border instead of a debt-tinted border. The debt icon remains a restrained liability cue, while the financial values and utilization indicator stay neutral/action-toned. The card identity includes the account name and localized card type; current outstanding remains the only large amount.

## Billing/payment section

`CreditCardDueLead` is a softer bounded support surface with a visible divider. It uses `Kỳ sao kê này` / `This billing cycle`, a separate due-date row, a subordinate remaining-payment amount, payment progress, paid amount, and statement amount. The remaining payment is no longer rendered at the same scale as the hero.

## Due semantics

The UI displays the authoritative `leadMonth.dueDate`. No warning or danger state was inferred: the current application data model exposes open, partial, and settled billing states but does not provide an authoritative overdue/due-soon presentation state for this screen.

## Pay Card

The existing single primary button remains immediately after the billing obligation. Its label and sheet behavior are unchanged. No automatic bank-payment implication or payment command behavior was added.

## Installments

Installment objects remain bounded objects. The next payment amount and date now have their own compact row with stronger hierarchy; progress remains a simple bar plus `current/total` fraction; extra cost is demoted; the local-only action is explicitly labeled `Ngừng theo dõi tại ViNha` in Vietnamese and remains `Stop local tracking` in English.

## Activity

Card activity remains a flat `TransactionRow` list. Inter-row gaps were removed so the existing separators carry the grouping, with no new transaction-card wrappers or global Transactions changes.

## Privacy/accessibility

All monetary leaves still flow through `FinancialValue`. Utilization remains visible as a percentage alongside the progress bar. Labels distinguish outstanding, statement, remaining, paid, available credit, and limit. Existing 44px controls, focus behavior, sheet semantics, and accessible payment naming were preserved.

## Responsive/theme

The implementation keeps the constrained 440px app shell, token colors, shared spacing, dark-mode surfaces, and mobile-first one-column layout. No new font, image, gradient, motion library, or global component was introduced.

## Browser evidence

- The local app opened successfully in terminal Chromium and redirected unauthenticated account-detail navigation to `/en/login`.
- The in-app Browser could not reach the workspace local port in this session (`ERR_CONNECTION_REFUSED`).
- `npm run test:e2e -- tests/e2e/account-detail-redesign.smoke.spec.ts` ran all four requested viewport scenarios but skipped them because `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` were not configured.
- The requested authenticated screenshots were not generated: no credit-card fixture was available, so no screenshot was fabricated or mislabeled.

## Validation

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test` — passed, 128 files / 944 tests
- `npm run build` — passed
- Focused credit-card/privacy tests — passed, 29 tests
- Credit-card detail E2E — 4 skipped because credentials/fixture were unavailable

## Final verdict

`CREDIT CARD DETAIL POLISH COMPLETE WITH FIXTURE GAPS`
