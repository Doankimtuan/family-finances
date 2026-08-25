# Component Ownership

High-level placement rules only. No implementation guidance.

## Ownership Tiers

| Tier | Belongs in | Examples | Rules |
|---|---|---|---|
| Primitive UI | `shared/ui` | Button, IconButton, Input, Textarea, Select, Badge, Avatar, Skeleton, Progress, Alert | No domain language. No product behavior. No route imports. |
| App shell patterns | `shared/patterns/shell` or equivalent pattern tier | AppViewport, ChromeShell, BottomNavigation, TopAppBar, SafeArea wrappers | App-level navigation/chrome only. |
| State patterns | `shared/patterns/state` | EmptyState, LoadingState, ErrorState, MutationOfflineBanner | Reusable product states, no module-specific content. |
| Overlay patterns | `shared/patterns/overlay` | Dialog, Sheet, Toast | Presentation primitives, not feature owners. |
| Formatting/display patterns | `shared/patterns/display` | Amount, Balance, KpiBlock, SectionHeader | Reusable display without module ownership. |
| Module UI | `modules/<module>/ui` or route-local feature folders in implementation phases | AccountCard, TransactionRow, JarCard, GoalCard, HealthCard, ReviewCard, LoanCard, SavingCard | Owned by the module whose entity it represents. |
| Feature-local UI | Route-local feature folder | CreateLoanForm, RitualWizard, InboxDecisionPanel | Used by one screen or one route family only. |
| Shared hooks | `shared/hooks` | useOnlineStatus | Generic browser/app behavior only. |
| Module hooks | `modules/<module>/ui/hooks` or route-local | Money filters, ritual wizard state | Module-specific behavior only. |

## Current Component Reassignment Targets

| Current component | Canonical owner |
|---|---|
| `AccountCard` | `ledger` |
| `CreditCardCard` | `ledger`, retained only while compatibility exists |
| `TransactionRow` | `ledger` |
| `LoanCard` | `ledger` |
| `LoanCard` | canonical loan presentation |
| `JarCard` | `plan` |
| `GoalCard` | `plan` |
| `ReviewCard` | `inbox` |
| `HealthCard` | `health` |
| `TogetherPreferences` | `tenancy` |
| `Amount` | shared display pattern |
| `Balance` | shared display pattern |
| `AmountField` | shared form/display pattern if domain-neutral; otherwise ledger form pattern |
| `QuickAction` | shared action pattern |
| `ProductStub` | remove from canonical IA unless actively used |

## Form Ownership

Rules:

- Forms belong to the owner of the entity or action.
- A form may use `shared/ui/form` primitives.
- Multi-step forms belong feature-local until reused by two or more screens in the same module.
- Cross-module orchestration forms are owned by the screen owner and call typed application APIs.

## Dialog and Sheet Ownership

Rules:

- `Dialog` and `Sheet` are shared overlay patterns.
- Dialog content belongs to the owning module or feature.
- Bottom sheets are presentation, not separate owners.
- A dialog that creates or mutates an entity is owned by the entity owner.

## Anti-Duplication Rules

- Do not create both shared and module-local versions of the same entity card.
- Do not put module language into `shared/ui`.
- Do not put route-specific flows into `shared/patterns`.
- Do not use `components/` as an unowned dumping ground.
