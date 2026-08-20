# ViNha Money Track — 08C: Account Object + List Visual System

Implementation date: 2026-08-19

## Summary

Accounts now read as bounded financial objects instead of flat transaction-like
rows. The Money IA remains unchanged: overview, quiet composition, Accounts,
then flat Money destinations.

The implementation:

- removed the collection-level card around liquid accounts;
- made each normal account a soft bounded object using existing radius, border,
  tonal surface, and interaction tokens;
- kept whole-object account links with visible focus treatment;
- moved ownership into quiet object metadata instead of a repeated pill badge;
- kept domain-backed groups and inline expand/collapse behavior;
- gave credit-card objects a distinct type label and clearer outstanding-first
  hierarchy;
- preserved the shared `Balance`, `Amount`, and `FinancialValue` privacy
  primitives;
- changed no create/edit form, Account Detail redesign, or Motion behavior.

## Account object model

Normal Account hierarchy:

1. Existing account-family icon through `AppIcon` and `money-account-visuals`.
2. Account name as the strongest identity text.
3. Localized account type/family label.
4. `Balance` with the localized `Balance` / `Số dư` caption as the strongest
   numeric value inside the object.
5. Quiet ownership metadata; meaningful personal/shared semantics remain.
6. Whole object as the account-detail destination.

Long names wrap within the leading identity column. The balance occupies its
own trailing grid column and uses tabular, privacy-aware financial rendering.

## Surface treatment

The account collection is now open. Each Account object is a Level 1 soft
bounded surface: subtle token border, `--radius-card`, tonal `bg-surface`, no
feature-specific shadow, and existing shared hover/press feedback.

This keeps the distinction from:

- flat transaction/activity rows, which remain event-like;
- the emphasized Money summary, which remains the single primary financial
  truth surface;
- open composition analytics;
- mostly flat Money destination links.

No outer card wraps the individual account objects, avoiding an outer-card /
inner-card stack.

## Grouping

The existing domain-backed grouping and sorting remain unchanged. Empty groups
are omitted. When multiple groups exist, compact lighter labels sit above the
objects; a single group remains undifferentiated for faster scanning. Credit
cards remain in their own collection because their values describe liability
and available credit rather than liquid account balance.

The four-account initial preview and inline `See all accounts` /
`Show fewer accounts` behavior are unchanged. The focused component tests cover
group headings and inline expansion/collapse.

## Balance/privacy

Normal Account balances render through `Balance`; credit-card monetary values
render through `Amount`; all financial leaves remain covered by the global
`FinancialPrivacyProvider` / `FinancialValue` mechanism.

The authenticated browser fixture with privacy hidden showed nine masked
financial leaves on Money. Known raw account, composition, and credit-card
values were absent from body text and accessibility snapshots. Names, types,
ownership, counts, percentages, dates, and status labels remained visible.

## Credit cards

Credit cards keep their own soft bounded object treatment. The hierarchy is:

1. Card icon, name, and localized `Credit card` type.
2. Utilization percentage and restrained progress indicator.
3. Outstanding debt as the dominant `Amount` with debit semantics.
4. Available credit and credit limit as subordinate supporting values.
5. Due date and authoritative attention state.

No new due amount or status was invented. Debt remains restrained through the
existing semantic icon/tone and attention badge only when the domain reports an
attention state.

## Light/dark

Light screenshots show account objects separated from the page canvas and the
composition region without introducing a grey stacked dashboard. Dark
screenshots preserve quiet borders, object separation, readable balances, and
restrained debt semantics. No separate dark design or arbitrary color was
added.

## Responsive

Authenticated browser checks used the local fixture at 390px, 440px, 768px,
and 1280px. All widths reported no horizontal overflow. The product `main`
width was 390px at 390, 440px at 440, and remained 440px at 768 and 1280,
preserving the constrained shell. The fixture rendered two normal accounts and
one credit card at every width.

Synthetic extreme values were covered in the focused component test for long
identity and large balance content. The authenticated fixture did not contain
long production account names or a five-account expanded dataset, so no
populated expanded browser screenshot is claimed.

## Accessibility

- Whole Account and credit-card objects remain links with visible focus rings
  and effective 44px-plus object targets.
- Account link names expose identity, type, balance caption, and ownership;
  masked financial leaves do not expose raw amounts in hidden mode.
- Account-family icons remain decorative because the text labels carry their
  meaning.
- Ownership is available as text metadata, not color alone.
- Credit-card labels distinguish outstanding debt, available credit, and limit;
  utilization/date/status remain readable independently of color.
- The inline expansion control retains `aria-expanded` and the shared 44px
  target.

## Screenshots

Captured and visually inspected:

- `output/playwright/money-accounts-visual-08c/vi-money-390-light.png`
- `output/playwright/money-accounts-visual-08c/en-money-390-light.png`
- `output/playwright/money-accounts-visual-08c/vi-money-440-dark.png`
- `output/playwright/money-accounts-visual-08c/en-money-440-dark.png`
- `output/playwright/money-accounts-visual-08c/en-money-privacy-hidden.png`

The fixture had only two liquid accounts, so an expanded populated account-list
screenshot was not available. Inline expansion is covered by unit tests with a
five-account fixture.

## Deferred

- Account create/edit form refactor.
- Account Detail visual polish.
- Archive lifecycle expansion and restore/history browsing.
- Money Motion cleanup.
- Transactions feature work.
- Savings feature work.
- Debt feature work.
- Investments feature work.

## Validation

- Account-object focused/privacy/grouping tests: passed — 4 files, 26 tests
  (`money-ia-privacy`, `money-hub-view-model`, `shared-visual-foundation`,
  and `financial-privacy`).
- Full unit suite: passed — 124 files, 927 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; 94 routes generated.
- Shared browser smoke: passed — 5 tests; 2 credential-gated tests skipped.
- Money Hub E2E smoke: passed — 2 unauthenticated tests; 1 credential-gated
  test skipped.
- Authenticated Playwright browser matrix: passed at EN/VI, 390/440/768/1280;
  no horizontal overflow; no console errors.
- Screenshot inspection: passed for all five captured evidence paths above.
- Targeted Prettier check: passed for all changed code, tests, and this report.
  Repository-wide `npm run format:check` still reports the existing baseline
  of 2,209 unrelated files with formatting differences.
