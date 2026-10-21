# Phase 2C — Supabase Environment

**Run date:** 2026-10-21  
**Status:** PASS for target verification and scoped test authorization.

## Target and boundary

| Check             | Expected                                     | Observed                                                                                                                                                                                                                                    | Result |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Connected project | `family-finances-2` / `bbzffxvgocjwsdbujvgn` | Supabase MCP returned that exact project, `ACTIVE_HEALTHY`, AP southeast region, PostgreSQL 17.6.1.                                                                                                                                         | PASS   |
| Local app target  | Same dev/test project                        | `.env.local` points at the same project ref. The local app was served at `http://localhost:3100`.                                                                                                                                           | PASS   |
| Test identities   | Two existing test users                      | Two existing `@family-finances.test` identities in the authorized household were used in separate browser contexts. No user or household was created.                                                                                       | PASS   |
| Data boundary     | Test household only                          | One household, three accounts, eleven original transactions, and one existing FPT holding were present before the fresh fixture. The owner explicitly designated this project for development/testing and authorized scoped synthetic data. | PASS   |

The original FPT holding was read-only during the first verification pass. A separate run-marked synthetic holding was created through the application, exercised, and removed by its exact ID. The existing holding and its linked sale were retained.

The browser sign-out route was called for both test identities. A final read-only MCP query found zero sessions created for those identities in the preceding ten minutes. No credentials, tokens, or magic-link values are included in these reports.

## Evidence

- Supabase MCP `get_project`, `list_migrations`, and targeted SQL catalog checks.
- Browser evidence under [`evidence/`](evidence/).
- Final database inventory: zero Phase 2C synthetic holdings, zero loans, zero schedule entries; original FPT holding remains. Aggregate liquid account balances returned to VND 59,600,000.

## Remaining boundary

The project contains only one household, so a real foreign-household denial check could not be run without creating another tenant. Account B is a distinct existing user in the same household; shared access was verified in the browser.
