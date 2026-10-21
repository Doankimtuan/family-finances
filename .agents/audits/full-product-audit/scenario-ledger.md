# Scenario Ledger: ViNha Autonomous Real-User Product Audit V2

**Audit Date:** 2026-10-20  
**Environment:** Next.js 16.3.1 dev server (`http://localhost:3100`), Supabase PostgreSQL backend  
**Auditor Roles:** Senior QA Automation Engineer, Senior Financial Systems Auditor, Senior UI/UX Researcher, Product Manager  
**Test Household:** `Tuan Audit Household`  
**Test Accounts:**

- **Account A (Owner / Admin):** `codex.test.1@family-finances.test` (Session `vinha-a`)
- **Account B (Partner):** `codex.test.2@family-finances.test` (Session `vinha-b`)

---

## 1. Journey J1 — Authentication, Onboarding & Household Creation

| Step  | Account   | Route / Action                  | Input / Payload                                                                    | Expected Result                                                         | Actual Observed Result                                                                                             | Status |
| ----- | --------- | ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------ |
| J1.01 | Account A | `GET /en/login`                 | Email & Password                                                                   | Auth successful, redirected to onboarding                               | Authenticated session created, redirected to `/en/together/onboard`                                                | PASS   |
| J1.02 | Account A | `/en/together/onboard` (Step 1) | Household Name: `Tuan Audit Household`                                             | Next step enables                                                       | Step 1 validated and advanced to Step 2                                                                            | PASS   |
| J1.03 | Account A | `/en/together/onboard` (Step 2) | Cash Account Name: `Cash`<br>Opening Balance: `30,000,000`<br>Jar Preset: Balanced | Household & Cash account initialized with 30M VND; starter jars created | Lands on `/en/home`. Total assets display `₫30,000,000`. Copy explicitly notes "This is not income for this month" | PASS   |
| J1.04 | Account A | Inspect Home Dashboard          | Verify opening balance integrity                                                   | Income = ₫0, Expense = ₫0, Assets = ₫30M                                | Cash flow shows Net ₫0, Income ₫0, Expense ₫0. Opening balance correctly treated as equity/balance sheet opening   | PASS   |

---

## 2. Journey J2 — Partner Invitation & Household Collaboration

| Step  | Account        | Route / Action                     | Input / Payload                                    | Expected Result                                                     | Actual Observed Result                                                                                                                           | Status             |
| ----- | -------------- | ---------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| J2.01 | Account A      | `GET /en/together/invitations/new` | Partner Email: `codex.test.2@family-finances.test` | Invitation token generated with 7-day expiration                    | Server action returns invitation token; link generated                                                                                           | PASS               |
| J2.02 | Account B      | Fresh login prior to token link    | Login with Account B credentials                   | If pending invite exists, app should highlight or offer join prompt | **Friction (Issue F1):** App routed B to `/en/together/onboard` prompting B to create a new household with zero indication an invite was pending | PASS_WITH_FRICTION |
| J2.03 | Account B      | `GET /en/invite/<token>`           | Invitation Token                                   | Preview invitation from Account A                                   | Clean preview page displaying household name, inviter role, and "Accept and join"                                                                | PASS               |
| J2.04 | Account B      | Click "Accept and join"            | Submission                                         | Account B joined as Partner; skips own onboarding                   | Immediately lands on `/en/home` showing `Tuan Audit Household`, shared assets (₫30M), and Partner role badge                                     | PASS               |
| J2.05 | Accounts A & B | `GET /en/together`                 | Cross-account inspection                           | Both members visible with appropriate role indicators               | Both accounts see 2 members: A (Admin), B (Partner). Partner cannot invite new members                                                           | PASS               |

---

## 3. Journey J3 — Core Financial Transactions & Double-Entry Reversals

