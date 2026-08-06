# Phase D Input

Phase D Design System Evolution should support these behavior contracts without creating visual layouts in this phase.

## Required Design-System Capabilities

- Mobile app shell with five bottom tabs.
- Screen header with one primary action.
- Sticky mobile action bar.
- Financial confirmation dialog/sheet.
- Journey receipt component.
- State-labeled amount display.
- Source/freshness label for estimated values.
- Owner-specific empty/error/recovery states.
- Progressive form step pattern.
- Inline validation summary and field errors.
- Read-only Health insight/source-link pattern.
- Inbox review decision pattern.
- Investment value warning pattern.

## Component Behavior Inputs

| Pattern | Needed behavior |
|---|---|
| Amount display | Include meaning: available, recorded, due, expected, estimated, realized, unrealized. |
| Confirmation | Support source/destination/amount/date/reversibility/records. |
| Receipt | Summarize real money, plan, decision, and related record impact. |
| Form stepper | Required-first, validation-aware, draft-aware. |
| Bottom action | Safe-area aware, keyboard aware, one primary action. |
| Empty state | One context-specific next action. |
| Health card | Read-only and source-linked. |
| Investment card | Estimated value freshness and not-cash distinction. |

## Do Not Define in Phase D From This Artifact Alone

- New business rules.
- New product scope.
- New primary tabs.
- Visual style before behavior patterns are mapped.

