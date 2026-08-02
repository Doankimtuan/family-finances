# Task Breakdown — sprint-001

Tasks refine `artifacts/implementation-plan/CURRENT/tasks/S1.md` against the **current** tree (`app/[locale]/…`, `i18n/`, `modules/platform/supabase/`, `messages/{en,vi}/`). Do not invent business rules or UI beyond Screen Blueprints + Design System.

Generic SoT tasks (reference): bootstrap AppViewport; BottomNav/TopAppBar; shared/ui wrappers; Splash/Welcome; Login + session; Register/forgot.

---

## ST-E01-001 — verify shell / tokens

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E01-001-a | Confirm AppViewport max-width 440px, center column, no sidebar | Matches Design System + `shared/layout` |
| T-E01-001-b | Confirm CSS tokens + next-themes light/dark | Theme toggle / system preference works |
| T-E01-001-c | Confirm no `archive/` / legacy imports in app shell | Lint / grep clean |
| T-E01-001-d | Smoke: `/en` and `/vi` shell renders | Playwright or manual |
| T-E01-001-e | Gap-close only if Story DoD fails | Minimal diffs |

---

## ST-E01-003 — verify / extend shared/ui for auth

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E01-003-a | Inventory primitives needed by auth blueprints (Input, Field, Checkbox, Link, Button, Text, Heading) | List vs existing `shared/ui` |
| T-E01-003-b | Add missing wrappers only as Design System requires | No ad-hoc page-level HeroUI styling |
| T-E01-003-c | Unit smoke for wrappers | Existing vitest patterns green |

---

## ST-E01-002 — verify chrome / auth vs product layout

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E01-002-a | Product layout retains BottomNav + TopAppBar | Locale-aware labels |
| T-E01-002-b | Auth layout **without** five-tab BottomNav | Per auth Screen Blueprints |
| T-E01-002-c | Verify a11y hit targets / focus tokens | REQ-019 critical paths |

---

## ST-E02-001 — Splash + Welcome

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E02-001-a | Routes under `app/[locale]/…` per blueprints (`/welcome`, splash entry) | Routes resolve |
| T-E02-001-b | Auth layout (no BottomNav) | Visual match chrome rules |
| T-E02-001-c | Fill `messages/{en,vi}/auth.json` from blueprint copy | i18n hard dependency |
| T-E02-001-d | Wire landing → Welcome (replace open-app → `/home` bypass) | Demo script start |
| T-E02-001-e | Tests: render + navigation | Unit / Playwright smoke |

Blueprints: `artifacts/screen-blueprints/CURRENT/authentication/splash.md`, `welcome.md`

---

## ST-E02-002 — Login + session + gates

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E02-002-a | Verify Supabase Auth env (`.env.local`); STOP if Auth cannot run | Documented in blockers if missing |
| T-E02-002-b | Confirm `updateSession` / proxy refresh path | Existing `proxy.ts` |
| T-E02-002-c | Auth adapters / Server Actions under `app/[locale]` + `modules/tenancy` or `platform` per Architecture | No archive imports |
| T-E02-002-d | `auth.login` + `auth.confirm` screens per blueprints | UI + i18n |
| T-E02-002-e | Session establishment; unauthenticated gate on product money paths | Redirect / block |
| T-E02-002-f | Membership fail-closed stub for money actions (AC-002) — **no** S2 onboard wizard | Mutations blocked without membership |
| T-E02-002-g | Playwright: login happy path inside AppViewport | Demo exit criteria |
| T-E02-002-h | i18n keys for all new strings | `messages/{en,vi}` |

Refs: AC-002, BR-02/02a, REQ-002; blueprints `login.md`, `confirm.md`

---

## ST-E02-003 — Register + forgot password

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E02-003-a | `auth.register`, `auth.forgot-password` per blueprints | Screens ship |
| T-E02-003-b | Supabase `signUp` / `resetPassword` flows | Hosted Auth |
| T-E02-003-c | Links from login; confirm email reuses `auth.confirm` | Flow coherent |
| T-E02-003-d | Tests + i18n | Gates green |

---

## ST-E02-004 — Google Login + Apple Login (OAuth-first)

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E02-004-a | Dashboard: enable **Google** + **Apple**; redirect allowlist `/auth/confirm` | Both providers live |
| T-E02-004-b | Application `StartOAuthSignIn` + Server Action / client start | PKCE start works for both providers |
| T-E02-004-c-google | Login UI: **Continue with Google** (primary OAuth CTA) | Google control matches blueprint; starts Google OAuth |
| T-E02-004-c-apple | Login UI: **Continue with Apple** (second OAuth CTA) | Apple control matches blueprint; starts Apple OAuth |
| T-E02-004-c-email | Divider + Continue with Email block + register/forgot links | Email path retained; hierarchy OAuth-first |
| T-E02-004-d | Confirm path regression (`exchangeCodeForSession`) | Google, Apple, and email confirm OK |
| T-E02-004-e | Unit + Playwright + i18n (en/vi) | Gates green per [quality-gates.md](./quality-gates.md) |

---

## ST-E02-005 — Account Linking

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E02-005-a | Ops: Supabase automatic identity linking policy recorded | B-ENV-05 cleared; BR-02b operable |
| T-E02-005-b | Map linking/conflict errors to stable UI codes + Alert | Fail closed; no duplicate profiles |
| T-E02-005-c | Optional authenticated `linkIdentity` entry (settings) | If in story scope; else document deferral |

---

## ST-E02-006 — Sign-out + delete account

| Task ID | Work | Done when |
|---------|------|-----------|
| T-E02-006-a | `app/auth/signout` or action + nav entry | Cookies cleared |
| T-E02-006-b | Delete account command + confirm UX | Server-only privileged |
| T-E02-006-c | Tests for cookie clear / unauth gates | Gates green |

---

## Layering reminder (per story)

Database/Auth config → Domain/application → Repository/adapters → Server Actions → Hooks → UI → Routing/i18n → Integration → Tests → Review
