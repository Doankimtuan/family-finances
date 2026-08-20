# ViNha Money Track — 08F: Motion, Accessibility & Final Regression

Audit date: 2026-08-19

## Summary

Money + Accounts received the final motion and regression pass without changing
the approved Money IA, account object semantics, financial commands, or route
ownership.

The final code change is intentionally small:

- Money keeps one restrained overview-group reveal; Accounts and destinations
  render statically.
- Normal and credit-card Account Detail no longer add feature-level reveal
  cascades. The shared shell transition, HeroUI sheet/dialog transitions, and
  button press feedback remain the owners of those interactions.
- Long normal-account and credit-card names, balances, available credit, and
  credit limits can wrap instead of being truncated in detail objects.
- Focused tests protect reduced-motion variants, motion ownership, privacy,
  expansion semantics, form reset behavior, and opening-balance persistence.

The requested `account-create-edit-opening-balance-implementation-08d.md`
report is not present in this checkout. The implemented 08D behavior remains
covered by the create/edit component tests and ledger tests; this absence is a
documented report/fixture gap, not a reason to invent a replacement report.

## Motion

Before:

- Money Hub had three independent `MotionReveal` regions for the overview,
  Accounts, and destinations. Each could own an independent in-view observer.
- Normal Account Detail had separate reveals for the account object, quick
  actions, and recent activity.
- Credit-card Detail had separate reveals for the card object and action
  region.
- Account objects, balances, debt values, activity amounts, opening balances,
  and archive confirmation had no count-up or rolling-digit implementation.

After:

- Money has one `MotionReveal` around the overview group only. Accounts,
  inline account expansion, credit-card objects, and Money destinations are
  static and are not staggered.
- Account Detail is static at feature level. Route/shell transition remains
  shared; HeroUI owns sheets/dialogs; shared buttons own press feedback.
- Create/edit sheets and archive confirmation retain existing shared overlay
  behavior. No field animation, archive shake, bounce, flash, or card-removal
  animation was added.
- Financial values update immediately. There is no count-up, rolling digit,
  blur reveal, spring interpolation, or animated financial-value wrapper.

## Reduced motion

The existing shared motion policy remains the single policy:

- `prefers-reduced-motion: reduce` disables non-essential motion.
- Reveal variants have zero transform distance, and the mounted policy renders
  Money/Account content immediately.
- No account-list reveal, stagger, financial-value animation, or non-essential
  progress transition is introduced by this pass.
- Shared HeroUI sheet/dialog fallback remains responsible for accessible
  overlay behavior; no feature motion is stacked on top.
- Low-end devices continue to skip non-essential motion through
  `useMotionPolicy`.

## Accessibility

Hub and objects:

- Money retains semantic overview, composition, Accounts, credit-card, and
  destination structure.
- Account and credit-card identity/type text remains readable when privacy is
  enabled. Parent links do not concatenate raw monetary strings into names.
- Account groups have meaningful localized headings when multiple groups are
  present.
- Inline expansion exposes `aria-expanded`, remains keyboard reachable, and
  updates immediately without list animation.
- Add Account, retry, section actions, object links, management, and bottom
  navigation use the existing 44px target/focus contracts.
- Credit cards keep distinct outstanding debt, available credit, credit limit,
  utilization, due date, and attention semantics. Meaning is not color-only.

Forms and detail:

- Create/edit continue using shared labeled fields, RHF/Zod validation, linked
  descriptions/errors, keyboard-capable account type selection, and reachable
  actions.
- Create forms reset on close. Edit cancel/reopen restores persisted identity
  and type values. Opening balance remains create-only.
- Detail DOM order remains back → management → contextual primary action →
  activity/destinations → product bottom navigation, with no positive
  `tabIndex` or CSS order dependency.
- HeroUI sheet/dialog focus handling remains in place for open, trap, Escape,
  close, and return-to-trigger behavior.
- Archive remains a serious archive confirmation with no Delete terminology or
  celebratory motion.

## Privacy

The existing global `FinancialPrivacyProvider` and `FinancialValue` remain the
only privacy mechanism. The 08B/08C coverage is preserved across:

- Money total, composition balances, and card-debt summary;
- normal Account and Account Detail balances;
- credit-card outstanding, available credit, credit limit, due/current-cycle,
  statement, installment, activity, confirmation, and receipt values;
- transaction/activity rows and account creation receipts.

When hidden, raw monetary values are absent from visible text and masked value
leaves are `aria-hidden`; names, types, ownership, counts, percentages, dates,
and statuses remain available. Focused privacy tests also assert that known raw
values do not enter the accessible label path.

The authenticated browser privacy regression from 08B/08C remains the prior
evidence for Home toggle → Money → normal detail → credit-card detail. This
08F environment had no authenticated credentials, so no new authenticated
privacy screenshot is claimed.

## Financial integrity

Opening balance:

- `createAccount` persists `opening_balance` on the account row.
- It does not insert an ordinary transaction.
- `getRealPosition` includes active liquid opening balances in the aggregate;
  credit cards remain outside liquid real position.
- Existing ledger tests cover the opening-balance mapping, aggregate inclusion,
  and no-transaction insertion path. No UI/motion change touches these rules.
