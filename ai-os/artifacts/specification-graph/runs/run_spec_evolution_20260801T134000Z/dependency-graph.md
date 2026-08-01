# Specification Dependency Graph

**Run:** `run_spec_evolution_20260801T134000Z`

## Edge kind summary

- `specified_by`: 567
- `specifies`: 567
- `cites`: 138
- `cited_by`: 138
- `depends_on`: 19
- `implements_feature`: 18
- `derived_from_feature`: 18
- `related_feature`: 15
- `validates`: 14
- `has_acceptance`: 14
- `implements_rule`: 14
- `derived_from_rule`: 14
- `rule_acceptance`: 11

## Critical dependency chains (sample)

### `br-action-context`
- Requirements: `req-br-action-context`, `req-br-action-context`, `req-br-action-context`, `req-br-action-context`
  - `req-br-action-context` → acceptance: `ac-br-action-context`
  - `req-br-action-context` → acceptance: `ac-br-action-context`
  - `req-br-action-context` → acceptance: `ac-br-action-context`

### `br-amount-positive`
- Requirements: `req-br-amount-positive`, `req-br-amount-positive`, `req-br-amount-positive`, `req-br-amount-positive`
  - `req-br-amount-positive` → acceptance: _missing_
  - `req-br-amount-positive` → acceptance: _missing_
  - `req-br-amount-positive` → acceptance: _missing_

### `br-assumptions-admin`
- Requirements: `req-br-assumptions-admin`, `req-br-assumptions-admin`, `req-br-assumptions-admin`, `req-br-assumptions-admin`
  - `req-br-assumptions-admin` → acceptance: `ac-br-assumptions-admin`
  - `req-br-assumptions-admin` → acceptance: `ac-br-assumptions-admin`
  - `req-br-assumptions-admin` → acceptance: `ac-br-assumptions-admin`

### `br-closed-month`
- Requirements: `req-br-closed-month`, `req-br-closed-month`, `req-br-closed-month`, `req-br-closed-month`
  - `req-br-closed-month` → acceptance: `ac-br-closed-month`
  - `req-br-closed-month` → acceptance: `ac-br-closed-month`
  - `req-br-closed-month` → acceptance: `ac-br-closed-month`

### `br-expense-allocate`
- Requirements: `req-br-expense-allocate`, `req-br-expense-allocate`, `req-br-expense-allocate`, `req-br-expense-allocate`
  - `req-br-expense-allocate` → acceptance: `ac-br-expense-allocate`
  - `req-br-expense-allocate` → acceptance: `ac-br-expense-allocate`
  - `req-br-expense-allocate` → acceptance: `ac-br-expense-allocate`

### `br-income-allocate`
- Requirements: `req-br-income-allocate`, `req-br-income-allocate`, `req-br-income-allocate`, `req-br-income-allocate`
  - `req-br-income-allocate` → acceptance: `ac-br-income-allocate`
  - `req-br-income-allocate` → acceptance: `ac-br-income-allocate`
  - `req-br-income-allocate` → acceptance: `ac-br-income-allocate`

### `br-installment-complete`
- Requirements: `req-br-installment-complete`, `req-br-installment-complete`, `req-br-installment-complete`, `req-br-installment-complete`
  - `req-br-installment-complete` → acceptance: `ac-br-installment-complete`
  - `req-br-installment-complete` → acceptance: `ac-br-installment-complete`
  - `req-br-installment-complete` → acceptance: `ac-br-installment-complete`

### `br-jar-active`
- Requirements: `req-br-jar-active`, `req-br-jar-active`, `req-br-jar-active`, `req-br-jar-active`
  - `req-br-jar-active` → acceptance: `ac-br-jar-active`
  - `req-br-jar-active` → acceptance: `ac-br-jar-active`
  - `req-br-jar-active` → acceptance: `ac-br-jar-active`


## Improvement-ready dependency notes

1. Acceptance coverage is thinner than requirements (14 vs 42) — expand acceptance before claiming implementation complete.
2. API/DB/UI specs should remain attached to requirements when evolving solution architecture.
3. Tasks/implementation nodes must not introduce business rules not present in BD.

## Machine graph

See `graph.json` edges (1547).
