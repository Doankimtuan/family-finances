# Component Contracts

## Contract Format

Each component must define purpose, allowed usage, forbidden usage, variants, states, ownership, and accessibility behavior before promotion to shared.

## Foundations

| Component | Purpose | Allowed usage | Forbidden usage | Variants | States | Ownership | Accessibility |
|---|---|---|---|---|---|---|---|
| AppViewport | 440px mobile app canvas. | Product shell and portal boundary. | Desktop dashboard container. | Default, system. | Ready. | `shared/patterns`. | Keeps overlays inside app, safe-area aware. |
| Page | Screen structure. | One screen purpose. | Nested pages. | Hub, detail, flow, system. | Loading, ready, empty, error. | `shared/patterns`. | Landmarks and logical heading order. |
| Section | Group related facts/actions. | Screen regions. | Decorative card replacement. | Default, compact, emphasized. | Ready, empty, partial. | `shared/patterns`. | Headed when needed. |
| Stack | Vertical layout. | Form and content rhythm. | Business-specific meaning. | Tight, standard, spacious. | N/A. | `shared/ui`. | DOM order matches reading order. |
| Inline | Horizontal layout. | Labels, badges, row actions. | Crowding long localized text. | Start, center, between. | Wrap, nowrap. | `shared/ui`. | Supports wrapping and focus order. |
| Divider | Low-emphasis separation. | Group boundaries. | Divider after every row by default. | Subtle, strong. | N/A. | `shared/ui`. | Hidden from screen reader unless semantic. |
| Typography | Text roles. | All visible text. | Raw ad hoc font classes. | Heading, body, caption, amount. | Truncate only with full label available. | `shared/ui`. | Semantic tags and localized labels. |
| Icon | Visual aid. | Actions, categories, status. | Meaning without text/aria. | Outline, filled status. | Default, active, disabled. | `shared/ui`. | Decorative icons hidden, functional icons labelled. |
| Surface | Bounded background. | Cards, sheets, grouped content. | Nested card soup. | Page, surface, elevated. | Hover, selected, disabled. | `shared/ui`. | Contrast-safe in both themes. |

## Actions

| Component | Purpose | Allowed usage | Forbidden usage | Variants | States | Ownership | Accessibility |
|---|---|---|---|---|---|---|---|
| Button | Explicit command. | Primary, secondary, danger, ghost. | More than one primary per state. | Primary, secondary, danger, subtle. | Hover, active, loading, disabled. | `shared/ui`. | 44px target, clear label. |
| IconButton | Compact command. | Toolbar, nav, row action. | Unlabelled action. | Default, subtle, danger. | Hover, active, pressed, disabled. | `shared/ui`. | Requires aria-label or tooltip label. |
| FloatingAction | Fast capture. | One high-frequency action. | Multiple competing FABs. | Capture, add. | Default, expanded, disabled. | `shared/patterns`. | Thumb reachable, safe-area aware. |
| BottomActionBar | Sticky mobile action. | Long forms and confirmations. | Non-primary links collection. | Single, primary+secondary. | Keyboard, loading, disabled. | `shared/patterns`. | Does not hide fields, respects safe area. |
| ActionRow | Row of commands. | Detail screen actions. | Destructive action without confirmation. | List, grouped. | Default, destructive, disabled. | `shared/patterns`. | Role and focus order clear. |
| MenuAction | Overflow command. | Secondary or rare actions. | Hiding primary action. | Default, destructive. | Open, selected, disabled. | `shared/ui`. | Keyboard menu behavior. |

## Forms

