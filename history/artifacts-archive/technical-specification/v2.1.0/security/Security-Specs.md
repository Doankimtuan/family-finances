---
document: Security Specs
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

# Security Specs

- Supabase SSR auth + proxy refresh (`getClaims`) for Google, Apple, and email sessions  
- Google + Apple OAuth via Supabase (PKCE); IdP secrets only in Supabase dashboard  
- OAuth / email confirm / recovery callback: `/auth/confirm` (`exchangeCodeForSession` / OTP)  
- Account linking (`BR-02b` / `REQ-002a`): same verified email → one `auth.users.id` when supported; no duplicate profiles  
- No guest mode  
- Sign-out + delete-account via server adapters; service role never on client  
- RLS membership  
- Admin gates + audit  
- CSP + scoped rate limits  
- PII redaction in logs  
- No offline writes  
- AI cannot mutate without explicit command (Phase 2)  
