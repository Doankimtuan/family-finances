# V1 Critical-Flow Stabilization — Prompt 15C

Date: 2026-08-19

## 1. Executive summary

Prompt 15C is complete for the curated V1 critical-flow gate. A bounded, deterministic authenticated release suite covers the representative V1 journeys and finishes with 11/11 critical tests passing. The suite uses the dedicated A/B ownership identities and an isolated household created by the existing ownership harness; it does not use the invalid generic E2E identity or developer credentials.

The Savings runtime no longer calls a missing deployed RPC. Two focused migrations were required: the still-used legacy Savings metadata backfill and a missing internal interest helper referenced by the deployed maturity detector. Both are deployed and migration-aligned.

## 2. Original P1 failures

| Finding                                                   | 15C result                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| P1-002 — missing `backfill_legacy_savings_accounts(uuid)` | CLOSED; compatibility operation is still required and was restored securely |
| P1-003 — invalid generic E2E identity                     | CLOSED/SUPERSEDED by deterministic A/B fixture                              |
| P1-004 — authenticated smoke failures                     | CLOSED for V1 critical journeys                                             |
| P1-005 — Together role-transfer → leave                   | CLOSED; current lifecycle passes                                            |
| P1-006 — dependency advisories                            | REMAINS OPEN for a dedicated dependency prompt                              |

The old 15A failures were not treated as current contracts without reproduction. Several were stale selector, route, copy, or fixture assumptions.

## 3. Deterministic E2E fixture

The release suite is `tests/e2e/v1-critical-flow.release.spec.ts`, runnable with:

```sh
set -a; source .env.local; set +a
E2E_PORT=3152 npm run test:e2e:release
```

Required environment:

- `OWNERSHIP_TEST_A_EMAIL`
- `OWNERSHIP_TEST_A_PASSWORD`
- `OWNERSHIP_TEST_B_EMAIL`
- `OWNERSHIP_TEST_B_PASSWORD`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

The fixture fails preflight when these values are absent. Setup and cleanup reuse `scripts/ownership-test-harness.mjs`, create the controlled household/resources, and remove the exact household after the run while retaining the dedicated Auth users. Browser actions authenticate through normal password sessions; service role is used only for fixture provisioning and cleanup.

## 4. Savings compatibility decision

The runtime caller remains `syncSavingsLifecycleAction`, which invokes the backfill before maturity detection. The old migration still contains the compatibility operation, and the configured development project still contained an active legacy `savings_accounts` row. Current `savings`/`saving_cycles` rows carry the legacy source marker, so the operation is a metadata-only strangler and is still required for existing data.

Decision: implement the secure compatibility RPC, not remove the call. Migration `20260818144751_savings_legacy_backfill_restore_15c.sql` restores the operation with authenticated execution, `auth.uid()` validation, household membership validation, pinned `search_path`, and no anonymous execution.

During verification, the deployed maturity detector also exposed a missing internal `savings_simple_interest(numeric,numeric,integer)` helper. Migration `20260818153357_savings_interest_helper_restore_15c.sql` restores that immutable helper and keeps it non-callable by clients. The lifecycle action now returns a typed backfill error instead of reporting success when compatibility work fails; unit coverage verifies detection is not attempted after that failure.

## 5. Money/account flow

PASS. The release smoke authenticates, reaches Home, opens Money, creates a Checking account using the current HeroUI control contract, verifies the receipt, and opens the account detail. It uses the controlled household default account and checks the current navigation/detail surface.

## 6. Transaction flow

PASS. The suite records an expense and an income against the controlled cash account, verifies receipts, revisits transaction history, and finds both entries. The account balance is updated by the product transaction path; no duplicate submissions or duplicate `money-transactions` IDs were observed.

## 7. Transfer flow

PASS. The current entry path is `/money/transactions/new` via the Money add route, not a separate legacy transfer route. The suite selects source and destination accounts, confirms the amount, verifies the neutral transfer receipt, and checks the current “not income” contract. The existing transfer RPC/ledger path remains covered by unit tests.

## 8. Savings flow

PASS. The browser flow creates a saving, funds it from the controlled cash account, uses a separate payout account required by the current domain rules, verifies the saving detail route/list row, and opens cycle facts. Lifecycle synchronization runs once per mount in development, preventing duplicate concurrent server actions. No `PGRST202`, missing-function, or swallowed compatibility error occurred in the final run.

## 9. Investment flow

PASS. The deterministic opening holding is visible, opens to detail, and shows the quantity-based V1 contract. The current model is quantity × unit price; the smoke follows that model and does not use the stale total-price-as-unit-price expectation.

## 10. Loan/debt flow

PASS. The deterministic loan and liability fixtures are visible in their current list surfaces, and both representative rows open their current detail pages.

## 11. Goal/Plan flow

PASS. Plan opens, Goals opens, and the deterministic goal card opens its current detail surface. No old route or removed control is used.

## 12. Health flow

PASS. Health renders with deterministic asset/liability/personal-resource coverage, opens Insights, and renders the insight and scenario lists. The critical balance selector is unique.

## 13. Inbox flow

PASS. Setup creates an Admin-owned `unmapped_expense` fixture with a known title. The smoke selects that exact item, verifies the current decision panel and current action copy, resolves it to the controlled jar, and verifies the terminal receipt. It does not restore pre-13A read/unread or deprecated terminology.

## 14. Together role-transfer/leave