| Component | Purpose | Allowed usage | Forbidden usage | Variants | States | Ownership | Accessibility |
|---|---|---|---|---|---|---|---|
| Form | Validated data entry. | Single or progressive flows. | Field dump without order. | Single, progressive. | Dirty, submitting, error. | Feature or `shared/patterns`. | Summary jumps to invalid fields. |
| FormField | Label/helper/error wrapper. | All fields. | Placeholder-as-label. | Default, required, optional. | Valid, invalid, disabled. | `shared/ui`. | Label association and describedby. |
| TextField | Text input. | Names, notes, simple text. | Money or date entry. | Default, search-like only if approved. | Focus, invalid, disabled. | `shared/ui`. | Label above input. |
| MoneyField | Currency input. | Amount capture. | Percent or plain number. | Income, expense, transfer, estimate. | Focus, invalid, readonly. | `shared/patterns`. | Currency and amount meaning announced. |
| NumberField | Numeric non-money. | Counts, periods. | Money or percentage. | Integer, decimal. | Focus, invalid, disabled. | `shared/ui`. | Input mode and constraints. |
| PercentageField | Rates and ratios. | Interest, progress rates. | Money change. | Rate, progress. | Focus, invalid, disabled. | `shared/patterns`. | Percent label included. |
| DateField | Effective dates. | Due, posted, maturity. | Free-text date without parser. | Single, range when needed. | Focus, invalid, disabled. | `shared/patterns`. | Localized date and calendar labels. |
| SelectField | Choice from known set. | Account, category, owner. | Long search dataset. | Single, searchable when needed. | Open, selected, invalid. | `shared/ui`. | Keyboard and screen reader names. |
| SegmentedField | Small option set. | Type toggles, modes. | More than 4 options. | Equal, adaptive. | Selected, disabled. | `shared/patterns`. | Radio-group semantics. |
| SwitchField | Binary setting. | Preference on/off. | Risky financial action. | Default. | On, off, disabled. | `shared/ui`. | State announced. |
| CheckboxField | Consent or independent option. | Agreements, optional flags. | Mutually exclusive choices. | Default. | Checked, indeterminate, invalid. | `shared/ui`. | Label is clickable. |
| SearchField | Filter or lookup. | Lists, categories. | Primary data capture. | Default, with clear. | Focus, results, empty. | `shared/ui`. | Search role and clear label. |
| SubmitAction | Form submission. | Save, Continue, Confirm. | Hidden below keyboard. | Inline, bottom bar. | Loading, disabled, success. | `shared/patterns`. | Announces pending and result. |

## Feedback

| Component | Purpose | Allowed usage | Forbidden usage | Variants | States | Ownership | Accessibility |
|---|---|---|---|---|---|---|---|
| Alert | Prominent message. | Risk, stale, permission, offline. | Ordinary decoration. | Info, caution, critical, success. | Default, dismissible. | `shared/ui`. | Role based on severity. |
| InlineMessage | Field or local guidance. | Validation and recovery. | Global error replacement. | Info, error, caution. | Visible, hidden. | `shared/ui`. | Associated with control. |
| Toast | Transient feedback. | Saved preference, copied link. | Critical confirmation receipt. | Success, info, error. | Queued, dismissed. | `shared/patterns`. | Announced politely. |
| EmptyState | No data yet. | Owner-specific next action. | Generic marketing copy. | First use, filtered, no decisions. | Ready. | `shared/patterns`. | One action, clear heading. |
| ErrorState | Failed state. | Recoverable or route-out failure. | Blaming user. | Recoverable, denied, system. | Retry, contact, exit. | `shared/patterns`. | Error role where needed. |
| LoadingState | Whole screen wait. | Initial loading. | Replacing known cached data. | Skeleton, message. | Loading. | `shared/patterns`. | Does not imply success. |
| Skeleton | Reserved loading shape. | Lists, cards, charts. | Spinner-only content areas. | Text, row, card, chart. | Animated, reduced-motion static. | `shared/ui`. | Hidden from screen reader. |
| Progress | Completion or setup. | Form steps, goal progress. | Decorative scoreboard. | Linear, compact. | In progress, complete. | `shared/ui`. | Text equivalent required. |
| SuccessState | Meaningful completion. | Receipt and next destination. | Toast-only money changes. | Receipt, milestone. | Complete. | `shared/patterns`. | Outcome announced. |

## Overlays

| Component | Purpose | Allowed usage | Forbidden usage | Variants | States | Ownership | Accessibility |
|---|---|---|---|---|---|---|---|
| Dialog | Blocking decision. | Desktop or short mobile confirmation. | Long forms on mobile. | Standard, danger. | Open, closing. | `shared/patterns`. | Focus trap, labelled title. |
| ConfirmDialog | Explicit confirmation. | Destructive or high-risk actions. | Harmless reversible actions. | Lightweight, preview-confirm. | Pending, error. | `shared/patterns`. | Consequence and action labelled. |
| BottomSheet | Mobile overlay. | Short decisions, filters, previews. | Complex long setup. | Peek, standard, full. | Open, keyboard. | `shared/patterns`. | Focus managed, safe-area aware. |
| Drawer | Secondary navigation or detail. | Larger screens only if needed. | Replacing mobile pages. | Side. | Open, closed. | `shared/patterns`. | Landmark and escape behavior. |
| Popover | Contextual small panel. | Menus, hints. | Critical warnings. | Menu, info. | Open, closed. | `shared/ui`. | Trigger relationship. |
| Tooltip | Label hidden affordance. | Icon labels. | Essential financial info. | Text. | Hover, focus. | `shared/ui`. | Not required to complete task. |

## Financial Patterns

