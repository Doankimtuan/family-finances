# Validation Report Template

Worker type: **`validation-report`** (not `gate-validation-report`).

## Required kinds

summary, critical, high, medium, low, recommended-fix, decision

## PASS/FAIL

`decision` = **FAIL** if any merged finding has `result=fail` and `severity=critical`; else **PASS**.
