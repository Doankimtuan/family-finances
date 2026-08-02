---
document: Authentication Flow
architecture_version: v2.1.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
auth_enhancement: artifacts/auth-enhancement/v1.0.0
frozen: true
---

# Authentication Flow

## Providers

| Provider | Mechanism |
|----------|-----------|
| Google | Supabase Auth OAuth (web PKCE) |
| Apple | Supabase Auth OAuth (web PKCE) |
| Email + Password | Supabase Auth email provider |

Guest mode is **not** allowed. App identity = `auth.users.id`. Same verified email across providers → one user where Supabase linking supports it (`BR-02b`).

## Login priority

1. Continue with Google  
2. Continue with Apple  
3. Divider  
4. Continue with Email  

## Session refresh (all providers)

```mermaid
sequenceDiagram
  participant B as Browser
  participant P as proxy.ts
  participant N as NextServer
  participant S as SupabaseAuth
  B->>P: Request
  P->>S: updateSession getClaims
  P->>N: Forward
  N->>S: getUser
  alt no user
    N->>B: Redirect login
  else user
    N->>N: tenancy.resolveMembership
    alt no household
      N->>B: Together onboarding
    else member
      N->>B: Product surface
    end
  end
```

## OAuth sign-in

```mermaid
sequenceDiagram
  participant U as User
  participant Login as LoginScreen
  participant SB as SupabaseAuth
  participant Confirm as AuthConfirmRoute
  participant App as ProductRoutes
  U->>Login: Continue Google or Apple
  Login->>SB: signInWithOAuth PKCE
  SB->>U: Provider consent
  SB->>Confirm: redirect code to auth confirm
  Confirm->>SB: exchangeCodeForSession
  Confirm->>App: session cookies then home or onboard
```

## Email sign-in

Login Continue with Email → `signInWithPassword` → same SSR cookie session → home or onboard. Register / forgot-password remain email paths; confirm/recovery reuse `/auth/confirm`.

## Account linking

Prefer Supabase automatic identity linking for same verified email. Authenticated `linkIdentity` for add-provider. No duplicate profiles or memberships. Conflicts fail closed.

## Sign-out and delete

Server-side `signOut` clears cookies; delete-account uses privileged server path only. See Technical Security Specs and stories `ST-E02-006`.
