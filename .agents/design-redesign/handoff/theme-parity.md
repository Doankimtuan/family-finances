# Light / Dark Theme Parity Audit — ViNha Design System

**Canonical System**: Task 11 ViNha Component System (`DS-01`)  
**Design System Asset ID**: `assets/75087efd2c3c42baa6ce67405334331b` ("ViNha Warm Precision")  
**Theme Tokens**:

- **Light Theme**: Canvas `#FAFAF9`, Surface `#FFFFFF`, Hairline Border `#DDE4E1`, Text `#18181B`, Muted `#52525B`, Primary Deep Teal `#0D3331` / `#0F766E`, Mint Soft `#E7F5F1`.
- **Dark Theme**: Canvas `#141416`, Surface `#1C1C1F`, Elevated Popover `#242428`, Hairline Border `#2E2E33` / `#3F3F46`, Text `#F4F4F5`, Muted `#A1A1AA`, Primary Mint Teal `#2DD4BF`, Mint Soft `#173B37`.

---

## 1. Master Light / Dark Parity Audit Matrix

| Screen Name                                    | Geometry | Content | Components | Contrast       | Icons | Status   | Notes                                                                                      |
| ---------------------------------------------- | -------- | ------- | ---------- | -------------- | ----- | -------- | ------------------------------------------------------------------------------------------ |
| **Home Dashboard** (`SCR-01`)                  | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Synchronized Light (`c48a...`) and Dark (`d4a4...`); identical cash flow chart & 4 pillars |
| **Money Overview** (`SCR-02`)                  | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Zero tag wrapping; identical 5 domain rows; 40×40px badge containers                       |
| **Fast Add Transaction** (`SCR-03`)            | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Sheet layout; identical 36px tabular VND entry; multiplier chips                           |
| **Accounts Overview** (`SCR-07`)               | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Identical 3 account groups; ₫ 0 credit debt indicator; floating CTA                        |
| **Add Account Wizard** (`SCR-09`)              | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Choice tiles, form fields, opening balance invariant notice match 1-to-1                   |
| **Add Credit Card** (`SCR-10`)                 | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Deep rose warning `#3B1219` vs light rose `#FFE4E6`; inputs match                          |
| **Account Detail — Asset** (`SCR-11`)          | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Available balance hero, quick action buttons, transaction feed match                       |
| **Account Detail — Credit** (`SCR-12`)         | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Rose debt hero (`#FB7185` vs `#BE123C`), 9.7% progress bar, due date alert                 |
| **Savings Overview** (`SCR-08`)                | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Principal hero, average yield chip, contract cards match 1-to-1                            |
| **Add Savings Wizard** (`SCR-13`)              | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Live vs historical mode switcher, rollover selectors, account picker                       |
| **Savings Detail** (`SCR-14`)                  | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 64% progress bar, 132-day countdown pill, destructive early withdraw CTA                   |
| **Savings Providers** (`SCR-15`)               | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | System vs custom provider cards; active contract counters match                            |
| **Add Custom Provider** (`SCR-16`)             | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Half-sheet modal; identical form controls, color picker, submit button                     |
| **Investments Overview** (`SCR-17`)            | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Portfolio hero, cost basis, unrealized gain chip (+14.2%) match                            |
| **Add Investment Wizard** (`SCR-18`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Dual-mode choice tiles; derived order value calculation preview box                        |
| **Investment Detail** (`SCR-19`)               | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Holding facts, 4-button action grid, separate ledger transaction feeds                     |
| **Buy Investment** (`SCR-20`)                  | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Quantity input, live order calculation, source account selector match                      |
| **Sell Investment** (`SCR-21`)                 | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | MAX button, remaining holding indicator, net proceeds after fees/tax                       |
| **Update Unit Price** (`SCR-22`)               | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Invariant notice, previous price comparison, live market value change                      |
| **Loans Overview** (`SCR-23`)                  | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Outstanding balance hero, debt allocation bar, upcoming installment card                   |
| **Add Loan Wizard** (`SCR-24`)                 | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Dual-mode selector, reducing vs fixed amortization choice tiles match                      |
| **Loan Detail** (`SCR-25`)                     | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 24% repaid progress bar, next installment alert card with breakdown                        |
| **Record Loan Payment** (`SCR-26`)             | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Principal vs interest inputs, source account selector, balance change                      |
| **Repayment Schedule** (`SCR-27`)              | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 240-period schedule list, 3 filter tabs, period due cards match                            |
| **Early Payoff Estimate** (`SCR-28`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Simulation disclaimer, 1.5% penalty rate, interest saved badge match                       |
| **Personal Lending Overview** (`SCR-29`)       | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Debt hero, receivable strip, privacy blur toggle, segmented chips                          |
| **Create Personal Debt** (`SCR-30`)            | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Direction selector (Lend vs Borrow), counterparty field, verbal readout                    |
| **Personal Debt Detail — Lent** (`SCR-31`)     | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Emerald theme, recovery progress bar (33.3%), 9-point debt facts card                      |
| **Personal Debt Detail — Borrowed** (`SCR-32`) | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Rose theme, repayment progress bar (30.0%), due countdown, tranches                        |
| **Record Debt Payment** (`SCR-33`)             | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 50% / 100% quick chips, ceiling validation, source account balance                         |
| **Edit Personal Debt** (`SCR-34`)              | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | MATCH | **PASS** | Principal immutable alert, due date edit, archive debt danger card                         |
| **Plan & Jars Overview** (`SCR-35`)            | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 6 jars with clamped progress bars, overspend alert, upcoming outflows                      |
| **Jar Detail** (`SCR-36`)                      | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Virtual allocation notice, 3-metric budget card, linked categories                         |
| **Create & Edit Jar** (`SCR-37`)               | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Virtual envelope notice, fixed vs % income choice tiles, categories                        |
| **Adjust Jar Allocation** (`SCR-38`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Virtual capacity move notice, before/after preview box, emergency toggle                   |
| **Historical Plan Month** (`SCR-39`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Historical padlock icon, read-only summary strip, frozen jar rows                          |
| **Monthly Review Ritual** (`SCR-40`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Period context, issues checklist, 3-pillar cash flow summary match                         |
| **Inbox Overview — Open** (`SCR-41`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 14 pending items counter, 2-segment switcher, kind filters, ReviewCards                    |
| **Inbox Detail — Unmapped Tx** (`SCR-42`)      | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Rose amount (`−₫ 85.000`), invariant alert, active jar selector                            |
| **Inbox Detail — Maturity** (`SCR-43`)         | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Contract facts, 3 renewal choice tiles, confirm renewal CTA match                          |
| **Inbox Archived Queue** (`SCR-44`)            | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 42 archived items, search, outcome chips, read-only historical rows                        |
| **Inbox Zero Pending** (`SCR-45`)              | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Centered checkmark glyph, calm copy, financial overview CTA match                          |
| **Together Overview Hub** (`SCR-46`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Stacked avatars, member preview, pending invites, policy links match                       |
| **Household Members** (`SCR-47`)               | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Sovereign ownership alert, Admin vs Partner badges, departure lock                         |
| **Invite Partner Hub** (`SCR-48`)              | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | High-trust alert, Partner role card, 7-day TTL, pending invites list                       |
| **Household Policies** (`SCR-49`)              | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Policy invariant banner, 3 policy choice tile groups, submit CTA                           |
| **Remove Partner Sheet** (`SCR-50`)            | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Scrim backdrop, impact assessment card (5 instruments), danger CTA                         |
| **Welcome Screen** (`SCR-51`)                  | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Value proposition preview card, 3 value pillars, entry CTAs match                          |
| **Login Screen** (`SCR-52`)                    | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | 44px Google/Apple buttons, email/password inputs, remember checkbox                        |
| **Register Screen** (`SCR-53`)                 | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | Password validation, mismatch feedback, terms checkbox match                               |
| **Onboard Wizard Step 1** (`SCR-54`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | StepProgress (50%), household name input, start-alone alert match                          |
| **Onboard Wizard Step 2** (`SCR-55`)           | MATCH    | MATCH   | MATCH      | PASS (WCAG AA) | PASS  | **PASS** | StepProgress (100%), opening balance invariant notice, plan presets                        |

---

## 2. Dark Theme Quality Audit & Defect Elimination

1. **Pure Black Misuse Prohibited**:
   - Pure `#000000` is strictly avoided for layout canvas and cards.
   - Canvas uses soft slate `#141416` (prevents harsh OLED contrast glare).
   - Surface cards use `#1C1C1F` with a 1px solid `#2E2E33` / `#3F3F46` border.
   - Elevated overlays (modals, sheets, dropdowns) use `#242428` / `#28282D`.

2. **White-Card Carryover Eliminated**:
   - Zero hardcoded `#FFFFFF` backgrounds in Dark Mode. All surfaces reference `bg-surface-dark` (`#1C1C1F`) or semantic container tokens.

3. **Neon Tint Prevention**:
   - Success emerald is softened from saturated neon to balanced `#34D399` (on dark) and `#059669` (on light).
   - Debt/danger rose is softened to `#FB7185` (on dark) and `#BE123C` (on light).
   - Primary mint is calibrated to `#2DD4BF` with soft container `#173B37`.

4. **Icon Visibility & Semantic currentColor**:
   - All 271 icons use `currentColor` and inherit token colors directly from the parent label or semantic badge.
   - No hardcoded dark glyphs on dark surfaces. All icons maintain minimum 4.5:1 contrast against their containers.
