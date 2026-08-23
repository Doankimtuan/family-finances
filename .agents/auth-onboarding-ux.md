# Entry, Auth & Onboarding UX — Journey Reference

Companion to `.agents/design-system.md` §23 (visual rules). This file records
the current screen flow, each screen's role, and what is required vs
deferred, so future changes don't accidentally re-grow friction.

## Screen flow (signed out)

```
/{locale}  ────────────┐  (same Welcome screen)
/{locale}/welcome ─────┤
                       ├─ Create account → /register ─┬─ session granted → /together/onboard
                       │                              └─ email confirm → inline "Check your email"
                       └─ Log in → /login ─┬─ ?next= (safe in-app path)
                                           ├─ membership → /home
                                           └─ no membership → /together/onboard
/{locale}/splash → resolves session → welcome | home | onboard (auto, no UI beyond brand + spinner)
/{locale}/forgot-password → email → toast (stays on screen)
/auth/confirm (adapter, outside locale) → exchanges code/OTP → home | onboard | localized error screen
```

## Screen roles

| Route                                          | Role                                                                                                         | Primary action    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| `/{locale}` + `/welcome`                       | Value proposition; the single pre-auth screen (root merged — the old "Open app" landing was a redundant hop) | Create account    |
| `/login`                                       | Access for existing users (OAuth-first, email fallback)                                                      | Log in            |
| `/register`                                    | Auth-critical account creation only                                                                          | Create account    |
| `/forgot-password`                             | Recovery path                                                                                                | Send reset link   |
| `/together/onboard`                            | Minimum setup Home needs (2 steps)                                                                           | Continue / Finish |
| `/auth/confirm` UI at `/{locale}/auth/confirm` | Post-link feedback (ok / error), fail-closed on bare visits                                                  | Continue          |

## Onboarding steps (2)

1. **Household name** (required — names the shared space; RPC requires ≥2
   chars). Quiet info note: start alone, invite later. Inviting is never
   blocking; the invite surface lives in Together → Members after setup.
2. **Cash account + starter Jar preset** (required — Home's day-zero state
   renders from these seeds). Preset choice: Balanced (Essentials · Lifestyle
   · Buffer · Savings) or Simple (Needs · Wants · Savings).

Deferred by design: income, balances beyond the seeded cash account, extra
accounts, jar editing, invitations, profile details — all reachable from
Home/Together/Settings after entry. Joining via invite link
(`/invite/{token}`) bypasses this wizard entirely (creates partner
membership).

## Navigation & data contracts to preserve

- Entry decisions: `resolveAuthEntry()` / `resolveAuthenticatedEntryPath()`
  (session + household membership) — never route authed users to welcome.
- Register success: `AUTH_SIGN_UP_NEXT.onboard` → replace to onboarding;
  otherwise inline confirm state, no navigation.
- Onboard finish: `createHouseholdAction` → `create_household_with_essentials`
  RPC → hard redirect to Home from the server action.
- Deep links: safe `?next=` (`isSafeInAppNextPath`) honored after login and
  confirm; `/welcome` must keep resolving (splash target, e2e, old links).
- Leaving a household re-enters onboarding; solo admins are blocked until
  household closure/admin transfer rules allow it.

## Notes from the redesign (2026-08)

- Root landing merged into Welcome (`open-app-button.tsx` removed;
  `buttons.openApp` kept — still used by not-found).
- Onboarding went 3 → 2 steps: the old zero-input "invite later" step became
  an info note on step 1.
- Auth headers unified via shared `AuthScreenHeader` (back + brand + h1);
  screens are top-anchored (`AuthScreenShell align="start"`).
- Welcome's visual anchor is a Home-hero-derived preview card (decorative,
  badged "Preview", static illustration values).
