# Phase 2C — Final Verdict

## Summary

| Item                     | Result                                                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active Supabase project  | `family-finances-2` (`bbzffxvgocjwsdbujvgn`), ACTIVE_HEALTHY, PostgreSQL 17.6.1.                                                                                                                                                 |
| F3 investment valuation  | **FIXED IN TEST.** Fresh purchase, price update, partial sales, authenticated replay, portfolio/Home totals, refresh persistence, Account B access, and full liquidation reconciled.                                             |
| F4 missing helper        | **Applied to the verified dev/test project.** Valid RPC and browser creation work; installments persist; malformed input and idempotency checks pass.                                                                            |
| F4 overall status        | **NOT FIXED IN TEST.** A live authenticated RPC accepted a fully balanced zero-interest schedule for a 12% loan. The follow-up fix exists locally only.                                                                          |
| Migration result         | Existing F4 helper migration applied. Remote history version `20261021031855` differs from local source filename version `20261021020424`; reconcile before CLI migration push. The additional policy migration was not applied. |
| Browser E2E              | F3 and F4 happy paths passed at 440px in Chromium with separate Account A and Account B sessions. Screenshots are linked in journey reports.                                                                                     |
| Financial reconciliation | Fresh investment produced VND 12,000,000 proceeds and VND 2,000,000 realized gain; replay credited proceeds once. After cleanup, aggregate cash returned to VND 59,600,000 and no synthetic holdings/loans remained.             |
| Cross-household denial   | BLOCKED: only one household exists in the verified project; no second household was created.                                                                                                                                     |
| Phase 3                  | **Cannot begin.** The direct RPC policy-integrity vulnerability remains active and has not been runtime-verified after remediation.                                                                                              |

## Evidence reports

- [Supabase environment](supabase-environment.md)
- [Migration execution](migration-execution.md)
- [Investment E2E](investment-e2e.md)
- [Loan E2E](loan-e2e.md)
- [RPC security](rpc-security.md)
- [Financial reconciliation](financial-reconciliation.md)
- [Regression results](regression-results.md)

## Required next action

Review and authorize application of the local-only loan schedule policy migration to the same verified dev/test project. Then rerun the accepted zero-interest exploit and valid fixed, reducing, and promotional schedules through authenticated RPC contexts; reconcile the local/remote F4 migration version and verify foreign-household denial when an authorized second-household fixture is available. Do not use this result as production sign-off.
