# Debt discovery visual notes

## Existing English create sheet, 390px dark

The sheet is a bottom-sheet overlay with a compact handle, a single title, grouped sections for Relationship, Ownership, direction, who/amount, and the initial form fields. Household/Personal and Borrowed/Lent are tile-like choices. The visible sheet uses dark surfaces, teal selected states, shared-looking controls, and a footer with Cancel and Save record. It also shows a domain hint that debt tracks principal only and that scheduled or interest-bearing obligations belong in Loans. The screenshot is a create-form state only; it does not expose the conditional money-moved account picker, review state, or receipt state.

## Existing English not-found state, 390px light

The not-found surface uses a compact top title, centered EmptyState icon/title, a teal Back to debts link, and the persistent bottom navigation. It is visually consistent with the compact mobile shell and semantic teal treatment. It does not use a danger StatusAlert despite the code path being a not-found branch; this is an edge state to preserve or reconsider during redesign, not a change for this task.

## Redesign verification: 390px detail dark

The redesigned detail now follows the intended hierarchy: compact detail header with edit icon, a teal hero card with explicit “You owe,” neutral hero amount, progress amount/percentage, and an accessible progress bar, followed by a clear Details section, one primary repayment action, and compact Payment history. The hero is readable and the header action is visually aligned with the Account-detail precedent. The lower page is intentionally dense because the persistent bottom navigation remains visible.

## Redesign verification: 390px list light

The redesigned list reads as a management overview: a prominent Add record action, an overview card with neutral To repay / Waiting to receive values, and a scannable Active records row with direction, ownership, remaining amount, paid percentage, and progress. Static remaining values are no longer red/green; attention semantics remain available for due badges when present. The row remains compact without turning the list into an analytics dashboard.

## Redesign verification: 390px create light

The Create sheet now exposes the existing relationship explanations directly beneath the Borrowed/Lent choice, making the decision more understandable without adding new copy or changing the flow. The sheet retains the established ownership choice, amount fields, grouped timing area, and sticky Cancel/Save footer. The current viewport captures the base state; the money-moved branch remains covered by the component logic and screenshot generation.

## Redesign verification: 390px payment dark

The Payment sheet makes the direction explicit (“Repay debt”), keeps the remaining principal visible before entry, presents the amount field and quick actions, and labels the movement as “Pay from account.” The dark surface remains legible with the sticky Cancel/Review footer. The account selector is visibly distinct and the form does not allow submission without the required eligible account.

## Responsive verification: 1280px detail light

The desktop screenshot preserves the intentional centered approximately 440px app shell rather than expanding into a dashboard. The detail header, hero, facts, action, history, and bottom navigation stay coherent and readable inside the constrained column. The hero remains the visual anchor without copying Home’s full dashboard composition.

## Responsive verification: 1280px list dark

The desktop dark-mode list keeps the same single-column shell and preserves the selected Money navigation state. The overview card, active row, neutral current-state values, and teal primary action remain legible against the charcoal canvas. No wide desktop-only layout was introduced.
