# Technical Debt

| ID | Item | Severity | Notes |
|----|------|----------|-------|
| TD-AUTH-01 | `linkIdentity` settings UI still deferred | Low | Command exists |
| TD-AUTH-03 | Delete requires `SUPABASE_SERVICE_ROLE_KEY` | Medium | Ops must set for delete happy path |
| TD-AUTH-04 | No password re-auth before delete | Low | MVP accepts recent session |
| TD-S2-01 | No dedicated S2 sprint-planning pack yet | Medium | Bootstrap from Implementation Plan S2 |
| TD-S2-02 | Household schema / migrations may be empty | High | Likely prerequisite inside ST-E03-001 |
| TD-ENV-01 | Local IPv4:3000 conflict with unrelated Deno | Low | Playwright uses `localhost` |
| TD-DESIGN-01 | Parallel branding/theme WIP | Medium | Reconcile outside story freezes |