| Step  | Account   | Route / Action                                      | Input / Payload                                                                   | Expected Result                                         | Actual Observed Result                                                                                                                                                     | Status |
| ----- | --------- | --------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| J3.01 | Account A | `POST /en/money/transactions/new`                   | Type: Income<br>Account: Cash<br>Amount: `25,000,000`<br>Note: Salary October     | Cash balance = 55M<br>Month Income = 25M                | Cash balance updated to ₫55,000,000. Income metric = ₫25,000,000. Inbox item generated for jar placement                                                                   | PASS   |
| J3.02 | Account B | `POST /en/money/accounts/new`                       | Name: `B Checking`<br>Type: Checking<br>Opening: `12,000,000`                     | Account created<br>Household assets = 67M               | B Checking created with ₫12,000,000. Household assets = ₫67,000,000. Non-income status preserved                                                                           | PASS   |
| J3.03 | Account A | `POST /en/money/transactions/new`                   | Type: Expense<br>Account: Cash<br>Amount: `1,500,000`<br>Note: Groceries          | Cash balance = 53.5M<br>Expenses = 1.5M                 | Cash balance = ₫53,500,000. Month expenses = ₫1,500,000                                                                                                                    | PASS   |
| J3.04 | Account A | `POST /en/money/transactions/new`                   | Type: Transfer<br>From: Cash<br>To: B Checking<br>Amount: `5,000,000`             | Cash = 48.5M<br>B Checking = 17M<br>Net worth unchanged | Cash balance = ₫48,500,000, B Checking = ₫17,000,000. Transfer does not appear in income or expense metrics                                                                | PASS   |
| J3.05 | Account B | `POST /en/money/transactions/new`                   | Type: Expense<br>Account: B Checking<br>Amount: `600,000`<br>Note: Transportation | B Checking = 16.4M<br>Expenses = 2.1M                   | B Checking = ₫16,400,000. Month expenses = ₫2,100,000                                                                                                                      | PASS   |
| J3.06 | Account B | Edit transaction `/en/money/transactions/<id>/edit` | Correct amount from `600,000` to `700,000`                                        | Immutable double-entry reversal created                 | Original expense marked "Reversed", Refund transaction +₫600,000 recorded, new corrected expense −₫700,000 recorded. B Checking = ₫16,300,000. Month expenses = ₫2,200,000 | PASS   |

---

## 4. Journey J4 — Savings & Deposits

| Step  | Account   | Route / Action                         | Input / Payload                                               | Expected Result                                              | Actual Observed Result                                                                                                                   | Status |
| ----- | --------- | -------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| J4.01 | Account A | `POST /en/money/savings/providers/new` | Name: Vietcombank<br>Tenure: 12M<br>Rate: 5.5%                | Custom provider saved                                        | Provider available in savings catalog                                                                                                    | PASS   |
| J4.02 | Account A | `POST /en/money/savings/new`           | Source: Cash<br>Amount: `10,000,000`<br>Provider: Vietcombank | Cash = 38.5M<br>Savings = 10M<br>Maturity interest = 550,000 | Cash reduced by 10M (to ₫38,500,000). Active savings = ₫10,000,000. Maturity date 10/20/2027 with ₫550,000 interest (₫10,550,000 payout) | PASS   |
| J4.03 | Account B | `GET /en/money/savings`                | View savings as Partner                                       | Identical savings data visible to Partner                    | Account B sees Vietcombank savings deposit of ₫10,000,000 with identical maturity schedule                                               | PASS   |

---

## 5. Journey J5 — Investments & Portfolio Lifecycle

| Step  | Account   | Route / Action                   | Input / Payload                                                                         | Expected Result                                                                                                                                         | Actual Observed Result                                                                                                                                                                                                                                                                                                       | Status |
| ----- | --------- | -------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| J5.01 | Account A | `POST /en/money/investments/new` | Symbol: `FPT`<br>Quantity: 100<br>Unit Price: `100,000`<br>Funding: Cash (`10,000,000`) | Cash = 28.5M<br>Holdings = 100 units<br>Cost Basis = 10M                                                                                                | Cash reduced to ₫28,500,000. Investment holding created: 100 units at ₫100,000. Valuation = ₫10,000,000                                                                                                                                                                                                                      | PASS   |
| J5.02 | Account A | Update Unit Market Price         | New Market Price: `120,000` (+20%)                                                      | Portfolio Value = 12M<br>Unrealized Gain = +2M (20%)                                                                                                    | Portfolio value updated to ₫12,000,000. Unrealized gain = +₫2,000,000 (+20%)                                                                                                                                                                                                                                                 | PASS   |
| J5.03 | Account A | Execute Partial Sale             | Units to sell: 40<br>Sale Price: `120,000`<br>Proceeds: Cash (`4,800,000`)              | Proceeds = 4.8M to Cash<br>Remaining units = 60<br>Expected Value = 60 × 120k = 7.2M<br>Cost Basis = 60 × 100k = 6M<br>Expected Unrealized Gain = +1.2M | Proceeds of ₫4,800,000 credited to Cash (Cash = ₫33,300,000). Remaining units = 60.<br>**CRITICAL DEFECT (Issue F3):** Portfolio valuation remained at ₫12,000,000 (displayed as `60 units × 120,000 = ₫12,000,000`). Estimated PnL computed as ₫12M − ₫6M = +₫6,000,000 (100% gain). Corrupts Home assets display by +₫4.8M | FAIL   |

