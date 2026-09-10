# Phase 14 — Visual validation

## Environment

- App: local Next.js on `http://localhost:3000`
- Auth: **not bypassed** — existing session already allowed `/en/health`
- No fake accounts, balances, debts, savings, investments, scores, or recommendations were seeded
- No Health mutations exist to submit

## Authentication result

**Reached authenticated Health overview and insights.**

`/en/health` rendered the populated household pulse. `/en/health/insights` opened from the overview CTA. Source link reached Inbox with the existing origin/factor query.

The Phase 13 login hydration gate (`Log in` disabled because `busy || !hydrated`) did not apply in this session because a session was already present.

## Real data availability

Populated household (English UI):

- Household pulse **85 / 100**, level **Strong**
- 7 recorded accounts
- 7 active plan jars
- 5 open Inbox items
- Coverage **4 of 4** source areas
- Insights: Inbox notice, 8 recent ledger moves, 7 active jars as intention, AI guardrail, Inbox-load scenario, pulse-sources scenario

## Health verification (live)

| Route | Result |
| --- | --- |
| `/en/health` | Populated overview: context, pulse, coverage rows, source links, limitations, View insights |
| `/en/health/insights` | Notices + coverage scenarios; no advice CTA |
| Inbox source | `/en/inbox?origin=%2Fhealth%2Finsights&factor=inbox` |
| Five tabs | Home, Money, Plan, Inbox, Together — no Health tab |
| Back to Health / Back to Home | Present as detail-bar links |

## Viewports

| Viewport | Inner width | `#app-viewport-root` width | Evidence |
| --- | --- | --- | --- |
| 390 | 390 | 390 | `evidence/health-overview-390.png` |
| 440 | 440 | 440 | `evidence/health-overview-440.png` |
| 768 | 768 | 440 | `evidence/health-overview-768.png` |
| 1280 | 1280 | 440 | `evidence/health-overview-1280.png` plus centered-shell light/dark captures |

Desktop did not become a multi-column analytics dashboard. The ~440px shell stayed authoritative.

## Light / dark

| Theme | Surfaces | Evidence |
| --- | --- | --- |
| Light | Overview + insights | `health-overview-light.png`, `health-insights-light.png` |
| Dark | Overview + insights | `health-overview-default.png`, `health-overview-440-dark.png`, `health-insights-dark.png` |

Warm-stone canvas and teal accents held in both themes. No feature-level hex or gradients were added.

## States verified

| State | How |
| --- | --- |
| Populated | Live `/en/health` and `/en/health/insights` |
| Coverage complete (4 of 4) | Live |
| Source link | Live Inbox origin/factor |
| Pulse not a giant hero | Live + unit (`health-overview-card` elevated, not `from-hero`) |
| Empty / partial / load error | Implementation + unit (`NO_VISIBLE_FACTS`, `PARTIAL`, `ErrorState`) — not present on this household |
| Missing pulse not coerced to 0 | Unit (`if (!overview.health) return null`) |
| Advice language absent | Unit scan of EN/VI catalogs + live copy |
| Privacy of money amounts | Health renders counts only; Inbox privacy control remains on Inbox |

## Browser blockers

None for authenticated Health in this session.

## Known limitations

- Live locale remained English; Vietnamese is covered by message files + unit assertions, not a live `vi` pass
- Empty and partial Health were not available on the signed-in household
- Screenshot tool captures the full IDE browser chrome; 390/440 columns were confirmed by `innerWidth` / `shellWidth` as well as the left-column layout in those captures
