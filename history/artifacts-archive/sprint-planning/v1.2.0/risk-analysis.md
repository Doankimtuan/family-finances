# Risk Analysis — sprint-001

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-01 | HeroUI v3 / token drift vs Design System | Medium | Medium | Use only `shared/ui` wrappers; verify tokens in E01-001; no page-level redesign |
| R-02 | Missing Supabase Auth env keys | Medium | High (blocks E02) | Document in blockers; agents STOP; configure `.env.local` before E02-002 |
| R-03 | AC-002 membership vs S2 onboard scope creep | High (temptation) | High | Fail-closed stub only; **no** onboard wizard in S1; cite `ST-E03-001` as S2 |
| R-04 | Landing still routes to `/home` bypassing auth | Medium | High | Explicit T-E02-001-d; demo script starts at Welcome |
| R-05 | BottomNav shown on auth screens | Medium | Medium | Auth layout verify in E01-002 before E02 screens |
| R-06 | Empty `auth.json` → hardcoded strings | Medium | Medium | i18n hard dependency; fill catalogs in same story as UI |
| R-07 | Agents rebuild E01 shell instead of verify | Medium | Waste / churn | Mode = verify_gap_close; cite bootstrap evidence |
| R-08 | Inventing `supabase/migrations` for Auth session | Low | Noise | Hosted Auth; no custom migrations required for email/password session |
| R-09 | Parallel multi-story AI work | Medium | Integration breakage | Contract: one story at a time |
| R-10 | Locale routing regressions while adding auth routes | Low | Medium | Keep `app/[locale]` + next-intl patterns from Localization pack |
| R-11 | Google/Apple dashboard misconfiguration | Medium | High | B-ENV-03/04; STOP; do not fake OAuth |
| R-12 | Duplicate Auth users when linking off | Medium | High | BR-02b; enable automatic linking; conflict UX in ST-E02-005 |
| R-13 | Shipping Google without Apple (or reverse) | Medium | Medium | ST-E02-004 DoD requires **both** providers |

## Residual uncertainty

- Exact membership query shape for fail-closed gate depends on Architecture/Tech Spec tenancy tables — implement the **smallest** fail-closed check that blocks money mutations without inventing onboard UX. If schema is absent, block all money mutations until membership can be proven (fail-closed).
- Apple Hide My Email vs prior password email may not auto-link — surface conflict; do not invent merge.
