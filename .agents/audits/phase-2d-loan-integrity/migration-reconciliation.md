# Phase 2D — Migration reconciliation

**Status: PASS**

## Target and migration application

Supabase project family-finances-2, ref bbzffxvgocjwsdbujvgn, was verified as the authorized development/testing target. The reviewed loan-policy migration was applied once through Supabase MCP. Remote history records `20261021040820 loan_schedule_policy_validation`. No unrelated migration, remote repair, database reset, or production deployment was run.

The policy migration replaces two functions only. It contains no table, schema, or financial-row DDL. Its local source SHA-256 is `f1b1320f23df2a4b5e00ca10e6a0dd74c5d983c5c35d979357c41f9d87380398`. The installed schedule and rate-period function body MD5 values match the source bodies: `7b0f484eeda3e9d63d5024a3f2d6304b` and `215651accae85ce1811614a85bd9d2d9`.

## History drift and resolution

The initial local/remote comparison found three version-only mismatches, each with the same migration name and exact source identity:

| Migration                       | Previous local version | Remote version | Identity evidence                                                                                                                                                      |
| ------------------------------- | ---------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transaction_detail_rows         | 20261007033708         | 20261007061514 | Source SHA-256 `dd5263025683a4ba5197553ab039e156c85f0d1fa065372beacb23954a1a415e`; installed function body was already recorded as matching in the Phase 9 checkpoint. |
| loan_insert_schedule_entries    | 20261021020424         | 20261021031855 | Source SHA-256 `928548166cd06eaf444e79cddd0dfd7528024c219468f2edbb1725eed593c378`; pre-remediation installed body MD5 `dcb8d5b408a14420f0ded24813b4a433`.              |
| loan_schedule_policy_validation | 20261021033728         | 20261021040820 | Exact two installed function-body MD5 values above; the migration was applied from this source.                                                                        |

Because each mapping was backed by exact migration/function identity, only the three local filenames were aligned to their recorded remote versions. The transaction migration test path was updated accordingly. No SQL content changed during this reconciliation, and no remote history was rewritten. Local and remote catalogs now match exactly: 33 entries each, zero local-only or remote-only versions. The repository validator reports 32 forward migrations after the single baseline.

The repository now contains [transaction_detail_rows](../../../supabase/migrations/20261007061514_transaction_detail_rows.sql), [loan_insert_schedule_entries](../../../supabase/migrations/20261021031855_loan_insert_schedule_entries.sql), and [loan_schedule_policy_validation](../../../supabase/migrations/20261021040820_loan_schedule_policy_validation.sql) under their applied remote versions.

## Function security after application

| Function                                           | Owner    | Security mode | Search path | Authenticated / anon / service-role execute |
| -------------------------------------------------- | -------- | ------------- | ----------- | ------------------------------------------- |
| _loan_insert_schedule_entries(uuid, uuid, jsonb)   | postgres | invoker       | public      | no / no / no                                |
| _loan_insert_rate_periods(uuid, uuid, jsonb, uuid) | postgres | definer       | public      | no / no / no                                |
| create_loan_with_schedule(...)                     | postgres | definer       | public      | yes / no / no                               |

The internal helpers are postgres-only. The public wrapper retains its existing authenticated grant. No public or anon execution grant was introduced.

## Safe future CLI operation

The local version/name list now matches the remote list, so a linked CLI push should see no applied migration as pending. Before a future push, verify the linked ref is the intended project, run the migration list comparison, and inspect `supabase db push --dry-run`. Then apply only the expected reviewed forward migrations. Do not use migration repair to paper over this drift. The installed Supabase CLI was 2.20.5, older than the current project tooling notice; upgrade it before relying on CLI behavior. No CLI push was run in this audit.
