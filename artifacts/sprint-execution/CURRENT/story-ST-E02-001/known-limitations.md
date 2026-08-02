# ST-E02-001 — Known Limitations

1. **Login / Register screens not built** — CTAs navigate to `/login` and `/register` (ST-E02-002 / ST-E02-003); those routes 404 until those stories.
2. **Onboard wizard not used** — Authenticated splash exit is `/home` (S2 owns onboard).
3. **Membership / money gates** — Deferred to ST-E02-002 (AC-002 fail-closed).
4. **Splash brand moment is brief** — Redirect follows session resolve; no artificial delay.
5. **Welcome title** — Uses blueprint Primary Question (“Why join?”); body reuses SoT `common.tagline`.
