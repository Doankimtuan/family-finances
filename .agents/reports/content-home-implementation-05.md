# ViNha Content Polish — Batch 4: Home

## Summary

Rewrote the Home locale messages in Vietnamese and English while preserving
all 87 keys, ICU arguments, routes, calculations, state transitions, and
component behavior.

The copy is now factual and action-oriented: it names the data shown, the
period being summarized, the items waiting for review, and the next available
destination. Repeated calm/pulse/rhythm language, unsupported financial
evaluation, source-module language, and broad Inbox decision claims were
removed.

No Home component, calculation, chart, period logic, routing, permission
behavior, or layout was changed.

## Home state model inspected

- `getHomeDashboard` returns no dashboard when the money-action gate fails or
  the core position, Plan, or Inbox queries fail. Home then renders its error
  status lane. Transaction analytics are independently nullable, so the
  balance/Plan/Inbox shell can exist without cash-flow metrics.
- Day zero is exactly `accountCount === 0 && activeJarCount === 0`. It renders
  the existing invite-member, Plan setup, and add-expense actions.
- The Home header currently uses `starting` only for day zero. For a populated
  Home it uses `cashFlowStory`: `hasTransactions` selects whether the period
  has reportable income/expense, and `netCashFlow >= 0` selects the
  income-at-least-spending or spending-exceeds-income message. The `steady` and
  `strong` header keys are retained for the existing message contract but are
  not selected by the current Home page.
- The Health heuristic starts at a setup score and adds points for accounts,
  active Jars, and a small or empty Inbox. It does not inspect savings
  adequacy, debt, returns, emergency readiness, or transaction quality. Home
  Health copy therefore now describes setup/data availability rather than
  financial wellbeing.
- The Home balance comes from the real position query: the sum of active liquid
  account balances, excluding credit cards. Cash flow is income minus expense;
  transfers and refunds are excluded by the existing ledger policy.
- Plan copy is backed only by active Jar count and the stored income allocation
  mode. Inbox copy is backed only by the count of open Inbox items.
- The status lane defines offline, stale, partial, permission, and error
  variants, but the current Home page renders offline plus the recoverable
  error path. The page does not expose a missing-source identifier for partial
  data.

## Major terminology decisions

- **Current position:** `Tổng số dư các tài khoản` / `Total across accounts`.
  This avoids the stiff `Vị thế hiện tại` and does not imply a single account
  balance. The hint states that active accounts are included and credit cards
  are excluded.
- **Cash flow:** kept `Dòng tiền ròng` / `Net cash flow` for the actual metric.
  Income, expense, transfers, refunds, and the selected period remain distinct.
- **Spending:** kept the conversational `Tiền kỳ này đi đâu?` / `Where is money
going?` and retained neutral period comparisons without judging the amount.
- **Plan:** uses `Kế hoạch`, `hũ`, and `phân bổ thu nhập`; English uses Plan,
  Jar, and income allocation. The Home card no longer teaches Plan concepts or
  uses pulse/rhythm language.
- **Inbox:** describes items waiting for review, not all financial decisions.
  Empty copy is limited to `Không có mục nào đang chờ bạn xem.` /
  `Nothing is waiting for you to review.`
- **Health:** changed the Home summary to `Tình trạng thiết lập` / `Setup
status` because the inspected score is a setup-and-Inbox heuristic, not a
  supported financial-health claim.

## Representative rewrites

### Vietnamese

- `Một nơi êm để bắt đầu` → `Bắt đầu theo dõi tiền`
- `Tiền của bạn đang đi đúng hướng` → `Thu vào cao hơn hoặc bằng chi ra trong kỳ này`
- `Vị thế hiện tại` → `Tổng số dư các tài khoản`
- `Nhịp kế hoạch` → `Kế hoạch`
- `Hộp thư trống — chưa có quyết định nào.` → `Không có mục nào đang chờ bạn xem.`
- `Ba bước đầu êm dịu — không cần vội.` → `Chọn việc bạn muốn làm trước.`
- `Kéo để làm mới hoặc mở module nguồn để xem mới nhất.` → `Dữ liệu có thể chưa mới. Thử lại để tải phiên bản mới nhất.`

### English

- `A calm place to start` → `Start tracking your money`
- `Your money is moving in a good direction` → `Income matches or exceeds spending this period`
- `Current position` → `Total across accounts`
- `Plan pulse` → `Plan`
- `Inbox is clear — nothing to decide right now.` → `Nothing is waiting for you to review.`
- `Three calm first steps — no rush.` → `Choose what you want to do first.`
- `Pull to refresh or open the source module for the latest.` → `Some data may be out of date. Try again to reload the latest view.`

## Tone reduction

Removed Home’s repeated `êm`, `nhẹ`, `nhịp`, `vững`, `đà`, calm, pulse,
rhythm, momentum, and strong-footing framing from operational summaries and
status messages. The remaining `starting`, `steady`, and `strong` keys are
descriptive contract values only; their user-facing labels now describe data
setup rather than emotional or financial evaluation.

