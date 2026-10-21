---
name: vinhna-user-journey
description: Audit ViNha end-to-end onboarding, invitations, transactions, family collaboration, or multi-account journeys in real browsers. Use for user-journey verification, not financial calculation review or UI opinions alone.
---

# ViNha user journeys

Apply [audit operating rules](../../audits/OPERATING.md). Check the manifest
before acting. This skill owns journey execution; use `vinhna-financial-integrity`
only when calculations need independent reconciliation, and `vinhna-product-audit`
when classifying findings.

1. Define one Vietnamese family scenario with synthetic actors A and B, their
   roles, initial state, visible acceptance criteria, and a journey ID. Examples:
   invite a spouse into a household, record groceries in VND, or transfer between
   family accounts. Use existing product vocabulary and routes.
2. Write a step checklist in the manifest before execution, covering setup,
   happy path, meaningful failure, persistence, and cross-account visibility.
3. Use two isolated authenticated sessions. Verify distinct identities and
   household membership through the UI; never copy one account's auth to both.
4. Follow actual controls, reading fresh snapshots before selecting targets.
   Exercise the happy path and relevant failures such as rejected amounts,
   invalid invitations, or unauthorized actions. Do not trigger real emails,
   notifications, or payments; use an isolated test sink or mark that step BLOCKED.
5. After each committed action, reload the acting account and inspect the other
   account independently. Verify expected shared visibility and private/role
   restrictions, including failed actions leaving persisted state unchanged.
6. Save concise redacted observations with session alias, action, expected/actual
   result, and evidence path. Capture screenshots only where they add proof.

Complete when every checklist step has a result, browser evidence supports all
PASS claims, both accounts' persisted state is checked, and remaining blockers
or failures plus the exact resume action are saved. A blocked required step keeps
the journey BLOCKED; never infer success from application code or optimistic UI.
