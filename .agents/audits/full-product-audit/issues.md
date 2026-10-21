# Product Defects & Issues Ledger: ViNha V2 Audit

---

## Issue Summary Matrix

| ID     | Severity                    | Module                | Title                                                                     | Status    | User Impact                                                    |
| ------ | --------------------------- | --------------------- | ------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| **F1** | **P2 (High Friction)**      | Together / Onboarding | No in-app discovery of pending invitations for authenticated users        | Confirmed | New partners can mistakenly create a competing household       |
| **F2** | **P3 (Hardening)**          | Auth / Security       | Client-side accessible Supabase auth session token cookie                 | Confirmed | XSS vulnerability could exfiltrate active session tokens       |
| **F3** | **P1 (Critical Integrity)** | Money / Investments   | Stale market valuation & distorted P&L following partial share sale       | Confirmed | Overstates investment portfolio and household total net assets |
| **F4** | **P1 (Critical Blocker)**   | Money / Loans         | Loan creation completely blocked by missing PostgreSQL RPC                | Confirmed | Users cannot record any bank loans or installment debt         |
| **F5** | **P3 (Cosmetic / i18n)**    | Money / Savings       | Hardcoded Vietnamese text generated in English locale transactions        | Confirmed | Inconsistent localization polish                               |
| **F6** | **P2 (UX Confusion)**       | Plan / Jars           | Plan dashboard displays "Unavailable" for jars without period allocations | Confirmed | Users cannot see jar budgets or limits after creating jars     |
| **F7** | **P3 (Code Quality)**       | UI / React Aria       | `PressResponder rendered without pressable child` console warning         | Confirmed | Minor rendering overhead, potential event propagation issues   |

---

## Detailed Issue Reports

### Issue F1 — No In-App Invitation Discovery for Logged-In Users

- **Severity:** P2 (High Product Friction)
- **Module:** `Together / Onboarding / Invitations`
- **Steps to Reproduce:**
  1. As Household Owner (Account A), navigate to `/en/together/invitations/new` and send an invitation to `codex.test.2@family-finances.test`.
  2. In an independent clean browser session, log in directly as Account B (`codex.test.2@family-finances.test`) via `/en/login`.
  3. Observe the destination route and UI prompt.
- **Observed Behavior:**
  Account B is immediately dropped onto `/en/together/onboard` ("Step 1 of 2: Name your household") with no notice that an invitation to join `Tuan Audit Household` is pending.
- **Expected Behavior:**
  Upon logging in, the onboarding resolver should check for pending invitations associated with the user's email. If found, it should display: _"You have been invited to join Tuan Audit Household by codex.test.1"_, offering an instant "Join Household" button before suggesting household creation.
- **Evidence Reference:**
  Playwright snapshot from Session `vinha-b` (`2026-10-20T08:33`).

---

### Issue F2 — Supabase Auth Cookie Accessible via Client-Side JavaScript

- **Severity:** P3 (Security Hardening)
- **Module:** `Auth / Session Management`
- **Steps to Reproduce:**
  1. Log into ViNha on any route.
  2. In browser console or Playwright session, evaluate `document.cookie`.
- **Observed Behavior:**
  `sb-bbzffxvgocjwsdbujvgn-auth-token` containing the base64-encoded JWT session tokens (access token and refresh token) is directly readable via JavaScript.
- **Technical Analysis:**
  The Next.js SSR cookie handler writes cookies with standard options without forcing `HttpOnly` flags across sub-chunks. An attacker exploiting any potential DOM XSS vulnerability could exfiltrate the Supabase session token directly.
- **Expected Behavior:**
  Session cookies should be issued with `HttpOnly`, `Secure`, and `SameSite=Lax` attributes.

---

### Issue F3 — Stale Holding Valuation & Distorted Unrealized P&L After Partial Sale

