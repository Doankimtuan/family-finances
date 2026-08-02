# ST-E02-002 — Known Limitations

1. **E2E happy path needs credentials** — Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` to exercise login → `/home` in Playwright. Without them the test skips; Auth reachability is covered via invalid-credentials Alert.
2. **Membership always absent** — `resolveActiveMembership` returns `null` until S2 household schema/onboard. Authenticated users hitting `/money` see the membership gate (fail-closed), not ledger UI.
3. **Register / forgot-password routes** — Linked from login; screens are **ST-E02-003**.
4. **Phone login** — Blueprint mentions email/phone; MVP implements email + password only.
5. **Confirm success UI** — Successful email links redirect straight to home from `app/auth/confirm`; `status=ok` UI is available when redirected with that query.
