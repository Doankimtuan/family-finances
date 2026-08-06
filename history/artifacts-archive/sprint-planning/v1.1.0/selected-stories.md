# Selected Stories — sprint-001

## Committed set

Exactly the Implementation Plan S1 committed stories (`artifacts/implementation-plan/CURRENT/sprints/S1.md`).

| ID | Epic | Title | Priority | Mode | Repo status |
|----|------|-------|----------|------|-------------|
| `ST-E01-001` | E01 | Bootstrap AppViewport shell and theme tokens | P0 | **verify_gap_close** | Largely shipped in Sprint 0 |
| `ST-E01-002` | E01 | Implement BottomNavigation and TopAppBar patterns | P0 | **verify_gap_close** | Patterns exist; locale-aware |
| `ST-E01-003` | E01 | Shared ui primitive wrappers over HeroUI | P0 | **verify_gap_close** | Wrappers exist; may need auth-form gaps |
| `ST-E02-001` | E02 | Splash and Welcome screens | P0 | **full_implement** | Baseline |
| `ST-E02-002` | E02 | Login and session establishment | P0 | **full_implement** | Baseline |
| `ST-E02-003` | E02 | Register and forgot password | P1 | **full_implement** | Baseline |
| `ST-E02-004` | E02 | OAuth login (Google + Apple) | P0 | **full_implement** | Auth Strategy v2 |
| `ST-E02-005` | E02 | Identity linking + conflict UX | P0 | **full_implement** | Auth Strategy v2 |
| `ST-E02-006` | E02 | Sign-out + delete account | P1 | **full_implement** | Auth Strategy v2 |

## Story detail refs (SoT)

- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E01-001.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E01-002.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E01-003.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E02-001.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E02-002.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E02-003.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E02-004.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E02-005.md`
- `artifacts/implementation-plan/CURRENT/stories/detail/ST-E02-006.md`

## Screen Blueprint refs (E02)

| Story | Screens |
|-------|---------|
| `ST-E02-001` | `artifacts/screen-blueprints/CURRENT/authentication/splash.md`, `welcome.md` |
| `ST-E02-002` | `login.md`, `confirm.md`; flow `user-flows/flow.auth-onboard-home.md` |
| `ST-E02-003` | `register.md`, `forgot-password.md` |
| `ST-E02-004` | `login.md` (OAuth-first), `confirm.md` |
| `ST-E02-005` | `login.md`, `confirm.md` (conflict UX) |
| `ST-E02-006` | sign-out / delete adapters |

## Product refs (E02 session)

| Ref | Path / note |
|-----|-------------|
| `REQ-002` | Authenticated active household membership required for money actions |
| `REQ-002a` | Google / Apple / email+password; no guest |
| `AC-002`, `AC-002a`, `AC-002b` | `artifacts/product-definition/CURRENT/Official-Acceptance-Criteria.md` |
| `BR-02`, `BR-02a`, `BR-02b` | Auth + membership; RLS; single account per verified email |

### Scoped interpretation for S1 (not inventing S2)

- Establish Supabase Auth **session** in S1.
- For money actions / money write paths: **fail-closed** if no active membership (block mutation; redirect away). Do **not** build onboard wizard (`ST-E03-001` = S2).
- No custom ledger schema required for email/password Auth; hosted Supabase Auth is sufficient for session.

## Excluded (not selected)

| Item | Why |
|------|-----|
| All S2–S6 stories | Wrong sprint; dependencies unsatisfied |
| E09 / Phase 2 | Explicitly out of MVP S1–S6 |
| Money/Plan/Inbox domain | S3–S5 |
| Rebuilding AppViewport from scratch | Duplicate of completed Sprint 0 |

## Mode definitions

- **verify_gap_close** — Run DoD checklist against existing code; fix only residual gaps; do not redesign.
- **full_implement** — Build per Screen Blueprints + Design System + Tech Spec; one story at a time.
