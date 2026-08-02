# ST-E01-002 — Known Limitations

1. **Welcome UI not implemented** — `/welcome` is a chrome stub (`aria-hidden` empty shell). Full Splash/Welcome content is **ST-E02-001**.
2. **Inbox badge not live** — Placeholder slot exists (`opacity-0`); count/visibility wiring waits for Inbox domain stories.
3. **TopAppBar not in product layout** — Remains page-level via ProductStub (by design).
4. **Splash / login routes** — Not created here; E02 adds remaining auth screens under `(auth)`.
