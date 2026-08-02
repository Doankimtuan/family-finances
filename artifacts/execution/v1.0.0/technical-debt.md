# Technical Debt

| ID | Item | Severity | Notes |
|----|------|----------|-------|
| TD-AUTH-01 | Settings UI for `linkIdentity` deferred | Low | Command exists; surface missing until Account Security |
| TD-AUTH-02 | Historical duplicate Auth users need support playbook | Medium | Out of S1 app scope; document in ops later |
| TD-ENV-01 | Local port 3000 IPv4 occupied by unrelated Deno webhook | Low | Playwright `baseURL` uses `localhost` to reach Next IPv6 |
| TD-E2E-01 | Password field locators use `#login-password` IDs | Low | Avoid strict-mode clash with “Show password” reveal control |
| TD-DESIGN-01 | Parallel uncommitted branding/theme stream | Medium | Keep separate from auth story freezes; reconcile before S1 close |

## Explicit non-debt

- Empty ledger domain modules — expected until S3+
- No S2 onboard wizard — correctly deferred
