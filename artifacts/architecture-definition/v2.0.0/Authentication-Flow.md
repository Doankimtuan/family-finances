---
document: Authentication Flow
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Authentication Flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant P as proxy.ts
  participant N as Next Server
  participant S as Supabase Auth
  B->>P: Request
  P->>S: updateSession / refresh cookies
  P->>N: Forward
  N->>S: getUser
  alt no user
    N->>B: Redirect /login
  else user
    N->>N: tenancy.resolveMembership
    alt no household
      N->>B: Together onboarding
    else member
      N->>B: Product surface
    end
  end
```
