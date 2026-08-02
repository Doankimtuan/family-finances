# Blockers — sprint-001

## Story selection blockers

**None.** All six S1 stories remain selected and DoR-ready.

## Execution setup blockers (may STOP agents)

| ID | Blocker | Affects | Resolution |
|----|---------|---------|------------|
| B-ENV-01 | Missing or invalid Supabase Auth env (e.g. `NEXT_PUBLIC_SUPABASE_URL`, anon key, and any required server secrets for SSR) | `ST-E02-002`, `ST-E02-003`, `ST-E02-004` | Configure `.env.local` against a Supabase project with Auth enabled; re-run smoke login |
| B-ENV-02 | Auth providers/email not enabled in Supabase project | Register / confirm / forgot flows | Enable Email provider (and confirm redirect URLs) in Supabase dashboard |
| B-ENV-03 | Google OAuth client not configured in Supabase | `ST-E02-004` | Enable Google provider + redirect URLs |
| B-ENV-04 | Apple Sign In not configured in Supabase | `ST-E02-004` | Enable Apple provider (Services ID + key) |
| B-ENV-05 | Automatic identity linking policy unset | `ST-E02-005` | Enable/document Supabase automatic linking for BR-02b |

## Non-blockers (explicit)

| Item | Why not a blocker |
|------|-------------------|
| Empty `supabase/` migrations folder | Hosted Auth session does not require rewrite migrations in S1 |
| Empty domain modules | Expected; auth adapters land in platform/tenancy during E02 |
| Product stubs | Out of S1 scope except gates |
| Missing onboard wizard | Correctly deferred to S2 |

## Policy

If B-ENV-* is active when starting `ST-E02-002`: **STOP**, do not invent mock auth that contradicts Tech Spec, and do not deselect the story.
