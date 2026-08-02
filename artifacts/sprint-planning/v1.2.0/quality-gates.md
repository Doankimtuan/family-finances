# Quality Gates — sprint-001

Run **per story** before starting the next story.  
DoD: [definition-of-done.md](./definition-of-done.md) + `artifacts/implementation-plan/CURRENT/definition-of-done/DoD.md`.

## Gate matrix

| Gate | Verify stories (E01) | Email auth (E02-001…003) | OAuth / linking (E02-004…006) |
|------|----------------------|--------------------------|-------------------------------|
| Typecheck | ✓ | ✓ | ✓ |
| Lint (boundaries, no archive) | ✓ | ✓ | ✓ |
| Unit tests | ✓ (touched) | ✓ | ✓ (OAuth start codes, linking conflict maps, sign-out) |
| Integration / Playwright | Smoke shell locales | Auth email smoke | OAuth chrome + buttons; IdP happy path env-gated |
| Accessibility (REQ-019) | Chrome hit targets | Forms, focus, errors | OAuth buttons ≥44px; focus order Google→Apple→Email |
| Performance smoke | No new waterfalls | Auth pages | OAuth start must not chain unnecessary awaits |
| Manual QA vs blueprint / DS | Gap checklist | Email flows | Login hierarchy OAuth-first; no guest CTA |
| Architecture review | 440px, shared/ui | Session placement | PKCE → `/auth/confirm`; secrets only in Supabase |
| Business validation | Shell DoD | AC-002 / REQ-002 | AC-002a / AC-002b / REQ-002a / BR-02b |
| Story DoD | ✓ | ✓ | ✓ (Google, Apple, Linking sections) |
| i18n | Locale chrome | Auth catalogs | Google/Apple/linking strings en+vi |

## OAuth / linking gates (mandatory for residual auth)

- [ ] Google Continue control present and starts OAuth (or fail-closed Alert)
- [ ] Apple Continue control present and starts OAuth (or fail-closed Alert)
- [ ] Divider + Continue with Email retained
- [ ] Account linking policy / conflict UX for `ST-E02-005`
- [ ] No duplicate profile path accepted as success
- [ ] B-ENV-03 / B-ENV-04 / B-ENV-05 resolved or story STOP (not skipped silently)

## Sprint-level gates (after last committed story)

- [ ] Demo: Open app → Welcome → Login → Google **or** Apple **or** Email session → shell at 440px
- [ ] Auth routes omit BottomNav; product routes keep BottomNav
- [ ] Unauthenticated users cannot perform money mutations (fail-closed)
- [ ] Account linking DoD satisfied (`AC-002b`)
- [ ] No guest mode
- [ ] No `archive/` imports

## Failure policy

Any failed gate → fix within **current story** or STOP and escalate. Do not advance the story sequence.
