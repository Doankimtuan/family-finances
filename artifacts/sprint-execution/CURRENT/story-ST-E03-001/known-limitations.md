# ST-E03-001 — Known Limitations

1. **Join-by-invite** is deferred to `ST-E03-002` — wizard creates household only.
2. **MoneyMembershipGate** retained in codebase but money now redirects to onboard; gate unused until a non-redirect fail-closed surface is needed again.
3. **E2E happy-path finish** (create household end-to-end) requires a credentialed user without membership; chrome/step smoke is env-gated.
4. **Plan jars** are seed rows only — Plan product surfaces remain stubs until later epics.
