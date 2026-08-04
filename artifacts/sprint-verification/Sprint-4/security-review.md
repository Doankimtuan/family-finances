# Security Review — Sprint 4

## AuthN / AuthZ

| Control | Finding |
|---------|---------|
| Ritual page | Session + membership redirect — **PASS** |
| Commands / worker | `assertMoneyActionAllowed` — **PASS** |
| RPC `run_month_ritual_autolock_worker` | Requires `auth.uid()` + household membership — **PASS** for user-scoped |
| `ensure_miscellaneous_jar` / resolve unmapped | `security definer` + `is_household_member` — **PASS** pattern |
| Grant to `authenticated` only | **PASS** |

## Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Security definer jar insert / txn update | Medium | Membership checked; still privileged surface — keep audit |
| Worker only first membership household | Low | Multi-household incomplete |
| Fail-open plan unlock on DB error | **High for money domain** | `assertPlanPeriodUnlocked` returns ok on error |
| Silent catch → empty divergence | Medium | Could allow approve if query fails open |
| No service-role cron identity | Medium | Correct for current design; when cron added must not use end-user JWT |
| Input validation | Correction note Zod — **PASS**; periodMonth regex — **PASS** |
| Sensitive data | Emergency notes in UI — household-scoped OK |

## SQL safety

Parameterized Supabase client queries; RPCs use typed args. No dynamic SQL concatenation observed in Sprint 4 TS.

## Security score

**6.5 / 10**