- **Severity:** P1 (Critical Financial Integrity Defect)
- **Module:** `Money / Investments`
- **Steps to Reproduce:**
  1. Buy 100 shares of stock (e.g., FPT) at ₫100,000/share (Cost Basis: ₫10,000,000).
  2. Update unit market price to ₫120,000/share (Valuation: ₫12,000,000; Unrealized P&L: +₫2,000,000 / 20%).
  3. Execute a partial sale of 40 shares at ₫120,000/share (Proceeds: ₫4,800,000 to Cash).
  4. Inspect the updated holding page (`/en/money/investments/<id>`), the Investments overview (`/en/money/investments`), and the Home dashboard (`/en/home`).
- **Observed Behavior:**
  - Holding detail page displays:  
    `60 units × 120,000 VND / shares` right next to total valuation `₫12,000,000`!
  - Estimated Unrealized P&L is computed as:  
    `₫12,000,000 − ₫6,000,000 = +₫6,000,000 (+100.00%)`.
  - Home dashboard lists:  
    `Investments: ₫12,000,000` and reports Total Household Assets as `₫71,600,000` instead of true `₫66,800,000`.
- **Expected Behavior:**
  - Remaining valuation must recalculate as `60 × ₫120,000 = ₫7,200,000`.
  - Unrealized P&L must compute as `₫7,200,000 − ₫6,000,000 = +₫1,200,000 (+20.00%)`.
  - Total household assets on Home must reflect `₫66,800,000`.
- **Root Cause Analysis:**
  The server action handling investment sales decrements `quantity` from 100 to 60, but fails to recompute or clear the cached `current_valuation` column in the database holding record, leaving the stale pre-sale asset value in place.

---

### Issue F4 — Bank Loans Creation Blocked by Missing PostgreSQL RPC Function

- **Severity:** P1 (Critical Blocker)
- **Module:** `Money / Loans`
- **Steps to Reproduce:**
  1. Navigate to `/en/money/loans/new`.
  2. Fill out loan fields: Lender `BIDV Bank`, Principal `50,000,000`, Annual Interest `8.4%`, Term `12 months`, Equal monthly installments.
  3. Notice amortization schedule preview renders cleanly (₫4,358,674/mo, total interest ₫2,304,092).
  4. Click "Save loan".
- **Observed Behavior:**
  - The UI displays a red toast error: _"Could not save. Try again."_
  - Server logs capture PostgreSQL error code 42883:
    ```
    error: function public._loan_insert_schedule_entries(uuid, uuid, jsonb) does not exist
    hint: No function matches the given name and argument types. You might need to add explicit type casts.
    ```
  - No loan is saved; the entire Loans feature is inoperable.
- **Expected Behavior:**
  The database migration establishing the loans schema must include the definition for `public._loan_insert_schedule_entries`, or the server action should perform standard table inserts rather than invoking an undefined RPC.

---

### Issue F5 — Hardcoded Vietnamese Text Generated in English Locale

- **Severity:** P3 (Cosmetic / Localization Polish)
- **Module:** `Money / Savings`
- **Steps to Reproduce:**
  1. Set application language to English (`/en/...`).
  2. Create a term savings deposit with provider "Vietcombank".
  3. Navigate to `/en/money/transactions`.
- **Observed Behavior:**
  The automatic transaction note created for the savings placement reads:  
  `"Gửi tiết kiệm: Vietcombank"` instead of `"Savings deposit: Vietcombank"`.
- **Expected Behavior:**
  Transaction system generation notes should pull localized translation strings based on the household's or session's active locale.

---

### Issue F6 — Plan & Jars Display "Unavailable" Without Period Budget Allocation

- **Severity:** P2 (Usability & User Confusion)
- **Module:** `Plan / Jars`
- **Steps to Reproduce:**
  1. Complete onboarding with default "Balanced" starter jars.
  2. Navigate to `/en/plan`.
- **Observed Behavior:**
  - Top summary cards show: Planned: `Unavailable`, Spent: `Unavailable`, Remaining: `Unavailable`.
  - Alert banner reads: _"Jars unavailable: Jar budgets are not available right now."_
  - The 4 jar cards display empty progress without explanation of how to activate them.
- **Expected Behavior:**
  If a household has created jars but has not initialized the current month's allocation targets, the UI should display an inviting empty state: _"Set up your October spending plan — Allocate your ₫25,000,000 income across your 4 jars"_ with a primary action button, rather than alarming users with multiple "Unavailable" badges.
