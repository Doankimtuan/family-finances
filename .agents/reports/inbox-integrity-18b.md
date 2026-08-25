# INBOX 18B — Privacy + Ownership Capability + Loans/Debt Attention Contract

## Verdict

**INBOX INTEGRITY READY**

## Scope completed

- Monetary values in Inbox rows, detail, decision panels, and review summaries now use `FinancialValue` or the shared privacy-aware equivalent. Privacy masking also applies to accessible output.
- Inbox source capabilities are typed as `ACTIONABLE`, `READ_ONLY_NON_OWNER`, `READ_ONLY_FORMER_OWNER`, or `SOURCE_UNAVAILABLE`.
- Active household non-owners can read permitted personal-source items but are shown an owner-required read-only state and receive no financial mutation actions.
- Loan attention supports canonical due-soon/payment-attention and overdue states.
- Debt attention uses the canonical Debt due-state/direction contract; no transaction-sign inference was added.
- Loan/Debt producers use deterministic dedupe identity and transition existing items instead of multiplying them.
- Loan/Debt and `emi_complete` links use `APP_PATH` canonical routes.
- Financial mutations remain owned by Loan/Debt commands/RPCs; Inbox only navigates or dismisses Inbox state.
- Existing Savings, Plan, Transactions, and `emi_complete` behavior remains covered by focused regression tests.

## Validation

- Focused unit/integration tests: **18 files, 108 passed**.
- Changed-file lint: passed.
- Typecheck: passed.
- Production build: passed.
- Focused Inbox browser E2E: **5 passed, 1 skipped**; unauthenticated redirects and authenticated queue chrome passed.
- Controlled remote browser certification passed at **390px VI/light** and **440px EN/dark** with privacy OFF/ON, no raw i18n keys, and no horizontal overflow.
- Full unit suite and repository-wide lint were not run, as required.

## Remote alignment and certification evidence

- The three remote Savings migrations were inspected and fetched under their exact remote versions; no remote versions are missing locally.
- The 18B migration is aligned locally as `20260824022207_inbox_loan_debt_attention_18b.sql`, matching the remote migration record. `supabase db push --dry-run --linked` reports only unrelated local migrations pending before the remote tip; none were applied.
- Remote `public.sync_loan_debt_attention_inbox()` exists with signature `()`, `SECURITY DEFINER`, `authenticated` execute only, and no `anon`/`public` execute grant.
- Remote sync is household-scoped, uses the Inbox producer gateway, and produces deterministic Loan/Debt attention rows.
- Disposable User A/User B fixtures verified personal Loan/Debt owner/read-only behavior, household-owned behavior, repeated-sync dedupe, overdue transition, archive-on-resolution, no recreation after resolution, and denial of User B’s owning Loan/Debt RPC mutations.
- `emi_complete` remains informational and its canonical Loan navigation remains covered by focused regression tests.

## Focused fixture repairs

- Updated only stale Inbox browser copy and back-navigation assertions. No production Inbox UX was changed for those assertions.
