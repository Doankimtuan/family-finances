# Migration plan — Accounts MVP

## Slice (this pass)

1. Artifacts under `artifacts/account-evolution/CURRENT/`
2. Application: `archiveAccount`, `updateAccount`, account health helper
3. Shared `AccountCard` pattern
4. Accounts list UX + progressive create + opening balance + plans strip
5. Account detail quick actions + edit + archive confirm
6. EN/VI i18n + unit/e2e
7. Fill `implemented-features.md`

## Data / schema

**No migration.** Use existing `accounts.is_archived`, `opening_balance`, type CHECK without `credit_card`.

## Application mapping

| Tech spec | Implementation |
|-----------|----------------|
| CreateAccount | Existing `createAccount` |
| ArchiveAccount | New `archiveAccount` |
| (Edit — blueprint) | New `updateAccount` (name + type) |
| GetRealPosition / ListAccounts | Existing |

## UI mapping

| Screen | Change |
|--------|--------|
| `money.accounts` | Hero, AccountCard rows, health, plans IA, progressive add |
| `money.account-detail` | Quick actions, edit, archive |
| `money.hub` | Reuse AccountCard for preview rows |

## Deferred (see remaining-roadmap.md)

Transfers; CC billing proposal; restore archived; brokerage create; post-create opening balance edits; Product SoT for cards.
