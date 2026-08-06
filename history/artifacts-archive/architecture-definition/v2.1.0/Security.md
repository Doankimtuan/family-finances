---
document: Security
architecture_version: v2.1.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Security

- SSR session refresh via proxy (`getClaims`) for Google, Apple, and email sessions  
- Supabase OAuth PKCE callback at `/auth/confirm`; IdP secrets only in Supabase dashboard  
- Account linking (`BR-02b`): one Auth user per verified email when supported; no duplicate profiles  
- No guest mode  
- Sign-out and delete-account via server adapters only; service role never on client  
- RLS on all tenant tables  
- Admin gates audited  
- CSP + scoped rate limits (Decision Board security mods)  
- PII redaction in logs  
- Service role restricted to platform jobs  
