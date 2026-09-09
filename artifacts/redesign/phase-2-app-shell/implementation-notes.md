# Phase 2 — App shell + shared visual foundation

**Status:** Implemented. Does not overwrite `.agents/design-system.md`.

## What this phase did

Establish one coherent ViNha chrome and shared primitive language so later screen phases consume the same shell. Individual product screens were not redesigned.

Calm Household Finance remains the identity: warm-stone surfaces, selective teal, medium density. Competitor influence is principle-only (Monarch household clarity, Monzo speed, Copilot scanability, YNAB planning clarity) — not cloned chrome.

## What already satisfied the contract

Inspected and left in place unless noted below:

- `AppViewport` + `ChromeShell` — centered `--app-viewport-max: 440px`, one scroll owner, overlay portal, top safe area
- Five-tab registry `TABS` (Home / Money / Plan / Inbox / Together); Health is not a tab
- `Sheet` / `ActionSheetLayout` / `SheetActionFooter` — bottom drawer, `max-h-[min(90dvh,720px)]`, overlay radius, sticky footer + safe-area
- `Page` gutter `--page-gutter` (16px), `Section`, `Card` tones, `Button` primary/secondary/tertiary/danger
- `Balance` / `Amount` / `FinancialDeltaValue` / `FinancialValue` privacy masking + tabular numerals
- `EmptyState`, `Skeleton`, `StatusAlert`, `Toast`, `Dialog`, `AppIcon` (Hugeicons Free Stroke Rounded)
- Shared form primitives (HeroUI Select / Date / Time — not native as primary)
- Motion tokens in `shared/motion`; HeroUI owns sheet/dialog motion

## Changes made

| Area | Change |
| --- | --- |
| Bottom navigation | Attached infrastructure chrome. Removed floating 481px+ pill container, sliding `layoutId` indicator, and icon pop. Active state = `bg-primary-soft` + primary color + semibold + emphasized stroke + `aria-current`. |
| FAB | Canonical `FloatingActionButton` pill. Call sites on Home, Money, Transactions (via Money capture), Savings, Investments, Debts, Loans now share one control. Gap token no longer includes the removed nav margin. |
| TopAppBar | Variant padding/title resolved with named helpers (no nested ternary). `data-slot="top-app-bar"`. Trailing slot marked. Variants **not renamed**. |
| BottomActionBar | Uses `--page-gutter` instead of hardcoded `--space-4`. `data-slot="bottom-action-bar"`. |
| Financial numbers | `FinancialNumberKind`: current-state / movement / intention / estimate. `Balance` and `FinancialDeltaValue` stamp kind. `Amount` defaults to intention; `kind="estimate"` is quieter (`font-medium`) without changing calculations. |
| Global states | `ErrorState` uses the same plate + typography language as `EmptyState` (danger surface). |
| Forms / a11y | `formFieldA11y(..., required)` emits `aria-required`. Checkbox label is a 44px target. `IconButton` has press scale + visible focus. Cards expose `data-tone`. |

## Variant map (do not rename in screens)

Phase 2 asked for Root / Back / Detail / Form / Search. Existing implementation already had justified variants. Mapping:

| Phase 2 name | Implemented variant | Notes |
| --- | --- | --- |
| Root | `primary` | Top-level destination title |
| Back + Detail | `detail` (`onBack` / `backHref`) | Back is behavior, not a separate variant |
| Form | `form` | Create/edit pages |
| Search | composition via `trailing` | Not a fifth variant |
| Hub expressiveness | `contextual` | Kept — required by `app-shell.md` for situation headlines |

## Contract tensions (documented, not silently rewritten)

1. **`artifacts/design-system-evolution/CURRENT/app-shell.md`** says “Do not introduce a global floating action button.” **Design SoT S2 + D-027 ADOPT** the Home/Money Add Transaction FAB. Design SoT wins. FAB stays.
2. **IA `navigation-architecture.md`** still lists Net Worth as a future Money product. **D-003 REJECT** for all UI redesign phases. Not implemented.
3. **`Amount kind="estimate"`** is available for later screen phases. Existing Investment/Plan screens were not retrofitted (would be a screen redesign).

## Contract safety

- Database / API / RPC / auth / validation / ledger math: unchanged
- Route semantics and five-tab IA: unchanged
- 440px shell: unchanged
- No mock or seed data

## Recommended next phase

**PHASE 3 — HOME: Household Financial Command Center**
