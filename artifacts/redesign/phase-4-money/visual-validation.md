# Phase 4 — Visual validation

## Viewports

Attempted in the Cursor browser against the running app when a session exists. Centered 440px shell is unchanged (`AppViewport` / `ChromeShell`).

| Viewport | Expected | Result |
| --- | --- | --- |
| 390×844 | Dense inventory, one hero, no horizontal scroll | See browser verification in the phase report |
| 440 | Canonical Money | Same composition |
| 768 | Same product, centered | No desktop dashboard |
| 1280 | Same 440px shell | No multi-column money OS |

## Visual quality gate

| Question | Decision |
| --- | --- |
| Understand financial reality in 3–5s? | Hero = accessible accounts; groups follow |
| One primary number? | Yes — `totalOwnedBalance` |
| Meaning of that number? | “Money in active accounts” + hint vs investments/Hũ |
| Accessible vs estimate? | Balance current-state vs investment `estimate` and allocation label |
| Money vs intention? | No Hũ/Plan on Money |
| Scan inventory? | One account list card + module rows |
| Liabilities distinct? | Separate credit section; outstanding labeled; not Balance-as-cash |
| Next action? | FAB Add transaction; empty Add account |
| Calm vs dashboard? | No charts; allocation strip is the ceiling |
| Feels like ViNha? | Warm-stone, one teal hero, five tabs |

## Accessibility

- Hero grouped with accessible name  
- Section / credit headings  
- 44px FAB, show-all, create, module rows (`min-h-14`)  
- Color not the only liability signal (label + attention text)  
- Reduced-motion: existing press-scale disable on rows  

## i18n

New keys in `messages/en/money.json` and `messages/vi/money.json` (`realPositionHint`, `hub.heroAccessibleLabel`, `hub.accountsHint`, `hub.modules.investmentCoverage`, allocation copy).

## Dark mode

Tokens only (`hero-*`, `text-*`, `surface-*`, semantic utilization fills). No new HEX.

## Authenticated limitation

If this environment has no household session, live Money cannot be exercised without bypassing auth (forbidden). Focused tests + code inspection are the fallback; E2E smoke (`money-hub.smoke.spec.ts`) remains the release gate.
