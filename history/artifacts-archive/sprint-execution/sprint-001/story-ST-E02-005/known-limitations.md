# ST-E02-005 — Known Limitations

1. **Dashboard still operator-owned** — Automatic + manual linking toggles cannot be flipped from the app. Ops checklist in `ops-linking-policy.md`.
2. **Settings UI deferred** — Authenticated “link Google/Apple” entry awaits an Account / Security surface (post-S1 or with Together settings). Application `linkIdentity` is ready.
3. **Historical duplicates** — Two Auth users already created for the same email before linking was correct require support remediation; app does not silent-merge household data.
4. **Apple Hide My Email** — Distinct relay emails are treated as distinct identities (`email_mismatch` guidance); no automatic claim flow in S1.
5. **IdP happy-path linking e2e** — Real Google↔password same-email merge remains a manual / env-gated checklist (same class as OAuth IdP e2e).
6. **Sign-out / delete** — **ST-E02-006**.
