# ViNha Screen Inventory & Discovery Records

## Screen Inventory Table

| ID     | Domain      | Screen               | Route                      | Purpose                                                  | Audited | Stitch Design | Prototype | Status  |
| ------ | ----------- | -------------------- | -------------------------- | -------------------------------------------------------- | ------- | ------------- | --------- | ------- |
| SCR-01 | Home        | Home Dashboard       | `/home`                    | Household financial pulse, quick triage, recent activity | YES     | Planned       | Pending   | AUDITED |
| SCR-02 | Ledger      | Money Overview       | `/money`                   | Total liquid assets vs liabilities, product distribution | YES     | Planned       | Pending   | AUDITED |
| SCR-03 | Ledger      | Accounts List        | `/money/accounts`          | Inventory of cash & bank accounts                        | YES     | Planned       | Pending   | AUDITED |
| SCR-04 | Ledger      | Account Detail       | `/money/accounts/[id]`     | Single account balance and history                       | YES     | Planned       | Pending   | AUDITED |
| SCR-05 | Ledger      | Transactions Ledger  | `/money/transactions`      | Full chronological transaction ledger                    | YES     | Planned       | Pending   | AUDITED |
| SCR-06 | Ledger      | Add Transaction      | `/money/transactions/new`  | Modal/sheet to record expense, income, or transfer       | YES     | Planned       | Pending   | AUDITED |
| SCR-07 | Ledger      | Transaction Detail   | `/money/transactions/[id]` | Inspect & audit single transaction                       | YES     | Planned       | Pending   | AUDITED |
| SCR-08 | Savings     | Savings List         | `/money/savings`           | Term deposits & Tikop savings contracts                  | YES     | Planned       | Pending   | AUDITED |
| SCR-09 | Savings     | Savings Detail       | `/money/savings/[id]`      | Terms, interest accrued, renewal policy                  | YES     | Planned       | Pending   | AUDITED |
| SCR-10 | Investments | Investment Portfolio | `/money/investments`       | Risk holdings, valuations, cost basis                    | YES     | Planned       | Pending   | AUDITED |
| SCR-11 | Ledger      | Debts & Loans        | `/money/debts` & `/loans`  | Outstanding liabilities and repayments                   | YES     | Planned       | Pending   | AUDITED |
| SCR-12 | Plan        | Plan Overview        | `/plan`                    | Monthly intention pulse, income base, jar allocations    | YES     | Planned       | Pending   | AUDITED |
| SCR-13 | Plan        | Jars List & Detail   | `/plan/jars`               | Intention envelopes, over-budget warnings, reallocations | YES     | Planned       | Pending   | AUDITED |
| SCR-14 | Plan        | Goals                | `/plan/goals`              | Milestone savings goals progress                         | YES     | Planned       | Pending   | AUDITED |
| SCR-15 | Plan        | Month Ritual         | `/plan/ritual`             | End-of-month review and closing ritual                   | YES     | Planned       | Pending   | AUDITED |
| SCR-16 | Inbox       | Inbox Queue          | `/inbox`                   | Asynchronous decision queue (Open vs Archived)           | YES     | Planned       | Pending   | AUDITED |
| SCR-17 | Inbox       | Review Item Detail   | `/inbox/[id]`              | Decision card with one-click resolution                  | YES     | Planned       | Pending   | AUDITED |
| SCR-18 | Tenancy     | Together Overview    | `/together`                | Household members, role badges, shared policies          | YES     | Planned       | Pending   | AUDITED |
| SCR-19 | Tenancy     | Together Settings    | `/together/settings`       | Appearance (Dark/Light), language, security              | YES     | Planned       | Pending   | AUDITED |
| SCR-20 | Health      | Health Overview      | `/health`                  | Read-only diagnostic pulse score & data hygiene          | YES     | Planned       | Pending   | AUDITED |
| SCR-21 | Tenancy     | Welcome / Login      | `/welcome`, `/login`       | Public entry & authentication                            | YES     | Planned       | Pending   | AUDITED |
| SCR-22 | Tenancy     | Onboarding           | `/together/onboard`        | Household setup and partner invitation                   | YES     | Planned       | Pending   | AUDITED |

---

# Screen Discovery Records

---

### SCREEN: Home Dashboard

**ROUTE:** `/en/home`  
**PRODUCT DOMAIN:** `home`

**PRIMARY PURPOSE:**  
Provide an immediate, calm, and trustworthy answer to the question: _"How is our household doing financially right now?"_

**USER GOAL:**  
Quickly scan current net liquidity, spot urgent triage items requiring attention, review recent cash movements, and initiate an action (like logging an expense).

**PRIMARY INFORMATION:**

