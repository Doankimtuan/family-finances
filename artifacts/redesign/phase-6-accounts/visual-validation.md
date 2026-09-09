# Phase 6 — Visual validation

## Routes tested

| Route | Role |
| --- | --- |
| `/money` | Account + credit inventory |
| `/money/accounts` | Redirect to Money |
| `/money/accounts/[id]` | Account or credit-card detail |
| `/money/add` | Capture account selector |
| Create/edit/archive | Sheets on hub / detail |

## Viewports

Centered 440px shell is unchanged (`AppViewport` / `ChromeShell`). No desktop accounts dashboard.

| Viewport | Expected | Result |
| --- | --- | --- |
| 390 | Scan rows, owed primary, no overflow | Attempted in Cursor browser when the app is reachable |
| 440 | Canonical shell | Same composition |
| 768 | Same product, centered | No multi-column inventory |
| 1280 | Same 440px shell | Same |

## Light / dark

Tokens only (`hero-*`, `text-*`, `surface-*`, semantic utilization). Liability copy + `Amount` vs `Balance` — color is not the only cue. Incomplete facility uses muted text, not a zero amount.

## Accessibility

- Credit hero `aria-label` is owed language (`owedAriaLabel`), not “available money”
- Unavailable facility copy is not privacy-masked
- Account rows `min-h-14`; sheet actions `min-h-11`
- Signed activity amounts keep prefix + tone

## Authenticated limitation

Authenticated household session was available in the local app. Verified:

- `/money` inventory (grouped cash/bank rows; credit cards labeled current outstanding)
- `/money/accounts` redirects to `/money`
- Account detail (`TP Bank chồng`) hero Balance + recent activity preview
- Archive confirmation sheet (cancelled; not archived)
- Credit-card detail (`TP bank visa chồng`) owed-first hero, available/limit secondary, activity preview, Pay card
- Create account sheet (type, name, opening balance, ownership)

390/440-class mobile shell observed in dark theme. Light mode and explicit 768/1280 CSS viewport resize were not separately captured in this pass; the 440px app shell is unchanged.

## Known visual limits

- Vietnamese empty/hero strings wrap; `text-pretty` / `break-words` on names
- Credit supporting metrics are a 2-column grid; incomplete copy is short (“Not available” / “Không có dữ liệu”)
