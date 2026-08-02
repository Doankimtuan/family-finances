# ST-E02-005 — Ops: Automatic Identity Linking Policy

| Field | Value |
|-------|--------|
| Story | `ST-E02-005` |
| Blocker | `B-ENV-05` |
| Product rule | `BR-02b` — one Auth user per verified email when Supabase linking supports it |
| Recorded | `2026-08-02T07:43:06Z` |

## Decision

1. **Automatic linking (required for BR-02b)**  
   Hosted Supabase Auth **automatically links** identities that share the same **verified** email onto one `auth.users.id`. Product **requires** this behavior. Do not disable automatic linking for the production / staging Auth projects used by ViNha.

2. **Manual linking (for authenticated `linkIdentity`)**  
   Enable **Manual linking** in Supabase Dashboard → Authentication → Providers (or project Auth settings) so authenticated users can add Google/Apple later via `linkIdentity`. Required for the application command shipped in this story; settings UI entry is deferred.

3. **Application rules (immutable for S1)**  
   - Never invent a client-side profile/membership merge across `auth.users` rows.  
   - On linking conflict: fail closed with stable UI codes on `/auth/confirm` (and future settings).  
   - Membership resolution always uses the **session** `auth.users.id` only (S2 household schema).

4. **Operator checklist**  
   - [ ] Confirm Google + Apple providers remain enabled (B-ENV-03 / B-ENV-04)  
   - [ ] Confirm Redirect URLs include `{origin}/auth/confirm`  
   - [ ] Confirm automatic linking remains the project default / enabled  
   - [ ] Enable Manual linking for `linkIdentity`  
   - [ ] Smoke: password user + Google with same verified email resolves to one user id  

## B-ENV-05 status

**Cleared for sprint execution** — policy is recorded and application fail-closed paths exist. Dashboard toggles remain operator-owned (same class as B-ENV-03/04).

## References

- https://supabase.com/docs/guides/auth/auth-identity-linking  
- `artifacts/auth-enhancement/CURRENT/account-linking.md`  
- `artifacts/product-definition/CURRENT/Business-Catalog.md` (`BR-02b`)