1. Household identity and partner status (Header: "ViNha", Household "Chúm ta", User avatar/role).
2. Net Financial Position (Hero card: Total Balance ₫2,000,000,000+, Cash flow trend).
3. Attention / Triage banner (e.g. "14 review items waiting in Inbox", "2 jars over budget").
4. Recent Transaction feed (latest 5 expenses/incomes with merchant name, account, category icon, tabular VND amount).

**PRIMARY ACTION:**  
Quick Add Transaction (Floating pill CTA "+ Thêm giao dịch" / "+ Add").

**SECONDARY ACTIONS:**

- Filter or switch month view.
- Tap attention card to navigate to `/inbox` or `/plan`.
- Tap "Xem tất cả" to open `/money/transactions`.

**ENTRY POINTS:**  
App launch, Bottom Tab 1 ("Home"), post-login redirection.

**EXIT POINTS:**

- Tap "+ Add" → Open Add Transaction Sheet.
- Tap Attention Banner → Open `/inbox`.
- Tap Net Worth / Balance → Navigate to `/money`.
- Tap Recent Activity → Navigate to `/money/transactions`.
- Bottom Navigation tabs (Money, Plan, Inbox, Together).

**DEPENDENCIES:**  
`tenancy` (active household), `ledger` (account balances, recent transactions), `plan` (current month status), `inbox` (open review count).

**CURRENT COMPONENTS:**

- Top App Bar (brand mark, household indicator, notification bell).
- Net Worth Summary Card (hero tabular numerals, monthly comparison badge).
- Action Strip (Quick Add, Transfer, Allocate).
- Alert Card (Inbox count with amber badge).
- Recent Transactions List (Avatar/icon containers, two-line text, tabular amount).
- Bottom Navigation Bar (5 tabs).

**CURRENT UX STRUCTURE:**  
Single-column vertical stack bounded by 440px max-width container, sticky top bar, sticky bottom navigation.

**INTERACTIONS:**

- Pull to refresh.
- Tap transaction item to open modal/detail.
- Tap floating action button to slide up creation sheet.

**STATES:**

- _Loading_: Skeleton pulse on hero card and transaction rows.
- _Populated_: Live balances, graph, recent list.
- _Empty_: Zero transactions state prompting first account connection or expense entry.
- _Error_: Inline error banner with retry button.

**CURRENT UX ISSUES:**

1. Visual clutter in the hero section: balance number competes with multiple micro-chips and mixed English/Vietnamese labels.
2. The Add button position can collide with the bottom navigation if not elevated properly.
3. Information density is slightly loose on small screens, pushing recent activity below the fold.

**DESIGN CONSTRAINTS:**  
Strict 440px width container. Vietnamese diacritics require min 1.35x line height. Tabular numerals for monetary alignment.

**MUST PRESERVE:**  
Household "Chúm ta" context, actual balance figures, distinction between net worth vs monthly income, 5-tab bottom navigation.

**CAN RECONSIDER:**  
Refining hero card visual hierarchy, consolidating quick action pills, streamlining typography tokens with Geist.

---

### SCREEN: Money Overview

**ROUTE:** `/en/money`  
**PRODUCT DOMAIN:** `ledger`

**PRIMARY PURPOSE:**  
Answer: _"Where is our money, what do we owe, and where did our cash go?"_

**USER GOAL:**  
Audit all financial assets and liabilities by category (Cash, Bank, Savings, Debt, Investments) and launch account management.

**PRIMARY INFORMATION:**

1. Position Hero (Total Assets: ₫2,036,547,748 vs Liabilities: ₫0).
2. Segmented category breakdown: Accounts (7 accounts: ₫12.7M), Savings (Tikop: ₫2.02B), Debts, Investments.
3. Account cards with bank logos/icons, account names ("Ví thường", "Tiền mặt chồng giữ", "TP Bank chồng"), and posted balances.

**PRIMARY ACTION:**  
Add Account ("+ Thêm tài khoản").

**SECONDARY ACTIONS:**

- Toggle between Accounts / Products (Savings, Debts, Loans, Investments).
- Tap into specific account detail.

**ENTRY POINTS:**  
Bottom Tab 2 ("Money"), links from Home dashboard.

**EXIT POINTS:**

- Tap account card → `/money/accounts/[id]`.
- Tap Savings tile → `/money/savings`.
- Bottom Navigation tabs.

**CURRENT UX ISSUES:**

1. The vast majority of household assets are in Tikop Savings (₫2.02B), while liquid cash accounts are ₫12.7M. The overview needs to clearly distinguish liquid transactional cash from term-locked savings without misleading the user on immediate liquidity.
2. Product navigation between Cash Accounts and Savings/Investments uses mixed pill chips that look clickable but behave inconsistently.