| Component | Purpose | Allowed usage | Forbidden usage | Variants | States | Ownership | Accessibility |
|---|---|---|---|---|---|---|---|
| MoneySummary | One financial summary. | Hub and detail summary. | Multiple dominant amounts. | Real, plan, estimate. | Ready, stale, partial. | `shared/patterns`. | Amount meaning announced. |
| BalanceRow | Account or product balance row. | Lists and previews. | Jar intention without label. | Account, card, loan, savings. | Stale, selected, disabled. | `shared/patterns`. | Meaning, source, freshness. |
| FinancialProductCard | Bounded product object. | Account, card, loan, saving, investment. | Generic info card. | Account, debt, savings, investment. | Active, closed, stale, partial. | Module first, promote after Rule of Three. | Clear object name and action. |
| ProgressSummary | Goal or setup progress. | Goals, rituals, onboarding. | Financial health score decoration. | Goal, step, ritual. | Started, complete, blocked. | `shared/patterns`. | Numeric and text progress. |
| TransactionRow | Ledger movement. | Real transactions only. | Plan movement. | Income, expense, transfer, correction. | Pending, posted, corrected, refunded. | `shared/patterns`. | Direction and amount meaning. |
| ReviewItem | Decision queue item. | Inbox decisions. | Generic notifications. | Unmapped, reminder, maturity, policy. | New, stale, resolved. | `shared/patterns`. | Decision question readable. |
| ScheduleRow | Due or calendar event. | Cards, loans, savings, recurring. | Transaction history row. | Due, paid, missed, upcoming. | Upcoming, overdue, complete. | `shared/patterns`. | Date meaning included. |
| MaturitySummary | Savings maturity. | Savings detail and review. | Generic due card. | Upcoming, renewed, withdrawn. | 30, 14, 7 day alert. | Savings module then shared. | Date, consequence, options. |
| LoanSummary | Loan facts. | Loan detail and confirmation. | Investment or card summary. | Simple, schedule, payoff. | Current, changed, closed. | Loans module then shared. | Principal, due, interest labels. |
| SavingsSummary | Savings facts. | Savings detail. | Plan goal card. | Active, maturity, renewal. | Current, stale, matured. | Savings module then shared. | Principal, maturity, proceeds labels. |
| InvestmentSummary | Risk-bearing holding. | Investment detail and Health context. | Spendable cash display. | Estimated, realized, under review. | Stale, partial, exited. | Investments module then shared. | Not-cash and source labels. |
| HealthInsight | Read-only insight. | Health and Home summary. | Action command. | Positive, caution, critical, info. | Complete, partial, stale. | Health module then shared. | Source facts and no advice. |
| FinancialPreview | Consequence preview. | Confirmations. | Decorative before harmless actions. | Real, plan, decision, mixed. | Ready, changed, invalid. | `shared/patterns`. | Explicit affected records. |
| MoneyMovementPreview | Source to destination preview. | Transfers, payments, funding. | Plan-only movement. | Transfer, payment, refund, correction. | Valid, warning, blocked. | `shared/patterns`. | Source, destination, amount, date. |


## Global Polish Contracts

### Section and Action Hierarchy

`SectionHeader` is the canonical section-heading pattern. It combines a concise title, an optional muted description, and an optional trailing action. Section titles are presentational signposts rather than page headlines; they use a restrained `text-lg` hierarchy and must not be uppercased. Trailing actions use the shared compact text-action treatment and remain secondary to the page or section’s single primary CTA.

### Surface and List Hierarchy

Use `Card` tones deliberately. `highlighted` and `KpiBlock` `prominent` are reserved for the current primary financial state. `default` groups a meaningful independent object. `interactive` is for a tappable object and includes subtle border/background/press feedback. `soft` and `metric` provide tonal grouping for explanation, supporting facts, and compact summaries without a visible border. Do not create nested default cards simply to separate content; prefer a `Section`, whitespace, or a soft surface.

Financial object rows use the shared account, credit-card, jar, transaction, and review-card patterns. They show title, secondary context, amount or state, and optional metadata while staying visually lighter than a primary financial summary. A row must retain a 44px minimum touch target, focus visibility, and a restrained press response when interactive.

### Status and Filter Controls

`StatusBadge` is the reusable semantic label primitive. Its tones are `neutral`, `positive`, `info`, `warning`, `attention`, and `selected`; labels remain concise and should not rely only on color. `FilterChip` owns filter selection semantics through `aria-pressed`, the selected/unselected visual distinction, compact wrapping, focus treatment, and reduced-motion-safe feedback. Feature code owns filter state and labels, not chip styling.

### Empty States and Page Rhythm

`EmptyState` uses one modest Hugeicons Free Stroke Rounded accent, a human title, a short explanation, and at most one useful next action. Empty states are calm and supportive; they must not introduce large illustrations, decorative hero art, or generic “No data” copy when a clearer explanation is available.

`Page` uses the shared gutter plus a compact body rhythm: 12px header-to-content offset, 16px standard content gaps, and 20px bottom spacing before the shell-reserved navigation area. Use `space-3` within compact metadata groups, `space-4` between related blocks, and `space-5` or above only when a clear region boundary warrants it.
