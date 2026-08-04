# Executive Summary — Sprint 1 Verification

**Verdict: 🟡 APPROVED WITH REQUIRED FIXES**

Sprint 1 delivered the **core schema and happy-path application contracts** for Category↔Jar mapping, structured refunds, and 3-way corrections. The new RPCs (`create_category`, `refund_transaction`, `correct_transaction`), policies, constants, UI routes, and unit suites are real and directionally aligned with Spec v2.1.

The sprint is **not Spec-complete** and must **not** be treated as frozen-done for Sprint 2 start.

## Why not APPROVED

1. **BR-02 / BR-03 immutability is incomplete.** Legacy `update_transaction` still mutates posted rows in place and remains UI-reachable as “Legacy edit.” Hard-delete blocking alone does not satisfy immutability.
2. **Refund financial meaning is incomplete.** Refunds (and correction reversals) are posted as ordinary `type='income'` with no income-exclusion flag/filter. Story value and Business Evolution refund lifecycle require exclusion from monthly income while restoring jar capacity.
3. **Story DoD testing gate failed.** ACs are covered by policy unit tests and **mocked** RPC mapping only — not live DB integration or E2E as required by `definition-of-done.md` / testing strategy Tier 2–3.
4. **Sprint DoD staging gate unmet.** Migration exists in repo but was not applied/verified in this session (`known-issues.md`).

## What is solid

| Area | Assessment |
|------|------------|
| AC-CAT-01 create-without-jar blocked | Schema + UI + RPC reject path present |
| AC-TRN-01 linkage + partial/full status | RPC + policy math present |
| AC-TRN-02 three-leg chain | Atomic SQL present |
| Constants / no-magic-strings (app TS) | Strong |
| BR-24 Health-RO regression | None introduced |
| Unit suite green | 194/194 pass (re-verified) |

## Sprint readiness

| Question | Answer |
|----------|--------|
| Can Sprint 2 start now? | **No** |
| Must Sprint 1 be reopened? | **Yes — for required fixes only** (not full redesign) |
| Overall score | **6.2 / 10** |

See [blocking-issues.md](./blocking-issues.md) and [final-verdict.md](./final-verdict.md).
