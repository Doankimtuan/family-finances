# Technical Debt

| ID | Item | Severity | Notes |
|----|------|----------|-------|
| TD-AUTH-01 | `linkIdentity` settings UI still deferred | Low | Command exists |
| TD-AUTH-03 | Delete requires `SUPABASE_SERVICE_ROLE_KEY` | Medium | Ops must set for delete happy path |
| TD-AUTH-04 | No password re-auth before delete | Low | MVP accepts recent session |
| TD-S2-01 | No dedicated S2 sprint-planning pack yet | Medium | Bootstrap from Implementation Plan S2 |
| TD-S3-02 | Auto income still Inbox (not silent split) | Low | Needs jar_plans / movements |
| TD-S3-03 | No jar_movements on Inbox resolve | Medium | Plan epic (S4+) |
| TD-S4-01 | Jar paused state not in schema yet | Medium | Active = !archived until ST-E05-002 |
| TD-ENV-01 | Local IPv4:3000 conflict with unrelated Deno | Low | Playwright uses `localhost` |
| TD-DESIGN-01 | Parallel branding/theme WIP | Medium | Reconcile outside story freezes |