- No Income, Expense, or period cash-flow command is created by opening-balance
  creation.

Edit:

- Update remains limited to identity/type configuration.
- Opening balance is not exposed as an edit field.
- Existing form tests verify canceled edits are discarded before reopen.

Archive:

- Archive remains a soft archive, not Delete.
- Active lists and active aggregates exclude the archived account.
- Historical transactions remain preserved by the existing command contract.
- Successful archive returns to canonical `/money`; no restore UI was added.

No user-facing Balance Adjustment command exists, so none was implemented.

## States

- Money whole-read failure continues to use the shared danger status plus
  retry affordance.
- Account/card unavailability remains distinct from a successful empty state.
- Recent activity failure renders status/error plus retry; only a successful
  empty read renders `EmptyState`.
- Offline mutation blocking remains explicit through the shared offline banner
  and disabled mutation actions.
- Existing Money and Account skeleton geometry remains unchanged and no
  financial placeholder animation was added by this pass.

## Responsive

The previously captured authenticated 08C matrix remains valid for the shared
Money layout: 390px and 440px use the full constrained shell; 768px and 1280px
keep the centered 440px single-column shell. No Bento grid, desktop columns,
or alternate navigation was introduced.

The focused component stress fixture covers long account identity and large
VND balance content. This pass also removes detail truncation for long normal
account/card names and supporting monetary values.

New authenticated 08F browser checks at 390/440/768/1280 could not run because
`E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are not configured.

## Locale/theme

The existing 08B/08C implementation and captured evidence preserve English and
Vietnamese Money terminology, localized account types, credit-card debt copy,
opening-balance helper text, archive consequences, and destination labels.

The semantic-token theme system remains unchanged. Existing 08C light/dark
Money screenshots show bounded account objects distinct from the canvas,
restrained credit-card liability treatment, readable masked values, and visible
borders/focus hierarchy. No theme-specific layout or color-only meaning was
added in 08F.

## Performance

Concrete change:

- Money reduced independent reveal regions from three to one.
- Account Detail removed five feature-level reveal owners across normal/card
  branches. This removes redundant in-view observers and avoids replaying
  financial-object/activity cascades.
- No speculative memoization, client cache, repeated observer abstraction,
  query rewrite, or broad RSC refactor was introduced.
- Existing parallel Money/account reads and pure view-model transformation
  remain unchanged.

## Browser evidence

Captured in this 08F environment:

- [unauthenticated-money-redirect.png](/Users/doantuan/Desktop/Plan/family-finances/output/playwright/money-final-08f/unauthenticated-money-redirect.png)
  — local browser `/en/money` redirect to `/en/login`.

Existing prior Money evidence retained in the worktree:

- `output/playwright/money-accounts-visual-08c/vi-money-390-light.png`
- `output/playwright/money-accounts-visual-08c/en-money-390-light.png`
- `output/playwright/money-accounts-visual-08c/vi-money-440-dark.png`
- `output/playwright/money-accounts-visual-08c/en-money-440-dark.png`
- `output/playwright/money-accounts-visual-08c/en-money-privacy-hidden.png`

Browser flows run in this pass:

- Local unauthenticated Money redirect: passed.
- Money Hub + Account Detail E2E selection: 2 unauthenticated tests passed;
  5 authenticated tests skipped without credentials.
- Shared browser smoke: 5 passed; 2 credential-gated tests skipped.

The requested 08F authenticated screenshot names were not created because the
fixture was unavailable: no authenticated Money Hub, normal detail,
credit-card detail, create, edit, archive, or privacy-hidden screenshots are
claimed under `output/playwright/money-final-08f/`.

## Remaining debt

Only deferred items remain:

- user-facing Balance Adjustment implementation;
- archived-account restore/history browser;
- Transactions track;
- Savings track;
- broader Debt/Cards feature track;
- Investments track;
- stale/freshness contracts requiring new source metadata;
- authenticated 08F browser fixture and final screenshot matrix;
- missing 08D implementation report artifact.

No Transactions work was started.

## Validation

- Focused final-pass tests: passed — 31 tests across motion, Money privacy,
  account forms, and ledger accounts.
- Full unit suite: passed — 126 files, 934 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; 94 routes generated.
- Money/account E2E: passed — 2 unauthenticated tests; 5 authenticated tests
  skipped because credentials were not configured.
- Shared E2E smoke: passed — 5 tests; 2 credential-gated tests skipped.
- Targeted Prettier check: passed for all 08F-changed code and tests.
- Full `format:check`: failed on the existing repository baseline — 2,209
  formatting differences in unrelated files. The 08F report and all 08F-changed
  code/tests pass targeted Prettier checks.
- Automated Axe: not present in the repository; no heavy dependency was added.
- Static semantic checks, Testing Library accessibility queries, keyboard/focus
  assertions in the existing E2E path, motion-policy tests, privacy tests, and
  component regression checks were used instead.

## Final verdict

`MONEY/ACCOUNTS REFERENCE READY WITH DOCUMENTED FIXTURE GAPS`

The implementation and automated baseline are reference-ready. The remaining
qualification is operational: authenticated 08F browser evidence and the
missing 08D report require the configured fixture/artifact, not further Money
or Transactions implementation.