---

## 6. Journey J6 — Bank Loans & Installments

| Step  | Account   | Route / Action             | Input / Payload                                                                                                   | Expected Result                                     | Actual Observed Result                                                                                                                                                                                                                                                                                    | Status  |
| ----- | --------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| J6.01 | Account A | `POST /en/money/loans/new` | Lender: BIDV Bank<br>Principal: `50,000,000`<br>Rate: 8.4%<br>Term: 12 months<br>Type: Equal monthly installments | Schedule preview calculated; loan saved to database | Schedule preview computed correctly (₫4,358,674/mo, total interest ₫2,304,092).<br>**CRITICAL BLOCKER (Issue F4):** On Save, application throws toast "Could not save. Try again." Backend PostgreSQL logs error 42883: `function public._loan_insert_schedule_entries(uuid, uuid, jsonb) does not exist` | BLOCKED |

---

## 7. Journey J7 — Plan, Goals, Inbox & Ritual Review

| Step  | Account        | Route / Action                  | Input / Payload                                                                            | Expected Result                                                             | Actual Observed Result                                                                                      | Status |
| ----- | -------------- | ------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| J7.01 | Account A      | `POST /en/plan/goals/new`       | Name: Emergency Fund 6 Months<br>Target: `60,000,000`<br>Linked: Vietcombank Savings (10M) | Goal created, progress = 16.67%                                             | Goal created successfully; progress accurately displayed as 16.67% (₫10,000,000 / ₫60,000,000)              | PASS   |
| J7.02 | Accounts A & B | `GET /en/inbox`                 | Review open items                                                                          | 3 action items: Unmapped Groceries, Unmapped Transportation, Suggest Salary | Both accounts observe the exact same 3 inbox items                                                          | PASS   |
| J7.03 | Account B      | Resolve Transportation in Inbox | Map to `Essentials` jar                                                                    | Item cleared; jar updated                                                   | Transportation linked to Essentials. Inbox count decremented to 2 across both sessions                      | PASS   |
| J7.04 | Account A      | Resolve Groceries in Inbox      | Map to `Essentials` jar                                                                    | Item cleared; jar updated                                                   | Groceries linked to Essentials. Inbox count decremented to 1 across both sessions                           | PASS   |
| J7.05 | Account B      | Resolve Salary October in Inbox | Map to `Savings` jar                                                                       | Item cleared; queue empty                                                   | Salary linked to Savings jar. Inbox queue empty ("0 items to review") on both sessions                      | PASS   |
| J7.06 | Account A      | `GET /en/plan/ritual`           | Review October Monthly Ritual                                                              | Factual summary matches ledger                                              | Displays exact figures: Income ₫25M, Expenses ₫2.2M, Savings ₫10M, Net invested ₫5.2M, Net cash flow +₫7.6M | PASS   |

---

## 8. Journey J8 — Together & Permissions

| Step  | Account   | Route / Action                     | Input / Payload                  | Expected Result      | Actual Observed Result                                                                | Status |
| ----- | --------- | ---------------------------------- | -------------------------------- | -------------------- | ------------------------------------------------------------------------------------- | ------ |
| J8.01 | Account B | `GET /en/together/invitations/new` | Attempt invite as Partner        | Restricted / blocked | Redirected to `/en/together/invitations` with no creation affordance                  | PASS   |
| J8.02 | Account B | `GET /en/together/policies`        | Attempt policy update as Partner | View-only access     | Partner sees "View only" badge and informational banner. Controls are non-interactive | PASS   |
| J8.03 | Account A | `GET /en/together/policies`        | Manage policies as Admin         | Admin editable       | Admin sees "Admin can edit" badge and active "Save policies" button                   | PASS   |
