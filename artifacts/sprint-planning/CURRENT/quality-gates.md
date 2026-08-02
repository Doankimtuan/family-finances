# Quality Gates — sprint-001

Run **per story** before starting the next story. Source DoD: `artifacts/implementation-plan/CURRENT/definition-of-done/DoD.md` + each story’s DoD section.

## Gate matrix

| Gate | Verify stories (E01) | Full stories (E02) |
|------|----------------------|--------------------|
| Typecheck | ✓ | ✓ |
| Lint (boundaries, no archive) | ✓ | ✓ |
| Unit tests | ✓ (touched) | ✓ |
| Integration / Playwright | Smoke shell locales | Auth happy paths |
| Accessibility (REQ-019 critical) | Chrome hit targets | Forms, focus, errors |
| Performance smoke | No new waterfalls | Auth pages: no waterfall chains |
| Manual QA vs blueprint / DS | Gap checklist | Pixel/flow fidelity |
| Architecture review | 440px, shared/ui only | Same + session placement |
| Business validation | n/a or shell DoD | AC/BR/REQ for E02-002 |
| Story DoD | ✓ | ✓ |
| i18n | Locale chrome | All new strings in catalogs |

## Sprint-level gates (after last story)

- [ ] Demo script passes: Open app → Welcome → Login → session → shell at 440px
- [ ] Auth routes omit BottomNav; product routes keep BottomNav
- [ ] Unauthenticated users cannot perform money mutations (fail-closed)
- [ ] No edits to other boards’ `artifacts/**/CURRENT` packs
- [ ] No `archive/` imports

## Failure policy

Any failed gate → fix within **current story** or STOP and escalate. Do not advance the story sequence.
