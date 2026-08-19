# ViNha Content Polish — Batch 3: Onboarding

## Summary

Rewrote the complete onboarding message set in Vietnamese and English while
preserving all 27 keys, interpolation contracts, validation, routes, preset
values, and household creation behavior.

The copy now explains the setup task in plain language: name the shared
household space, skip inviting a member for now, create a cash account to track
money, and choose the initial Jar layout. Removed “seeds”, mixed product nouns,
`Home` from Vietnamese copy, Auth/database details, and translated brand
metaphors.

No UI layout, onboarding step, server action, database function, preset
configuration, default balance, role, or permission was changed.

## Flow inspected

The repository contains a three-screen wizard:

1. **Household:** the user enters a household name. Client validation requires
   at least two characters.
2. **Member awareness:** the screen explains that another household member can
   be invited later. No invitation is created in onboarding.
3. **Account and starter Jars:** the user names the first cash account and
   chooses `balanced` or `simple`. Client validation requires a non-empty
   account name.

On submit, the server-side create operation calls the existing household RPC.
That operation creates the household, the creator's admin membership, one cash
account, and the starter Jars for the selected preset, then redirects to the
localized Home route. No opening balance is requested or created by this flow.

The page redirects unauthenticated users to login and users with an existing
active membership to Home. The existing error mapping remains unchanged:
`unconfigured`, `unauthenticated`, `already_member`, `invalid`, and `unknown`.

## Terminology introduced

- **Household:** introduced as the shared financial space and used consistently
  as `hộ gia đình` in Vietnamese.
- **Member/partner:** onboarding uses `thành viên` / `member` because the flow
  is about future membership. The relationship term `đối tác` is not needed
  on these screens.
- **Account:** described as the place that tracks money the user has, and
  explicitly distinguished from a Jar and a budget. The existing cash-account
  field remains unchanged.
- **Jar:** introduced as a way to divide spending and saving plans by purpose;
  the copy does not imply bank movement or automatic money control.
- **Plan preset:** presented as a starter Jar layout, so the user understands
  that the choice creates an initial structure. The existing `balanced` and
  `simple` values and their exact Jar lists are unchanged. Existing Jar edit
  behavior supports the statement that the Jars can be adjusted later.

## Representative rewrites

### Vietnamese

- `Đặt tên hộ gia đình` → `Đặt tên cho hộ gia đình`
- `Một hộ gia đình đang hoạt động cho bạn và đối tác.` → `Tên này giúp bạn
nhận biết không gian tài chính chung.`
- `Mời đối tác sau` → `Mời thêm thành viên sau`
- `...Money, Plan và Inbox hằng ngày vẫn bình đẳng giữa các đối tác.` → `Sau
khi hoàn tất thiết lập, bạn có thể mời thêm thành viên vào hộ gia đình.
Không cần mời ngay để tiếp tục.`
- `Hạt giống tiền và kế hoạch` → `Tạo tài khoản và chọn hũ`
- `Gói kế hoạch` → `Mẫu hũ ban đầu`
- `Hoàn tất và vào Home` → `Hoàn tất`
- `Thiết lập chưa sẵn sàng. Kiểm tra cấu hình Auth và cơ sở dữ liệu.` → `Chưa
thể hoàn tất thiết lập lúc này. Thử lại sau.`

### English

- `Partners later` → `Invite a member later`
- `Daily Money, Plan, and Inbox stay equal for partners.` → `After setup, you
can invite another member to your household. You do not need to invite
anyone now.`
- `Money and plan seeds` → `Create an account and choose Jars`
- `Plan preset` → `Starter Jar layout`
- `Finish and go to Home` → `Finish`
- `Setup is unavailable. Check Auth and database configuration.` → `Setup is
unavailable right now. Try again later.`
- `Something went wrong. Try again.` → `Could not complete setup. Try again.`

## Education removed or simplified

- Removed the translated “money and plan seeds” metaphor.
- Removed internal `Auth` and database configuration instructions from the
  user-facing error state.
- Removed `Money`, `Plan`, `Inbox`, `Together`, and `Home` from normal
  Vietnamese onboarding sentences.
- Replaced the equality/partner explanation with the actual invitation
  behavior: invitation happens after setup and is optional at this point.
- Replaced ambiguous “Balanced” / “Simple” presentation with descriptions of
  the number and purpose of starter groups, without changing the underlying
  preset configuration.
- Kept the account/Jar distinction short enough for the existing third screen;
  ledger architecture, allocation internals, and financial recommendations
  were not introduced.

## UX-content issues

The following questions are intentionally deferred because wording alone cannot
resolve them without changing the interaction:

- The final action creates several records at once, but the wizard has no
  review/receipt screen showing the household, cash account, and starter Jars
  before submission.
- The starter layout choice shows category names but not a compact preview of
  exactly what will be created; the current RPC creates Jars only, so no
  percentages or financial recommendation were invented here.
- “Cash account” is a manual tracking concept in this flow, but the UI does not
  explicitly state whether users may interpret it as a bank-connected account.
  The copy explains what it tracks without claiming bank connectivity.
- Household-name editing is not exposed by the current application flow, so no
  claim that the name can be changed later was added.

## Browser verification

- Targeted Playwright Chromium onboarding smoke was attempted with the local
  E2E environment.
- Unauthenticated `/en/together/onboard` redirected to `/en/login` as
  expected.
- The authenticated onboarding test could not reach Home or onboarding; the
  supplied E2E login remained at `/en/login` and timed out after 20 seconds.
- No household was created and no submit action was performed.
- Authenticated onboarding copy could not be visually verified for Vietnamese
  or English, and 390px, 440px, 768px, and 1280px onboarding viewport checks
  were not run because authentication did not reach the wizard.

## Validation

- **JSON parse:** pass — all 44 locale JSON files parsed.
- **Key parity:** pass — Vietnamese and English key sets match across 3,000
  paired leaf messages.
- **ICU/interpolation parity:** pass — no argument mismatches.
- **Scoped terminology search:** pass — no inappropriate Vietnamese onboarding
  message values or English implementation terms were found after searching
  leaf values with whole-word matching.
- **Onboarding-focused unit tests:** pass — `i18n-messages.test.ts` and
  `create-household.test.ts`, 10 tests total.
- **Full tests:** pass — 120 files, 901 tests.
- **Lint:** pass — `npm run lint`.
- **Typecheck:** pass — `npm run typecheck`.
- **Build:** pass — `npm run build`.
- **Targeted format check:** pass — Prettier checked both onboarding locale
  files and this report.
- **Repository format check:** not clean — `npm run format:check` reports
  2,206 pre-existing out-of-format files; the changed files pass the targeted
  check and no unrelated files were reformatted.
- **Browser smoke:** partially pass — unauthenticated redirect passed; the
  authenticated onboarding case was blocked at login as described above.