Vietnamese Home values contain no mixed internal/product terms such as Money,
Plan, Inbox, Partner, Active, Suggest, Real Ledger, module, ReviewItem, Auth,
mutation, story, or Home. English retains only approved product labels and
natural financial terms.

## Financial truthfulness checks

- Checked `getRealPosition` and `account-types`: the displayed total is active
  liquid account balances, with credit cards excluded. Copy does not call it a
  single account balance or available cash.
- Checked `calculateHomeFinancialMetrics` and the income-exclusion policy:
  `netCashFlow` is income minus expense, while transfers and refunds are not
  counted. The copy preserves `Dòng tiền ròng` / `Net cash flow`.
- Checked the header branch in `home/page.tsx`: positive means net cash flow is
  non-negative; attention means it is negative; unavailable means no reportable
  income/expense exists in the selected period.
- Checked `getPlanPulse`: Home exposes active Jar count and
  `incomeAllocateMode`, not real-money allocation or Jar balances.
- Checked `computeHealthPulse`: levels are derived from account count, active
  Jar count, and open Inbox count. No copy claims savings adequacy, debt
  health, investment performance, or emergency readiness.
- Checked the transaction form: the existing day-zero add-expense route is
  reachable, but saving is disabled when no account exists. Whether that CTA
  should be replaced by account setup requires a product/UI decision and was
  recorded below rather than invented in copy.

## UX-content issues

These remain intentionally unfixed because copy alone cannot resolve them:

1. `starting`, `steady`, and `strong` are not one consistently rendered Home
   state model. Home uses `starting` for day zero and cash-flow stories for
   populated states, while the Health heuristic has its own levels. The
   product should decide whether Home needs one explicit state model.
2. Stale data has no timestamp or named stale source. A retry button exists,
   but the product has not defined which facts are stale or whether opening a
   source refreshes Home on desktop.
3. Partial data has no missing-source information in its contract. The copy
   cannot safely name a module or promise a setup action.
4. The Home Health card is not currently rendered by `home/page.tsx`, while
   Home still owns its message keys and the dashboard read model computes a
   Health pulse. Its hierarchy and ownership need a UI decision.
5. Plan, Inbox, cash flow, spending, and the capture action compete for the
   same decision surface. Copy is shorter, but information density and CTA
   priority still require the later UX phase.
6. The day-zero add-expense action opens a valid route but cannot save without
   an account. The product needs an account-setup destination or a conditional
   action before this can be resolved safely.
7. Home’s conditional cards mean the clear Inbox copy and zero-Jar Plan copy
   are not always visible even though their message contracts exist.

## Browser verification

- Playwright Chromium verified unauthenticated `/en/home` redirects to
  `/en/login` and `/vi/home` redirects to `/vi/login`; the Vietnamese login
  snapshot also confirmed locale-resolved UI copy.
- The authenticated Home smoke was attempted with the repository’s configured
  E2E credentials. Login remained on `/en/login` with `Email or password is
incorrect.`, so data-rich Home, day-zero, offline, stale, partial, and
  permission states could not be reached without changing auth or fixtures.
- The smoke suite still passed its reachable coverage: 5 passed, 2
  credential-dependent tests failed at login for the existing environment.
- Home content was therefore not claimed as visually verified at 390px,
  440px, 768px, or 1280px. Those viewport checks remain a follow-up once a
  valid authenticated fixture is available. No layout or overflow changes were
  made in this batch.

## Validation

- **JSON parse:** pass — all 44 locale JSON files parsed, including both Home
  locale files.
- **Key parity:** pass — 87 Home leaf keys match.
- **ICU parity:** pass — all Home interpolation argument names match.
- **Home VI mixed-term search:** pass — 0 targeted internal/product-term hits.
- **Tone search:** pass — no standalone targeted Vietnamese or English
  tone/metaphor occurrences remain in Home; the substring `êm` appears only as
  part of the ordinary verb `Thêm`, and key names/approved product labels are
  not counted.
- **Home-focused unit tests:** pass — 28 tests across Home metrics/header,
  Health pulse, financial classification, and i18n catalog tests.
- **Full tests:** pass — 120 files, 901 tests.
- **Lint:** pass — `npm run lint`.
- **Typecheck:** pass — `npm run typecheck`.
- **Build:** pass — `npm run build`.
- **Browser smoke:** partial — unauthenticated locale redirects passed;
  authenticated Home coverage was blocked by invalid E2E credentials.
- **Format:** changed JSON and this report were checked with targeted
  Prettier. Repository-wide format status was not used as a gate because prior
  batches document thousands of unrelated pre-existing format violations.
- **Remaining scoped violations:** none in Vietnamese Home values; English
  retains approved `Home`, `Plan`, and `Inbox` product labels.
