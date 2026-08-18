# Ownership UI & Application Rollout — 14E

Date: 2026-08-18  
Status: Complete

## 1. Executive summary

14E enables the approved V1 ownership model in the application for accounts,
savings, investment holdings, loans, and liabilities/debts.

Creation accepts only `financialScope: household | personal`. The browser
never supplies an owner membership ID. The trusted server/application layer
derives the caller's active membership for personal creation, and the updated
create RPCs repeat that derivation as the database security backstop.

Personal resources remain visible to the household. Household resources remain
the default and remain mutable by every active household member. Personal
resources are mutable only by their owner.

## 2. Application create-flow inventory

| Domain            | UI form                                        | Validation                 | Server/application command       | Mutation                                                                    | Root row              |
| ----------------- | ---------------------------------------------- | -------------------------- | -------------------------------- | --------------------------------------------------------------------------- | --------------------- |
| Accounts          | Add account form                               | `createAccountInputSchema` | `createAccount`                  | trusted direct insert                                                       | `accounts`            |
| Savings           | Create saving wizard                           | `createSavingInputSchema`  | `createSaving`                   | `create_saving_with_transfer`                                               | `savings`             |
| Investments       | Opening-position / initial-purchase form       | investment command schemas | investment commands              | `record_investment_opening_position` / `record_investment_initial_purchase` | `investment_holdings` |
| Loans             | Create loan form                               | `createLoanInputSchema`    | `createLoan`                     | `create_loan_with_schedule`                                                 | `loans`               |
| Liabilities/debts | Debt create sheet and legacy liability command | debt schemas               | `createDebt` / liability command | `create_debt` or trusted direct insert                                      | `liabilities`         |

The inventory was traced from repository code. Investments use
`investment_holdings`; no ownership was added to the vestigial
`investment_accounts` model.

## 3. Shared FinancialScope application contract

The application uses the existing shared `FinancialScope` contract and
canonical values:

```ts
financialScope: "household" | "personal";
```

The shared `FinancialScopeField` owns the compact accessible selector and
localized helper copy. Creation schemas default to `household` and reject
unknown values. No per-domain ownership variants were introduced.

## 4. Server-side owner derivation

`resolveCreationOwnership` is the single creation-normalization helper. It
requires an active membership for the requested household, then returns:

- household → `ownerMembershipId: null`
- personal → the authenticated caller's active membership ID
- missing membership → fail closed

The client payload contains no `ownerMembershipId` field. Updated creation
RPCs accept only the scope value and derive the owner from `auth.uid()` and
active membership. Invalid scopes and inactive/missing memberships fail closed.

## 5. Account implementation

Account creation now presents Household / Personal, defaulting to Household.
Account detail displays `Household`, `Personal · You`, or `Personal · Partner`.
Partner-owned personal accounts remain visible, while edit/archive and
transaction-entry affordances are removed or read-only. Account ownership is
not present on the edit form, so it cannot be changed in V1.

## 6. Savings implementation

Saving creation supports the same selector and server normalization. Saving
detail/list read models expose ownership capabilities. Partner-owned personal
savings remain visible but do not expose settlement, renewal, edit, withdrawal,
or other owner-only actions.

## 7. Investment implementation

Opening-position and initial-purchase flows support Household / Personal.
Ownership is stored on `investment_holdings`. Partner-owned personal holdings
remain visible with their value/details, while buy, sell, income, valuation,
conversion, and related mutation actions are unavailable.

## 8. Loan implementation

Loan creation supports the selector and defaults to Household. Loan detail
derives a compact capability model and gates payment, interest, status, and
edit actions for partner-owned personal loans without hiding the loan.

## 9. Liability implementation

Debt/liability creation supports the selector in both the current debt sheet
and the legacy liability command path. Partner-owned personal liabilities are
readable but payment, edit, and ordinary archive actions are not offered.
Admin cleanup remains separate and is not exposed as ordinary financial edit.

## 10. Goals V1 behavior

Goal creation has no ownership selector. The application explicitly continues
to write `financial_scope = household` and `owner_membership_id = null`.
Read models tolerate ownership columns without surfacing personal-goal
creation in V1.

## 11. Plan behavior

Plan remains household-only. No personal Plan, jar ownership, or ownership
selector was added. Existing Plan filtering of personal transaction activity
remains unchanged and the full test suite continues to pass.

## 12. Health behavior

Health and net-worth read models continue to include household-visible
personal resources. No include-in-health flag or personal-resource exclusion
was introduced. Existing Plan-only financial activity behavior is unchanged.

## 13. Ownership badges/read models

Read models now expose `financialScope`, `ownerMembershipId`, and derived
capabilities (`isPersonal`, `isOwnedByMe`, `canMutate`) where the domain needs
them. `FinancialOwnershipBadge` provides compact household/personal
indicators for accounts, savings, investments, loans, and liabilities.

