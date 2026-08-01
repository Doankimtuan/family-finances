---
document: Interaction Language
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Interaction Language

Aligned with Official Interaction Principles and UX Guidelines.

## Interaction Patterns

| Pattern | Rule |
|---------|------|
| Primary action | One obvious CTA |
| Suggest flow | Suggest → confirm → teach |
| Destructive money | Preview + confirm |
| Inbox | One decision per ReviewItem card |
| Ritual | Preview → approve → lock |
| Offline mutate | Fail closed; no local write queue |

## Navigation Rules

- Primary: `Home | Money | Plan | Inbox | Together`  
- Health: Home chip / utility — not 6th primary tab  
- Gates: unauth → Auth; no household → Together onboard; else → Home  
- Deep links: Inbox item, Month Ritual, maturity, EMI, invite  
- Inbox badge from count  

## Form Rules

- Label above field; helper optional; error below  
- react-hook-form + Zod shared with commands  
- Group related money fields; amount + direction adjacent  

## Validation Rules

- Validate on blur/submit; don’t punish every keystroke for amount  
- Zod messages → human copy  
- Policy Block overspend: hard stop with explanation  

## Feedback Rules

- Success: quiet for routine; celebrate only ritual/goal/EMI  
- Error: human message + recovery; map `error.code`  
- Never silent money failure  

## Selection Rules

- Single-select jars for placement unless product says multi  
- Only Active jars selectable as targets  
- Clear selected state with non-color cue  

## Review Rules

- ReviewItem card: title, why, primary resolve, secondary dismiss/ack  
- Aging items escalate via notification philosophy  

## Approval Rules (Phase 2)

- Approval kinds use same Inbox card grammar  
- Partner-visible outcomes  

## Money Entry Rules

- Capture common expense <15 seconds  
- Positive magnitude + explicit direction (in/out/transfer)  
- Online required for commit  
- Idempotent retry-safe submit  

## Planning Rules

- Teach real≠virtual on Plan  
- Month Ritual Assisted default  
- Closed month: explicit correction path only  

## Inbox Rules

- One card = one decision  
- Resolve to jar / dismiss / acknowledge maturity  
- Both partners may resolve  

## Health Dashboard Rules

- Reachable from Home chip  
- Score + narrative first; light scenarios second  
- No shame framing  

## Gesture Rules

- Swipe optional for Inbox secondary actions; always provide button equivalent  
- No gesture-only money commit  

## Keyboard Rules

- Full path for capture, Inbox resolve, Month Ritual (REQ-019)  
- Enter submits primary when safe; Esc closes dialogs/sheets  

## Focus Rules

- Visible focus ring (tokenized)  
- Focus trap in dialogs/sheets  
- Return focus on close  

## Touch Targets

Minimum 44×44px for primary controls and nav items.
