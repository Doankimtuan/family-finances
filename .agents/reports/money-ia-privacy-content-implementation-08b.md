# ViNha Money Track — 08B: Money IA, Privacy & Content Foundation

Implementation date: 2026-08-19

## Summary

Money now presents one concise active-money overview, followed by Accounts as
the primary content and flat Money destinations. Composition remains available
as a quiet supporting section below the overview rather than competing inside
the emphasized hero.

The shared financial privacy primitives now cover Money account rows, credit
cards, composition, normal account detail, credit-card detail, activity rows,
card statements, installments, confirmations, and account receipts. No
Money-specific privacy state or storage key was added.

## Money IA

Before:

1. Dashboard-like Money hero with active money, credit debt, composition, and
   transaction navigation mixed together.
2. Accounts scan.
3. Related-finance card block.

After:

1. Money overview — one emphasized active-money summary with account count,
   separate card-debt signal, and transaction navigation.
2. Composition — quiet open supporting summary below the overview.
3. Accounts — primary inventory section with domain-backed grouping, inline
   expansion, and separate credit-card liability objects.
4. Money destinations — mostly flat links for Debts, Savings, Investments, and
   Loans & installments.

The composition was retained because it adds a useful “where” summary beyond
the account names, but it was demoted because the emphasized hero should answer
how much active money is represented, not behave like a second Home dashboard.

## Accounts route ownership

`/money` remains the canonical Money and active-account scan surface.
`/money/accounts` remains redirect-only and resolves back to `/money`.
No second Accounts index route was introduced.

## Account expansion

The existing view model still provides the complete active account dataset and
limits the initial hub scan to four accounts. When more active accounts exist,
`See all accounts` expands the rows in place and changes to `Show fewer
accounts`; `Thu gọn` is the Vietnamese equivalent. No navigation or duplicate
account list is involved.

The focused unit test verifies expand/collapse. The authenticated browser
fixture had two active liquid accounts, so it did not expose the expanded state
for a populated browser interaction.

## Privacy

The existing global `FinancialPrivacyProvider` and `FinancialValue` remain the
only privacy mechanism. Monetary leaves migrated in this batch include:

- Money active-money total, composition balances, and card-debt summary;
- normal account balances in AccountCard and normal account detail;
- credit-card outstanding, available credit, credit limit, due/current-cycle,
  statement, installment, activity, confirmation, and receipt values;
- account opening-balance and credit-limit receipt values;
- transaction/activity row amounts in the shared TransactionRow pattern.

Names, types, ownership, counts, dates, percentages/utilization, and status
labels remain visible. Financial values use `FinancialValue`, `Balance`, or
`Amount`; raw formatted values are not placed in parent accessible labels.
Masked values use the existing aria-hidden semantics and do not remain in the
masked DOM/accessibility snapshot.

Browser verification with the authenticated fixture confirmed that Home’s
shared privacy control masked Money Hub values and both normal-account and
credit-card detail values. Known raw VND values were absent from body text and
DOM snapshots while hidden.

## Content

Updated English and Vietnamese Money/Account content for:

- consumer-facing active-money and account-management language instead of
  Real Position/Real Ledger implementation terms;
- `Balance` / `Số dư` for manually managed normal accounts;
- generic account-list subtitles covering all supported account objects;
- credit-card distinction using outstanding debt, available credit, and credit
  limit without calling debt a bank balance;
- offline account creation copy that says internet is required instead of
  implying provider connection;
- consistent `Loans & installments` / `Vay và trả góp` wording;
- concise opening-balance guidance and archive consequences.

English/Vietnamese message structure and ICU parity remain validated by the
existing i18n tests.

## Credit-card semantics

Credit cards remain outside active liquid-money totals and continue to show
outstanding debt, available credit, credit limit, utilization, due information,
current-cycle values, and card-specific actions. Their values use `Amount`, not
the normal account `Balance` presentation. Archive behavior remains soft
archive: active surfaces and active position exclude the account while
historical transactions are preserved.

## States

Recent activity now distinguishes a failed read (`StatusAlert` plus retry) from
a successful empty result (`EmptyState`). The existing Money load failure,
offline read-only behavior, account-first empty state, and archive semantics
remain intact.

## Accessibility

- Shared Button/SectionHeader hit-target rules remain at 44px; the Money Add
  account action no longer overrides them with `min-h-9`.
- Retry actions use the shared 44px-sized link treatment.
- Account and card parent links do not concatenate raw financial values into
  accessible names.
- Masked monetary values are absent from body text and accessibility snapshots
  in privacy mode.
- Account identity, type, ownership, percentages, dates, and status remain
  available when amounts are hidden.

## Currency

The account-create receipt now formats opening balance and credit limit using
the household currency passed from Money’s authoritative read model
(`position.currency`, with the existing card-list fallback only when the
position read is unavailable). It no longer unconditionally uses
`DEFAULT_CURRENCY`.

## Browser evidence

Authenticated in-app browser verification was available for the local fixture:

- English Money Hub at 390px, 440px, 768px, and 1280px: hub, composition,
  Accounts, and bottom navigation present; no horizontal overflow.
- Vietnamese Money Hub at 390px: updated active-money copy present; no
  horizontal overflow.
- `/en/money/accounts` redirected to `/en/money`.
- Shared Home privacy toggle → Money Hub: 9 masked financial leaves observed;
  known raw total/card values were absent from body text and the DOM snapshot.
- Normal account detail and credit-card detail: masked values were present and
  known raw balances/outstanding/available/limit values were absent.

The fixture did not provide a populated account set large enough to exercise
browser expansion, did not expose an offline network toggle through the test
surface, and did not provide a confirmed dark-theme browser verification path.
Those checks are not claimed here. Focused unit coverage verifies expansion and
privacy behavior.

## Deferred

- Account object visual redesign (08C).
- Account create/edit form refactor.
- Account detail visual polish beyond privacy/terminology/state corrections.
- Archive lifecycle expansion, including restore or archived-account browser.
- Money motion cleanup.
- Transactions feature work.
- Savings, Debt, and Investments feature work.

## Validation

- Focused tests: passed — 3 files, 14 tests (`money-ia-privacy`, financial
  privacy, and Money view model).
- Full unit suite: passed — 124 files, 924 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; 94 routes generated.
- Money E2E smoke: passed — 2 unauthenticated tests; 1 credential-gated test
  skipped.
- Shared E2E smoke: passed — 5 tests; 2 credential-gated tests skipped.
- Changed-file Prettier check: passed after formatting.
