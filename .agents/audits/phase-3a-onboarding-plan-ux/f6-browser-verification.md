# F6 — Browser verification

## Environment and scenarios

Checks used the authorized disposable `Together 20A` household in the verified testing project and isolated owner/partner sessions. Current period was October 2026; a test-only local fetch hook supplied November 2026 to verify the reporting-month boundary without changing database data or the system clock.

- New household state: three starter Jars, no monthly rules, zero cash, zero transactions. Plan showed a setup message and setup action, not “Unavailable.” The action opened the existing Jar-plan setup route.
- Configured state: saved three monthly Jar intentions through the app. Plan showed VND 3,000,000 planned, VND 0 spent, and VND 3,000,000 remaining.
- Zero-income month: Plan income was “Not set”; no artificial income appeared.
- Refresh and sharing: configured values persisted after refresh and were visible to Account B.
- New reporting month: owner and partner both saw November 2026 and the expected VND 3,000,000 / 0 / VND 3,000,000 values.
- Empty active-Jar state: archived the disposable household’s starter Jars using the app. Plan showed the existing no-Jars state with a create action and no “Unavailable” text.
- Data failure: a test-only local fetch hook returned HTTP 500 for the plan budget RPC. Plan showed a distinct error with a retry action, not the unconfigured message. Retry reloaded and remained in the error state while the hook was active.

No cash, ledger, or reporting data was changed to create the new-month or failure conditions. The error hook was confined to the temporary local test server and removed after the run.

## Responsive, accessibility, and screenshots

The unconfigured state was checked at 390px. Read-error state was checked at 390×844, 440×900, 768×1024, and 1280×900 with no horizontal overflow. Dark theme, reduced motion, and keyboard access to retry were checked at 390px. Page errors were zero.

Screenshots in `evidence/`:

- Unconfigured: `f6-plan-not-configured-390.png`
- Configured, zero spend: `f6-plan-configured-zero-spend-390.png`
- Owner and partner configured view: `f6-owner-configured-plan-440.png`, `f6-partner-configured-plan-440.png`
- No active Jars: `f6-no-active-jars-390.png`
- Read failure: `f6-read-error-390x844.png`, `f6-read-error-440x900.png`, `f6-read-error-768x1024.png`, `f6-read-error-1280x900.png`, `f6-read-error-dark-reduced-motion-390.png`
- New reporting month: `f6-new-reporting-month-owner-390.png`, `f6-new-reporting-month-partner-440.png`

## Limits

The empty-Jar case was produced by archiving the fixture’s three starter Jars, which exercises the no-active-Jars branch. A separate pristine household created with zero Jar rows was not created. The route to Jar setup was exercised; persistence was verified for actual monthly-plan changes through the app. Browser failure was induced by a test-only RPC response hook rather than a live Supabase outage.
