# ViNha Content Polish — Batch 2: Auth & System

## Summary

Rewrote the scoped Auth and System copy in Vietnamese and English while
preserving all existing keys, interpolation contracts, routes, validation,
session behavior, permissions, and account lifecycle behavior.

The rewrite makes entry, password, confirmation, membership, permission,
offline, maintenance, and recoverable-error states shorter and more
actionable. It removes implementation terminology from user-facing messages.

## Auth flows covered

- Welcome and splash entry.
- Email/password sign-in, Google sign-in, and Apple sign-in.
- Sign-in validation and classified errors: invalid credentials, unavailable
  service, provider failure, and unknown failure.
- Email/password registration, OAuth registration entry, terms consent, and
  confirmation-email success state.
- Forgot-password request and reset-link delivery state.
- Auth confirmation adapter and confirmation screen for OAuth PKCE and email
  OTP links, including invalid/expired, cancelled, unknown, and account-linking
  conflict states.
- Money membership gate when an active household membership cannot be verified.
- Sign-out route and account lifecycle copy.
- Account deletion confirmation and classified error states. Deletion was not
  performed against any account.

The repository has no password-update screen after a recovery link, so the
reset-password completion flow could not be implemented in this copy-only batch.

## System states covered

- Recoverable system error with retry and home recovery.
- Offline state: available data remains viewable; a connection is required to
  save changes.
- Offline read-only continuation and mutation-offline escalation link.
- General permission denial and household-admin permission denial.
- Maintenance/unavailable state.
- Shared `ErrorState` fallback contract.
- Shared Auth password visibility accessibility labels.

## Representative rewrites

### Vietnamese

- `Đăng nhập chưa sẵn sàng. Kiểm tra cấu hình Auth.` →
  `Chưa thể đăng nhập lúc này. Thử lại sau.`
- `Không thể kết nối đăng nhập Google hoặc Apple. Kiểm tra nhà cung cấp Auth.`
  → `Không thể kết nối với Google hoặc Apple. Thử lại hoặc dùng email.`
- `Liên kết xác nhận không hợp lệ hoặc đã hết hạn. Hãy bắt đầu lại đăng nhập Google hoặc Apple từ màn hình đăng nhập.` →
  `Liên kết không hợp lệ hoặc đã hết hạn. Quay lại đăng nhập để thử lại.`
- `Thao tác này xóa vĩnh viễn người dùng Auth. Chính sách dữ liệu hộ gia đình vẫn có thể áp dụng. Không thể hoàn tác.` →
  `Thao tác này xóa vĩnh viễn tài khoản của bạn và đăng xuất khỏi ứng dụng. Không thể hoàn tác.`
- `Các thành viên cùng sử dụng Tiền, Kế hoạch và Hộp thư hằng ngày...` →
  `Thao tác này không khả dụng với quyền hiện tại. Hãy nhờ quản trị viên của hộ gia đình hỗ trợ.`

### English

- `Sign-in is unavailable. Check Auth configuration.` →
  `You can't sign in right now. Try again later.`
- `Could not reach Google or Apple sign-in. Check Auth providers.` →
  `We couldn't connect to Google or Apple. Try again or use email.`
- `This confirmation link is invalid or expired. Start Google or Apple sign-in again from the login screen.` →
  `This link is invalid or expired. Return to sign in and try again.`
- `This permanently removes your Auth user. Household data policy may still apply. This cannot be undone.` →
  `This permanently deletes your account and signs you out of the app. This cannot be undone.`
- `Household members share daily Money, Plan, and Inbox...` →
  `This action isn't available with your current access. Ask your household admin for help.`

## Implementation terminology removed

- `Auth`, Auth configuration, server Auth configuration, and Auth user from
  normal user-facing copy.
- Provider-configuration instructions from Google/Apple error messages.
- Project-level account-linking wording.
- Generic `Something went wrong` from the shared error fallback.
- Mixed product-noun explanation from the System permission body; approved
  product nouns remain available where they are the actual product label.

## Shared fallback handling

- **Show password / Hide password:** removed the English defaults from
  `AuthTextField`. Password reveal callers provide localized labels; the reveal
  control is not rendered when those labels are absent.
- **Something went wrong:** removed the shared English title fallback from
  `ErrorState`. Its existing callers now provide the localized title required
  by the component contract.

## UX-content issues

- Forgot-password sends a recovery link, but the repository has no screen or
  action for entering and saving a new password.
- Invalid/expired confirmation links use one Continue-to-login action for
  signup, OAuth, invite, and recovery link types; recovery and resend actions
  are not represented separately.
- Account deletion does not present a structured household/financial ownership
  impact summary. The copy avoids claims about retained or deleted records;
  the consequence contract should be clarified before stronger copy is added.
- Session-expiry and never-signed-in states are not separately mapped to a
  user-facing Auth message. Existing gates redirect or fail closed, so this
  batch did not invent a new state or change routing.
- The generic system error boundary cannot identify whether content is stale,
  unavailable, permission-limited, or session-related. It retains a generic
  retry/home recovery message until the interaction exposes that distinction.

## Validation

- **JSON parse:** pass — all 44 locale JSON files parsed.
- **Key parity:** pass — VI/EN keys match across the locale catalog.
- **ICU parity:** pass — no interpolation argument mismatches.
- **Auth-focused unit tests:** pass as part of the full suite — existing Auth
  session, registration/reset request, OAuth, linking, and account lifecycle
  tests remain green.
- **System tests:** pass as part of the full suite; browser smoke covered
  error, offline, permission, and maintenance screens.
- **Browser smoke:** pass in the in-app browser for VI and EN welcome/login/
  register/forgot-password, password visibility labels, invalid email,
  invalid confirmation link, offline, permission, maintenance, and error
  states. Targeted Playwright login/sign-out specs passed 9 tests; 2 tests were
  skipped because E2E credentials were not configured. No account deletion was
  attempted.
- **Lint:** pass — `npm run lint`.
- **Typecheck:** pass — `npm run typecheck`.
- **Full tests:** pass — 120 files, 901 tests.
- **Build:** pass — `npm run build`.
- **Format:** pass for all changed files with a targeted Prettier check;
  repository-wide `npm run format:check` remains non-clean because 2,206
  existing files are already out of format. No unrelated files were reformatted.
- **Remaining scoped terminology violations:** none in user-facing Auth/System
  locale values. `Together` remains in the Vietnamese System destination label
  by approved brand policy; `offline` remains only as the technical namespace
  key, not visible Vietnamese copy. English `Money` remains as the approved
  product label.