**MUST PRESERVE:**  
Strict separation between physical accounts and virtual jars. Clear grouping of Cash vs Bank vs Savings.

---

### SCREEN: Plan Overview & Jars

**ROUTE:** `/en/plan`  
**PRODUCT DOMAIN:** `plan`

**PRIMARY PURPOSE:**  
Answer: _"What is our money supposed to do this month, and are we sticking to our intentions?"_

**USER GOAL:**  
Review monthly income allocation across envelope Jars ("Hũ chi tiêu trong tháng", "Hũ tiết kiệm", "Hũ cho gia đình", "Hũ shopping cho vợ", "Hũ hiếu hỷ"), detect over-budget envelopes, and reallocate funds.

**PRIMARY INFORMATION:**

1. Plan Pulse: Total Allocated Capacity vs Actual Spent this month (e.g. ₫8.5M spent out of ₫25M planned).
2. Over-budget Warning Banners: _"Hũ shopping cho vợ is over budget by ₫809,244"_, _"Hũ chi tiêu is over by ₫200,000"_.
3. Smart Reallocation suggestions: _"Move ₫810,000 from Hũ tiết kiệm to cover shopping"_.
4. Jars Grid / List: Jar name, icon, allocated capacity, current spent, remaining allowance progress bar.

**PRIMARY ACTION:**  
Execute Reallocation or Create New Jar ("+ Thêm hũ").

**SECONDARY ACTIONS:**

- Month selector (Previous / Current / Next month).
- Launch Month-End Ritual (`/plan/ritual`).
- View recurring rules (`/plan/recurring`).

**CURRENT UX ISSUES:**

1. The progress bars for over-budget jars use harsh generic red that creates anxiety rather than constructive financial problem-solving.
2. The distinction between a "Jar" and a "Bank Account" must be visually obvious—users frequently confuse moving money into a jar with transferring money between bank accounts.

**MUST PRESERVE:**  
Jars are virtual envelopes. The 6-jar concept, over-budget calculation, and reallocation flow.

---

### SCREEN: Decision Inbox

**ROUTE:** `/en/inbox`  
**PRODUCT DOMAIN:** `inbox`

**PRIMARY PURPOSE:**  
Answer: _"What household financial decisions need my or my partner's attention?"_

**USER GOAL:**  
Review and resolve pending financial events (matured Tikop savings contracts, uncategorized expenses, income allocation suggestions) without cognitive overload.

**PRIMARY INFORMATION:**

1. Queue Tabs: **Open** (e.g. 14 items) vs **Archived**.
2. Filter Pills: All, Savings Maturity, Unmapped Expense, Partner Approvals.
3. Review Cards:
   - Type Badge (e.g., "SAVINGS_MATURITY" in violet, "UNMAPPED_EXPENSE" in amber).
   - Event summary (e.g., _"Tikop term deposit ₫50,000,000 matured on 24/09/2026"_).
   - Contextual actions: "Rollover 3 Months" or "Withdraw to TPBank".

**PRIMARY ACTION:**  
Direct inline decision on the top card (e.g., "Confirm Rollover" or "Select Category").

**SECONDARY ACTIONS:**

- Dismiss / Archive item.
- View details of underlying contract or transaction.

**CURRENT UX ISSUES:**

1. With 14 items, the list feels long and repetitive. Needs smart batching or scannable triage cards.
2. Card action buttons lack distinct hierarchy (e.g., Rollover vs Withdraw have equal visual prominence).

**MUST PRESERVE:**  
Open vs Archived architecture. Strict ReviewItem data contract.

---

### SCREEN: Together (Household & Settings)

**ROUTE:** `/en/together`  
**PRODUCT DOMAIN:** `tenancy`

**PRIMARY PURPOSE:**  
Answer: _"Who is managing this money, and what are our shared household rules?"_

**USER GOAL:**  
View family members, verify partner access, manage invites, review shared policies, and configure app preferences (Language, Dark/Light mode).

**PRIMARY INFORMATION:**

1. Household identity: "Chúm ta" (3 members).
2. Member list with avatars and roles:
   - `lettngan2@gmail.com` (Admin)
   - `doantuan21101999@gmail.com` (Partner)
   - `htsk999@gmail.com` (Partner)
3. Management links: Members, Invitations, Policies, Preferences, Settings.

**PRIMARY ACTION:**  
Invite Partner ("+ Mời thành viên").

**CURRENT UX ISSUES:**

1. Settings and household management are somewhat nested and split between `/together` and `/together/settings`.
2. Role privileges (Admin vs Partner) are not explained clearly to the user.

**MUST PRESERVE:**  
Household boundaries, exact member roles, bilingual preferences.