PASS. The certified A/B lifecycle was rerun successfully. The test now targets the Partner row semantically by dedicated email, uses bounded waits for the existing server-action navigation/convergence, verifies two Admin badges, and confirms that the former Admin can leave. The lifecycle ends with A outside the household and B as the active Admin. A stale hidden-text account selector in the existing fixture was also replaced with a semantic account-link selector.

## 15. Test-ID/selector fixes

The release suite asserts unique DOM counts for `ledger-balance`, `money-transactions`, and `money-savings`; all passed. Repeated rows use scoped prefixes and semantic row/link selectors. Stale assumptions were updated to the current product contract: HeroUI account type selection, the current transaction transfer route, current Savings detail navigation, quantity-based investment wording, current Inbox copy, and current Together membership rows.

The release suite contains no conditional skips. Historical optional specs may still skip when they require fixtures that are not part of the bounded release contract.

## 16. Browser console/server errors

PASS for positive critical journeys. The release suite captures `console.error`, `pageerror`, and failed network requests, excluding only normal `net::ERR_ABORTED` navigation cancellation. Final clean-server release execution captured zero such errors. The repeated `NO_COLOR`/`FORCE_COLOR` messages were Playwright web-server process warnings, not application browser or server failures.

## 17. Release smoke results

| Journey                       | Browser | DB/RPC | Result |
| ----------------------------- | ------- | ------ | ------ |
| First-time household / Home   | PASS    | PASS   | PASS   |
| Household Money / account     | PASS    | PASS   | PASS   |
| Personal Money / transactions | PASS    | PASS   | PASS   |
| Transfer                      | PASS    | PASS   | PASS   |
| Savings                       | PASS    | PASS   | PASS   |
| Investment                    | PASS    | PASS   | PASS   |
| Loan/debt                     | PASS    | PASS   | PASS   |
| Goal                          | PASS    | PASS   | PASS   |
| Plan                          | PASS    | PASS   | PASS   |
| Health                        | PASS    | PASS   | PASS   |
| Inbox                         | PASS    | PASS   | PASS   |
| Together / personal ownership | PASS    | PASS   | PASS   |

Final curated release smoke: **11 passed, 0 failed, 0 skipped**.

Responsive checks covered the materially exercised Savings surface at 390, 440, 768, and 1280px, with no horizontal overflow.

## 18. Broader E2E classification

The broader existing Playwright run was executed once with 4 workers, but it was not a valid product classification run: the shared Next development server began returning HTTP 500 responses with `SyntaxError: Unexpected non-whitespace character after JSON at position 6755` under parallel load. The final result was **2 passed, 82 failed, and 28 did not run** across 112 tests; the failures were downstream page/auth/selector failures after the server corruption, and the release spec was among the tests blocked by that server state. A clean-server rerun of the bounded release suite passed 11/11, and the focused Together lifecycle passed twice after harness reset.

Classification: the 82 historical failures are **test-run infrastructure/inconclusive**, not accepted as product regressions or stale-contract closures. The optional/historical skip policy remains outside the release gate; the shared parallel Next dev-server failure is separate release-test harness debt.

The old generic identity finding is superseded: historical specs that still depend on optional fixtures are not the release gate; the release gate uses the dedicated fixture and fails preflight instead of silently skipping.

## 19. Security regression

PASS. The focused regression set passed 206 tests, including RPC ACL hardening, ownership RLS/RPC/schema/manifest tests, Together lifecycle tests, and Inbox decisions. The full unit suite passed 901 tests across 120 files.

Remote verification confirmed:

- `backfill_legacy_savings_accounts(uuid)`: anon execution false, authenticated execution true;
- `detect_matured_savings(uuid)`: anon execution false, authenticated execution true;
- `change_household_member_role(uuid,text)` and `leave_household()`: anon execution false, authenticated execution true;
- `savings_simple_interest(numeric,numeric,integer)`: anon and authenticated execution false;
- unintended anonymous SECURITY DEFINER functions: 0;
- intentional anonymous invitation-preview SECURITY DEFINER function: 1.

P0-001 remains CLOSED. RPC security remains READY. The protected RPC manifest remains COMPLETE. Trigger bypass remains NONE.

## 20. Migration/deployment status

Both focused Savings migrations were applied to the configured development project. `supabase migration list` reports local and remote alignment through `20260818160000`, including both 15C migrations and the 15B ACL migration. `supabase db push --linked --dry-run` reports the remote database is up to date.

No repair migration was added for browser-only test problems. No dependency upgrade was performed.

## 21. Remaining P1/P2 debt

- P1-006 dependency advisories remain open for a separate dependency/release-hardening prompt.
- The broader parallel Playwright run is inconclusive until the shared Next dev-server/worker setup is isolated or run serially; it is not a V1 critical-flow failure.
- Historical E2E skips remain outside the release-critical contract and should be retired or reclassified when their features become V1 scope.
- Repository-wide `npm run format:check` remains red on the pre-existing 2,206-file formatting backlog; no unrelated formatting was changed for 15C.
- Existing generated Together screenshots changed during browser verification; they are evidence artifacts, not product behavior changes.

## 22. V1 critical-flow readiness

**READY for the stabilized V1 critical-flow gate.** All required critical journeys pass with deterministic Auth identities, controlled state, clean positive browser diagnostics, and preserved 15B security gates.

## 23. Recommended next prompt

Prompt 16: dependency and release hardening. Review the deferred Next.js/PostCSS/sharp/nanoid advisories one dependency family at a time, run the green 15C release smoke before and after each upgrade, and retain the current migration/security gates.
