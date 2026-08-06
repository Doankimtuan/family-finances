---
document: Interaction Language
design_foundation: v1.1.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_mobile_design_system_20260801T180000Z
created_at: 2026-08-01T16:01:24Z
board: Mobile Experience & Design System Board
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
inherits: v1.0.0
supersedes_clauses: desktop-nav-layout-ui-kit
frozen: true
---
# Interaction Language

## Priorities

Fast money entry · One-handed use · Thumb reach · Minimal typing · Progressive disclosure · Large touch targets (≥44px) · Readable summaries · High trust · Clear confirmation · Clear review workflow.

## One primary question

Every screen answers one primary question. Never overload.

## Navigation

Bottom nav inside the application viewport: `Home | Money | Plan | Inbox | Together`. Health via Home chip. **No sidebar.** Same nav on desktop (inside 440px viewport).

## Money entry

Capture common expense &lt;15 seconds. Positive magnitude + explicit direction. Online required (BR-15). Idempotent retry-safe submit.

## Confirmation

Destructive money: preview + confirm. Suggest → confirm → teach. Month Ritual: preview → approve → lock.

## Review (Inbox)

One ReviewItem = one decision card. Resolve / dismiss / acknowledge. Both partners may resolve.

## Forms

Label above. RHF + Zod. Amount + direction adjacent. Never stretch form fields to desktop browser width — fields stay viewport-width.

## Feedback

Quiet success for routine. Celebration only ritual/goal/EMI. Failures spoken. Offline mutations fail closed.

## Gestures / keyboard / focus

Swipe optional with button equivalent. Keyboard paths for capture, Inbox, ritual (REQ-019). Visible focus rings. Focus trap in sheets/dialogs constrained to viewport.

## Desktop interactions

Preserve mobile interactions. Sheets/dialogs/toasts render within the app viewport — never full-bleed browser modals.
