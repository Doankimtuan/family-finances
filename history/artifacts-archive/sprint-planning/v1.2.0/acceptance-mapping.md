# Acceptance Mapping — sprint-001 (Auth Strategy v2)

Maps acceptance criteria to committed S1 stories. Product SoT: `artifacts/product-definition/CURRENT`.  
Implementation Plan matrix: `artifacts/implementation-plan/CURRENT/acceptance-mapping/`.

## AC → Stories

| AC | Requirement | Stories | Scope |
|----|-------------|---------|-------|
| `AC-002` | `REQ-002` | `ST-E02-001`, `ST-E02-002`, `ST-E02-003` | Membership required for money actions (email baseline) |
| `AC-002a` | `REQ-002a` | `ST-E02-004`, `ST-E02-006` | OAuth-first Login (Google + Apple + Email); no guest; session; sign-out/delete lifecycle |
| `AC-002b` | `REQ-002a` | `ST-E02-005` | Same verified email → one Auth user (`BR-02b`); no duplicate profiles |

## Provider → Story / Task

| Capability | Story | Primary tasks |
|------------|-------|---------------|
| Google Login | `ST-E02-004` | `T-E02-004-a`, `T-E02-004-b`, `T-E02-004-c-google`, `T-E02-004-d`, `T-E02-004-e` |
| Apple Login | `ST-E02-004` | `T-E02-004-a`, `T-E02-004-b`, `T-E02-004-c-apple`, `T-E02-004-d`, `T-E02-004-e` |
| Account Linking | `ST-E02-005` | `T-E02-005-a`, `T-E02-005-b`, `T-E02-005-c` |
| Email+password (baseline) | `ST-E02-002`, `ST-E02-003` | (frozen — do not reopen except regression) |

## BR / REQ citation (auth residual)

| Story | REQ | BR | AC |
|-------|-----|----|----|
| `ST-E02-004` | `REQ-002a` | `BR-02b` | `AC-002a` |
| `ST-E02-005` | `REQ-002a` | `BR-02b` | `AC-002b` |
| `ST-E02-006` | `REQ-002a` | `BR-02`, `BR-02b` | `AC-002a` |

## Coverage check

| Criterion | Status |
|-----------|--------|
| Google Login mapped | **PASS** → `ST-E02-004` |
| Apple Login mapped | **PASS** → `ST-E02-004` |
| Account Linking mapped | **PASS** → `ST-E02-005` |
| Unrelated Money/Plan/Inbox/Health ACs unchanged | **PASS** |
| No guest AC | **PASS** (forbidden by `REQ-002a` / `AC-002a`) |
