# Component Review

## Component Layers

`shared/ui` provides design-system primitives:

- `Button`
- `IconButton`
- `Text`
- `Heading`
- `Input`
- `Textarea`
- `Select`
- `Avatar`
- `Badge`
- `Divider`
- `Spinner`
- `Skeleton`
- `Progress`
- `Alert`
- `StatusAlert`
- `FormField`
- `TextField`

`shared/patterns` provides product patterns and shells:

- `AppViewport`
- `ChromeShell`
- `BottomNavigation`
- `TopAppBar`
- `AuthScreenShell`
- `BrandMark`
- `AuthBrandMark`
- `AuthHouseGlow`
- `DividerWithText`
- `SocialButton`
- `Card`
- `Sheet`
- `Dialog`
- `Toast`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ProductStub`
- `LocaleSwitcher`
- `ThemeToggle`
- `TogetherPreferences`
- `SectionHeader`
- `Balance`
- `Amount`
- `AmountField`
- `JarCard`
- `GoalCard`
- `QuickAction`
- `TransactionRow`
- `ReviewCard`
- `KpiBlock`
- `HealthCard`
- `SystemShell`
- `MutationOfflineBanner`
- `InstallmentCard`
- `LoanCard`
- `AccountCard`
- `CreditCardCard`

Feature-colocated components live under route folders:

- Auth screens/forms are colocated under auth routes.
- Money forms/actions/cards are colocated under money routes.
- Plan forms/wizards/actions are colocated under plan routes.
- Inbox queue/decision components are colocated under inbox routes.
- Together panels/forms/cards are colocated under together routes.

## Component Architecture Issues

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| `shared/patterns` mixes app shell, overlays, system states, money cards, plan cards, health cards, and together preferences. Ownership is too broad for redesign scaling. | Medium | High | Medium |
| `components/` is empty, so it is unclear whether Phase B should put redesign composition components there or continue using route colocation. | Medium | Medium | Low |
| Several large client components combine form state, mutation state, validation, and layout in one file. | High | High | Medium |
| Product-specific cards live in `shared/patterns` even when they map to one module area. This risks cross-module UI coupling. | Medium | Medium | Medium |
| `InstallmentCard` remains as a deprecated alias to `LoanCard`. | Low | Low | Low |
| `ProductStub` is exported but not used by the scanned product routes. | Low | Low | Low |
| Forms use shared primitives, but there is no visible shared workflow pattern for create/edit/refund/correct/action pages. | Medium | High | Medium |
| Dialog and Sheet wrappers exist, but route-colocated forms choose their own presentation patterns. | Medium | Medium | Medium |
| Error, empty, loading, and offline states exist as primitives/patterns, but page-level use is uneven. | Medium | Medium | Medium |

## Large UI Files Noted

Files over roughly 250 lines that are likely redesign friction:

- `app/[locale]/(product)/inbox/inbox-decision-panel.tsx` - 605 lines
- `app/[locale]/(product)/plan/ritual/ritual-wizard.tsx` - 535 lines
- `app/[locale]/(product)/money/loans/create-loan-form.tsx` - 460 lines
- `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx` - 403 lines
- `app/[locale]/(product)/plan/jars/reallocate-jar-form.tsx` - 370 lines
- `app/[locale]/(product)/money/loans/[id]/page.tsx` - 358 lines
- `app/[locale]/(product)/money/accounts/add-account-form.tsx` - 357 lines
- `app/[locale]/(product)/together/policies/policies-form.tsx` - 331 lines
- `app/[locale]/(auth)/register/register-screen.tsx` - 311 lines
- `app/[locale]/(product)/plan/recurring/[id]/recurring-detail-form.tsx` - 298 lines
- `app/[locale]/(product)/money/transactions/capture-transaction-form.tsx` - 298 lines
- `app/[locale]/(product)/plan/calendar/calendar-view.tsx` - 290 lines
- `app/[locale]/(product)/money/transactions/[id]/correct/correct-transaction-form.tsx` - 274 lines
- `app/[locale]/(product)/plan/jars/[id]/jar-detail-controls.tsx` - 268 lines
- `app/[locale]/(product)/money/accounts/[id]/page.tsx` - 264 lines
- `app/[locale]/(product)/money/accounts/[id]/account-detail-actions.tsx` - 264 lines
- `app/[locale]/(auth)/login/login-screen.tsx` - 256 lines

## Component Readiness

The primitive layer is a good foundation. The pattern layer needs ownership boundaries before a redesign adds many new compositions.

