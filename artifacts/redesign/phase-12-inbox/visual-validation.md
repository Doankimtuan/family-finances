# Phase 12 — Visual validation

## Environment

- App: local Next.js on `http://127.0.0.1:3000` (dev server already running)
- Auth: **not bypassed**
- No fake Inbox items, tasks, alerts, or recommendations were seeded
- No destructive mutations were submitted

## Authentication result

**Did not reach an authenticated Inbox queue or detail screen.**

On `/en/login`, `Log in` (and OAuth buttons) stayed `disabled` because the login screen gates submit on client hydration (`isDisabled={busy || !hydrated}`). After navigation completed, the button remained `disabled` in the Cursor IDE browser.

- Cursor browser accessibility tree: `Log in` `states: [disabled]`
- `/en/inbox` redirected to `/en/login` (expected unauthenticated gate)
- Auth was not skipped. No session cookie was injected.

Evidence:

- `artifacts/redesign/phase-12-inbox/evidence/login-disabled-cursor.png`
- `artifacts/redesign/phase-12-inbox/evidence/notes.json`

## Real data availability

Unknown for this session. Live open/archived queues, filters, populated vs empty lists, detail actions, and privacy masking on real household figures could not be inspected in a browser.

Those states were verified in unit tests with fixtures — not against the household database.

## Inbox verification (live)

| Route | Result |
| --- | --- |
| `/en/inbox` | Redirected to `/en/login` (unauthenticated) |
| `/en/inbox?tab=archived` | Not reached live |
| `/en/inbox/[id]` | Not reached live |
| Open / Archived tabs | Not exercised live |
| Kind filters / search | Not exercised live |
| Detail / action panel | Not submitted (would be a mutation; not run) |

## Viewports

| Viewport | Live result |
| --- | --- |
| 390 | Not captured on Inbox |
| 440 | Login chrome visible (centered auth shell). Inbox surfaces not reached |
| 768 | Not captured |
| 1280 | Not captured |

The 440px app shell CSS was not changed in this phase. No desktop Inbox dashboard was added.

## Light / dark

Not captured on Inbox. Login was observed in the default light auth shell only.

## States verified

| State | How |
| --- | --- |
| Loading skeleton composition | Unit (`inbox-scan-hierarchy`) |
| Open empty / archived empty copy | Unit + message files |
| Populated list + kind groups | Unit (`phase-12-inbox`) |
| Filtered empty + clear | Unit |
| Missing amount not shown as zero | Unit |
| Privacy mask / aria-label | Unit |
| Open/Archived keyboard + ARIA | Unit |
| Mutation payload strings | Unit (source characterization) |
| Authenticated Inbox in a real browser | **Blocked** |

## Browser blockers

Existing login hydration gate: `Log in` disabled because `busy || !hydrated`. Same limitation as Phase 11. This is an environment/auth limitation, not permission to weaken authentication.

## Known limitations

- Authenticated Inbox visual validation is incomplete.
- Mapper `Number(row.amount)` still sits below the UI (unchanged).
- Archived rows still do not navigate to detail (existing interaction, preserved).
