# Visual QA & Device Audit: Implementation 07 — Main App Shell Screens

## Screen Audits

### 1. Home (`/[locale]/home`)

- **Stitch Reference**: SCR-01 (Light: `c48a58d9f013494eb4bd4b2bc41d31d9`, Dark: `d4a4d84e44c94a05ae3bfeefc6df9e6f`)
- **Hierarchy**:
  1. TopAppBar (`title: "ViNha"`, notifications/profile action)
  2. Asset Hero / Net Position card with `data-testid="ledger-balance"` and `data-financial-kind="current_state"`
  3. Cash Flow Chart with period switcher (Tháng / Quý)
  4. Decision and Attention cards (Inbox prompt, Plan Pulse)
  5. Product Summaries using canonical `BaseRow` (Tiết kiệm, Đầu tư, Nợ vay, Cho vay)
  6. Floating Action Button: Shared Add Transaction button from Implementation 04
- **Parity & Responsive**:
  - 360px: Pass, no horizontal overflow, amounts wrap cleanly without truncation bugs.
  - 390px: Canonical baseline, 100% geometry match.
  - 430px: Pass, centered 440px shell container keeps layout compact.
  - Theme Parity: Light / Dark colors adhere to semantic surface tokens (`surface-canvas`, `surface-card`, `border-subtle`).

### 2. Money (`/[locale]/money`)

- **Stitch Reference**: SCR-02 (Light: `31dcf3d3e06042d0973920dc3ad1a08d`, Dark: `b7af0cf462204bed9beedf116503c5d0`)
- **Hierarchy**:
  1. TopAppBar (`title: "Tài chính" / "Money"`)
  2. Total Liquidity / Financial Position hero with hide-balance toggle
  3. Accounts Section with account rows, credit card liability indicators
  4. Money Product Navigation list using canonical `BaseRow` with semantic tones and test IDs (`money-link-accounts`, `money-link-savings`, `money-link-investments`, `money-link-loans`, `money-link-debt`)
- **Parity & Responsive**:
  - 360px, 390px, 430px: All verified without horizontal scroll.
  - Theme Parity: Light and Dark mode verified.

### 3. Plan (`/[locale]/plan`)

- **Stitch Reference**: SCR-35 (Light: `70749ca2e350497f9def0dadf235d3ba`, Dark: `893e91e4bced4fa4af9f44b8cd967316`)
- **Hierarchy**:
  1. TopAppBar (`title: "Kế hoạch" / "Plan"`)
  2. Plan Hub Hero (Period, Assist mode, Health status summary)
  3. Plan Exceptions & Attention alerts
  4. Upcoming financial events list
  5. Active Jars list with intention amounts, budget status (`data-financial-object="jar"`)
  6. Goals section with progress indicators (`data-financial-object="goal"`)
  7. Ritual and Recurring entries
- **Parity & Responsive**:
  - 360px, 390px, 430px: All verified.
  - Semantic Rule: Preserved `Jar ≠ Account`, `Planned ≠ Spent`, forbidden keywords absent from Plan hero.

### 4. Inbox (`/[locale]/inbox`)

- **Stitch Reference**: SCR-41 (Light: `80394649d39f4c458d55e834611d45c2`, Dark: `1efc32d2855745c6ae118f880dafefe1`), SCR-45 (Empty: `354e2436922c475093af873d271fec77`)
- **Hierarchy**:
  1. TopAppBar (`title: "Hộp thư" / "Inbox"`, unread count badge)
  2. Filter tabs / chips (Tất cả, Cần duyệt, Đã xong)
  3. Attention item queue with urgency indicators
  4. EmptyState when zero open items
- **Parity & Responsive**:
  - 360px, 390px, 430px: All verified.
  - Theme Parity: Light and Dark mode verified.

### 5. Together (`/[locale]/together`)

- **Stitch Reference**: SCR-46 (Light: `f45af37b153c4a739848e2bd0ed230e4`, Dark: `d0e81a7d33c047aaa1d163ba6caf18d8`)
- **Hierarchy**:
  1. TopAppBar (`title: "Gia đình" / "Together"`)
  2. Household Identity & Tier Card
  3. Members Section with member avatars, roles (Admin/Member), and status indicators
  4. Pending Invitations list with copy invite / revoke actions
  5. Household Settings navigation entries
- **Parity & Responsive**:
  - 360px, 390px, 430px: All verified.
  - Theme Parity: Light and Dark mode verified.