Capability derivation is centralized; feature components do not duplicate
owner-membership equality checks.

## 14. Partner read-only affordances

For partner-owned personal resources, the application preserves visibility of
names, balances/values, details, history, and financial impact while removing
or replacing mutation controls. The localized read-only message is available
for management surfaces. The server remains authoritative if stale UI submits
a mutation.

## 15. Localization/accessibility

English and Vietnamese copy was added for Ownership, Household, Personal,
helper text, partner read-only state, and ownership indicators. The selector
uses an accessible radiogroup/radio contract, visible selected state, keyboard
navigation, and non-color state communication. It uses existing design tokens
and compact form patterns for narrow screens and both themes.

## 16. Security/tamper validation

- No application input schema accepts `ownerMembershipId`.
- Personal creation derives ownership from the authenticated caller.
- Household creation persists a null owner.
- Invalid scope values are rejected at validation and RPC boundaries.
- Ownership is not editable in any supported create/edit UI.
- Direct partner mutation attempts return the existing domain-safe `not_allowed`
  result rather than exposing database/RLS internals.

## 17. Tests

Added/updated coverage includes canonical scope validation, creation
normalization, capability derivation, account ownership read models, client
owner-ID exclusion, supported create-form boundaries, and household-default
regression.

Validation results:

- Focused ownership/account tests: 4 files, 88 passed.
- Full suite: 118 files, 890 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `git diff --check`: passed.

`npm run format:check` remains red on the repository baseline: Prettier
reported 2,205 existing files, including archived artifacts and unrelated
modules. Changed TypeScript/JSON files were formatted; SQL migrations are not
parsed by the configured Prettier check.

## 18. Browser validation

Real browser validation covered the running application with dedicated A/B
identities:

- A created a Personal account through the actual UI; the receipt succeeded
  and detail showed `Personal · You`.
- B opened the same account and saw `Personal · Partner`; account mutation
  controls were unavailable.
- B opened controlled personal saving, loan, liability, and investment rows;
  each remained visible with the partner indicator and owner-only actions
  unavailable.
- The account creation selector rendered Household as the default with the
  localized helper copy.
- Investment partner read-only detail was captured at 390px, 440px, 768px,
  and 1280px:
  [390px](/Users/doantuan/Desktop/Plan/family-finances/output/playwright/ownership-investment-390.png),
  [440px](/Users/doantuan/Desktop/Plan/family-finances/output/playwright/ownership-investment-440.png),
  [768px](/Users/doantuan/Desktop/Plan/family-finances/output/playwright/ownership-investment-768.png),
  [1280px](/Users/doantuan/Desktop/Plan/family-finances/output/playwright/ownership-investment-1280.png).

The browser check found and corrected one missing localized account-detail
read-only key before final validation.

## 19. Live DB validation

The dedicated authenticated harness was used with controlled A/B identities.
Live persisted results verified:

- A personal debt, loan, saving, investment opening, and initial purchase each
  persisted `financial_scope = personal` and A's active membership as owner.
- B household debt persisted `financial_scope = household` and a null owner.
- B could read household-visible rows.
- B's direct debt-payment and investment-buy attempts against A-owned
  personal resources were denied with `not_allowed`.
- A personal investment initial purchase passed the existing holding-shape
  constraint after the creation path was corrected.

The controlled fixtures were cleaned up with
`npm run ownership:test-harness -- cleanup`. A subsequent preflight reported
missing controlled memberships, which is the expected post-cleanup state.

## 20. Security regression results

The existing ownership security tests and manifest remain green:

- RPC security: READY
- Protected RPC manifest: COMPLETE
- Trigger bypass: NONE
- Remaining P0 ownership gaps: NONE

The 14E migrations preserve `SECURITY DEFINER`, pinned search paths, existing
grants, authenticated identity derivation, active-membership checks, and the
14D trigger backstop.

## 21. Remaining UX debt

- Owner display is intentionally compact (`You` / `Partner`) rather than a
  new member-picker or membership directory surface.
- Personal goals remain intentionally unavailable in V1.
- A broader automated Playwright suite for every create form can be added if
  future release gates require it; the current browser evidence covers the
  core creation flow and partner read-only surfaces, while RPC and unit tests
  cover equivalent mutation paths.

## 22. Final readiness

PROMPT 14E COMPLETE

Accounts: PASS

Savings: PASS

Investments: PASS

Loans: PASS

Liabilities: PASS

Goals: PASS

Plan: PASS

Health: PASS

Partner read-only UX: PASS

Owner spoof protection: PASS

Ownership immutability: PASS

RPC security: READY

Protected RPC manifest: COMPLETE

Remaining gaps: No new ownership transfer, personal goals, personal Plan/jars,
or full per-form Playwright create suite; all are outside the approved V1
rollout or documented follow-up coverage.

Recommended next prompt:  
Prompt 14F — Together Membership Lifecycle & Personal Resource Cleanup
