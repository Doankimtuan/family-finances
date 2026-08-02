---
document: Page Specifications
technical_specification: v2.1.0
status: OFFICIAL_IMPLEMENTATION_SPEC
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
redesign_product: false
redesign_architecture: false
frozen: true
---

# Page Specifications

| Route | Purpose | Primary module queries/commands | REQ |
|-------|---------|----------------------------------|-----|
| `/login` | Auth OAuth-first + email | StartOAuthSignIn, SignInWithPassword | REQ-002, REQ-002a |
| `/register` | Email register | SignUpWithPassword | REQ-002a |
| `/forgot-password` | Password recovery | RequestPasswordReset | REQ-002a |
| `/auth/confirm` | PKCE / OTP exchange UI | (adapter `app/auth/confirm`) | REQ-002a |
| `/auth/signout` | Sign out adapter | SignOut | REQ-002a |
| `/(product)/home` | Three answers + Health chip | ledger.GetRealPosition, plan.GetPlanPulse, inbox.GetInboxCount, health.GetHealthChip | REQ-001,015 |
| `/(product)/money` | Accounts, capture, debts, savings, cards | ledger.* | REQ-010,011,016,018 |
| `/(product)/plan` | Jars, goals, recurring, Month Ritual | plan.* | REQ-003,004,008,009 |
| `/(product)/inbox` | Review/maturity/EMI cards | inbox.* | REQ-005,010 |
| `/(product)/together` | Members, invites, policies | tenancy.* | REQ-012,013,020 |
| `/(product)/together/onboard` | ≤3 essential steps | tenancy + ledger + plan bootstrap | REQ-014 |
| `/(product)/health` | Health detail | health.* | REQ-015 |
