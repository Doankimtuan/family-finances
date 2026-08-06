# Business rule gap

## Product / Constitution rules (must preserve)

| ID | Rule | Accounts implication |
|----|------|----------------------|
| BR-01 | Real ledger ≠ jars / products as bank Balance | Liquid balances use `Balance`; debts/savings/EMI copy `notBankBalance` |
| BR-15 / REQ-018 / AC-018 | Online-only money mutations | Create/edit/archive fail-closed offline |
| REQ-002 / AC-002 | Active household membership | Gate via `assertMoneyActionAllowed` |
| REQ-020 / AC-020 | Partners equal on daily Money | No admin-only account CRUD |
| AC-001 | Real position on Home / Money | Accounts contribute to Real Position only |
| BR-11 / AC-011 | EMI completes when paid ≥ num | Owned by `/money/cards`, not Accounts |

## Legacy rules — preserve (adapted)

| Legacy | New behavior |
|--------|--------------|
| Soft archive hides from lists | `is_archived=true`; list/get skip archived |
| Opening balance ≥ 0 integer | Zod on create; UI AmountField |
| Name required | Zod trim min 1 max 80 (current) |
| Type enum constrained | `ACCOUNT_TYPE_VALUES` / create options |
| Progressive create disclosure | Opening balance after type chosen |

## Legacy rules — discard or do not ship

| Legacy | Why |
|--------|-----|
| `credit_card` account + billing trigger | Conflicts Product SIMPLIFY / D-01 |
| Silent swallow of CC settings insert | Violates “never silent money failure” |
| No credit-limit enforce despite comment | Incomplete; don’t pretend |
| Hardcoded due_day=15 / unused auto_pay | Incomplete productization |
| Opening balance on CC as unused noise | No CC type |
| Archive without confirmation | Blueprint requires destructive Dialog |

## Gaps closed in this MVP

1. ArchiveAccount command (tech spec listed, unimplemented)
2. Edit account (screen blueprint secondary action)
3. Opening balance at create (schema supported, UI omitted)
4. Explicit Cash (liquid) vs Credit/plans IA without inventing CC balances
