# RELEASE 22D — Development Database Clean Replay + Bootstrap

Date: 2026-08-25  
Verdict: **DEVELOPMENT TRIAL READY**

## Project identity

- Supabase project: `family-finances-2`
- Project ref: `bbzffxvgocjwsdbujvgn`
- Region: `ap-southeast-2`
- Environment guard: passed with explicit development confirmation
- Production: not created, modified, or deployed

## Reset and replay

The linked development database was reset by dropping and recreating the `public` schema and clearing migration tracking, then replaying with `supabase db push --linked`. This was performed only after the reusable guard in `scripts/assert-development-supabase.mjs` passed.

Final replay result:

- Migration head: `20260824233500`
- Applied migrations: 131
- Migration freeze manifest: valid
- `supabase db push --linked --dry-run`: remote database up to date
- `git diff --check`: passed

The original source chain was not clean-replayable as-is. The first failure was `20260804155013_loan_interest_strategies.sql`, which required the missing `loans.first_payment_date` prerequisite. Subsequent failures exposed missing prerequisites for loan schedules, loan amortization columns, savings tables, savings renewal compatibility, and function-signature bridges. Two frozen savings migrations also contained invalid SQL and required direct source repair before replay. These were classified as B/C/E/F replay issues; the missing prerequisites and compatibility bridges are represented by new forward migrations where possible.

## Database and security baseline

- Public tables: 58
- RLS-enabled tables: 58/58
- SECURITY DEFINER functions: 104
- SECURITY DEFINER functions without pinned `search_path`: 0
- Anonymous/public executable function allowlist: `get_invitation_preview`
- `market_sync_locks` and `market_sync_runs`: service-only by design
- Extensions verified: `pgcrypto`, `pg_cron`, `pg_net`
- Cron: only `month_ritual_autolock_daily` (`0 1 * * *`); no market cron
- Vault secret names: empty

Supabase advisor notices remain for intentional authenticated SECURITY DEFINER RPC exposure, service-only market tables without user policies, and the project Auth leaked-password-protection setting. These are recorded baseline/configuration follow-ups, not anonymous mutation access or migration drift.

## Bootstrap and market data

Fresh application bootstrap was completed through normal onboarding. The retained development household is `22D E2E Home`; disposable ownership-harness state was cleaned up. Deterministic E2E fixture seeding succeeded without committed credentials or synthetic financial history.

Reference state:

- Categories: 8
- System saving providers: 1
- Active saving packages: 6
- Market instruments: 3,672
- Market instrument sources: 3,672
- Market sync runs: 3
- Orphan market sources/prices: 0/0
- FX table: present; no FX rows were required by the sync

The canonical development market sync route completed successfully for CoinGecko, VNStock, and FMarket. No provider secrets were committed or printed. The local trial server used a temporary development-only route secret; scheduled production market sync remains disabled.

## Application and browser smoke

- Full release E2E flow: 11/11 passed in the complete run
- Together/ownership authenticated flow: 1/1 passed
- Browser coverage: 390, 440, 768, and 1280px; light/dark, Vietnamese/English, privacy, reduced motion, invite/member lifecycle, and catalog-picker checks exercised
- Investment flow reached the synced instrument selector with no visible error
- Unit suite: 158 files, 1,113 tests passed
- Lint: passed
- Typecheck: passed
- Production build: passed

The fresh flow covered onboarding, accounts, income/expense/transfer, savings, investments, loans/debt, goals/plan, Inbox, Together ownership, and privacy behavior. The ownership harness cleanup passed and left no disposable household behind.

A later release-E2E rerun encountered an existing duplicate `transactions-add` test-id selector before the remaining tests ran; the complete 11-test run passed before the final ACL-only replay. This is a test-selector flake, not a database or catalog failure.

## Remaining 22B/source follow-up

- The migration freeze manifest now reflects the reproducible 131-migration chain.
- The repaired frozen SQL and newly added prerequisite/bridge migrations should be reviewed as the canonical source cleanup for the next release cycle.
- Auth leaked-password protection and the local `MARKET_CATALOG_SYNC_SECRET` deployment naming/configuration remain operational follow-ups.

22D certifies the development environment for internal trial use only. Production provisioning, production Auth, backups, monitoring, domains, credential rotation/history cleanup, and production Supabase remain outside this release.
