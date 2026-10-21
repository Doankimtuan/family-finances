# Browser Regression & Responsive Verification

## 1. Test Environment

- **Server**: Next.js 16.3.1 (Turbopack) production server running at `http://localhost:3100`.
- **Browser Automation**: Playwright in Chromium (Headless).
- **Authentication**: Authenticated user session loaded via `output/playwright/.auth/user.json` (verified via `npm run e2e:auth-check`).
- **Date/Time**: 2026-10-21.

---

## 2. Multi-Viewport & Responsive Matrix

Screens were exercised and visual screenshots recorded at the 5 mandatory responsive viewports:

|    Viewport    |           Device Profile           | Target Checks                                                                       | Result | Screenshot Reference                                                                  |
| :------------: | :--------------------------------: | :---------------------------------------------------------------------------------- | :----: | :------------------------------------------------------------------------------------ |
| **360 × 640**  |          Compact Android           | Narrow screen wrapping, no horizontal scroll, button tap target spacing             |  PASS  | `evidence/home-en-360x640.png`, `money-en-360x640.png`                                |
| **390 × 844**  |     Standard iPhone (12/13/14)     | Baseline mobile viewport, bottom navigation bar alignment, typography readability   |  PASS  | `evidence/home-en-390x844.png`, `money-en-390x844.png`, `transactions-en-390x844.png` |
| **440 × 900**  | Canonical ViNha Shell (Max Mobile) | Exact 440px constraint, sheet modal border radius, full card width                  |  PASS  | `evidence/home-en-440x900.png`, `money-en-440x900.png`                                |
| **768 × 1024** |       Tablet / iPad Portrait       | Centered 440px column centering, desktop backdrop, floating action buttons          |  PASS  | `evidence/home-en-768x1024.png`, `money-en-768x1024.png`                              |
| **1280 × 900** |             Desktop HD             | Centered single-column layout, backdrop framing, no layout stretching or disruption |  PASS  | `evidence/home-en-1280x900.png`, `money-en-1280x900.png`                              |

---

## 3. Screen Inventory & Localization Verification

The following core and secondary routes were verified in both English and Vietnamese:

| Route                 |         English Verification         |       Vietnamese Verification        |   Console Status   | Notes                                                  |
| :-------------------- | :----------------------------------: | :----------------------------------: | :----------------: | :----------------------------------------------------- |
| `/home`               |     PASS (`home-en-390x844.png`)     |     PASS (`home-vi-390x844.png`)     | Clean (0 err/warn) | Recent activity shows localized notes                  |
| `/money`              |    PASS (`money-en-390x844.png`)     |    PASS (`money-vi-390x844.png`)     | Clean (0 err/warn) | Total balance and account list                         |
| `/money/transactions` | PASS (`transactions-en-390x844.png`) | PASS (`transactions-vi-390x844.png`) | Clean (0 err/warn) | **F5 Verified**: System notes display in active locale |
| `/money/accounts`     |   PASS (`accounts-en-390x844.png`)   |                 PASS                 | Clean (0 err/warn) | Account cards and balances                             |
| `/money/savings`      |   PASS (`savings-en-390x844.png`)    |   PASS (`savings-vi-390x844.png`)    | Clean (0 err/warn) | Savings contracts & renewal tags                       |
| `/money/investments`  | PASS (`investments-en-390x844.png`)  |                 PASS                 | Clean (0 err/warn) | Portfolio valuation and holdings                       |
| `/money/loans`        |    PASS (`loans-en-390x844.png`)     |                 PASS                 | Clean (0 err/warn) | Active loan contracts and payment dates                |
| `/plan`               |     PASS (`plan-en-390x844.png`)     |     PASS (`plan-vi-390x844.png`)     | Clean (0 err/warn) | Jars budget & monthly intention                        |
| `/inbox`              |    PASS (`inbox-en-390x844.png`)     |                 PASS                 | Clean (0 err/warn) | Decision cards and empty state                         |
| `/together`           |   PASS (`together-en-390x844.png`)   |                 PASS                 | Clean (0 err/warn) | Household members and sharing rules                    |

---

## 4. Theme & Interactive Sheet Verification

### Dark Mode Verification

- Evaluated via `page.emulateMedia({ colorScheme: "dark" })`.
- Verified at 390×844:
  - `evidence/home-en-dark-390x844.png`: Dark surface tokens, clear typography, correct status colors.
  - `evidence/transactions-en-dark-390x844.png`: Dark transaction rows with high-contrast text and colored transaction amounts.

### Interactive Sheet & F7 Warning Verification

- Triggered the Add Transaction capture flow (`/money` → Add Transaction link).
- The capture bottom sheet opened with spring animation:
  - Verified screenshot: `evidence/add-transaction-sheet-390x844.png`.
  - Monitored browser console for `PressResponder` warnings during sheet mount, animation, and interaction.
  - **Result: Exactly 0 `PressResponder` warnings observed.**

---

## 5. Summary Verdict

```text
==================================================
BROWSER VERIFICATION RESULT: PASS
==================================================
Total Screens Audited:         15
Viewports Tested:              5 (360, 390, 440, 768, 1280)
Locales Tested:                2 (English, Vietnamese)
Themes Tested:                 2 (Light, Dark)
Console PressResponder Warns:  0
Console Errors:                0
Screenshots Saved:             26 (in evidence/)
==================================================
```
