# ViNha Content Foundation Implementation — Batch 1A

## Summary

Updated the global locale foundations in the scoped namespaces for Vietnamese
and English:

- applied the approved `Together` branded navigation label in Vietnamese;
- replaced the branded tagline and implementation-oriented metadata;
- rewrote shared empty-state, error, toast, offline, permission, and
  maintenance copy to be factual and actionable;
- removed implementation language from the scoped `system` messages;
- normalized the scoped catalog spelling from `Sức khoẻ` to `Sức khỏe`.

No keys, interpolation names, namespaces, business logic, routes, permissions,
financial calculations, or state transitions were changed.

## Product noun changes

- Vietnamese `navigation.together`: `Cùng nhau` → `Together`, retained as the
  intentional branded navigation label.
- Vietnamese shared empty states now use `dữ liệu tiền` and `thành viên`
  instead of ambiguous `tiền` and relationship-oriented `đối tác`.
- Existing scoped Vietnamese labels `Tiền`, `Kế hoạch`, and `Hộp thư` were
  retained as the approved product nouns.
- English product nouns remain `Money`, `Plan`, `Inbox`, `Together`, and `Jar`.

## Orthography normalization

- `Sức khoẻ` → `Sức khỏe`: 1 replacement in `messages/vi/catalog.json`.
- `Hủy`, `tùy`, `khóa`, and `xóa`: no replacement was needed in the scoped
  namespaces; the canonical forms were retained where already present.
- Remaining forbidden forms in scoped Vietnamese files: 0 occurrences for
  `Huỷ`, `tuỳ`, `Sức khoẻ`, `khoá`, and `xoá`.

## CTA/state changes

- Kept the existing global CTA baseline: `Lưu` / `Save`, `Hủy` / `Cancel`,
  `Xác nhận` / `Confirm`, and `Thử lại` / `Try again`.
- Changed the global offline retry label to the default retry convention and
  stated the supported behavior: available data can still be viewed, while a
  connection is required to save changes.
- Replaced generic error wording with a failure plus next action:
  `Không thể hoàn tất yêu cầu. Thử lại.` / `Could not complete the request.
Try again.`
- Made permission and maintenance messages distinguish access restrictions
  from temporary unavailability without exposing mutation, ledger, or queue
  implementation language.

## Important rewrites

- `Tiền chung, giữ bình yên.` → `Quản lý tiền chung cho hộ gia đình.`
- `Shared money, calmly kept.` → `Manage household money together.`
- `Nơi yên tĩnh cho những gì quan trọng hôm nay.` → `Tại đây hiển thị những
việc cần bạn chú ý hôm nay.`
- `A quiet place for what matters today.` → `See what needs your attention
today.`
- `Thay đổi Tiền và Kế hoạch cần kết nối... ghi ngoại tuyến vẫn bị chặn.` →
  `Bạn vẫn có thể xem dữ liệu đã có, nhưng cần kết nối để lưu thay đổi.`
- `Money and Plan changes need a connection... offline writes stay blocked.` →
  `You can still view available data, but you need a connection to save
changes.`
- `Why mutations are blocked` → `Why changes cannot be saved`.
- `Tài chính gia đình — không gian viết lại` → `Quản lý tài chính gia đình
cùng ViNha`.

## Deferred issues

- Auth copy and the deeper system/auth configuration and permission flow remain
  deferred to the dedicated Auth/System work.
- Module-specific Money, Plan, Inbox, Together, Health, Onboarding, and large
  Plan Goals funding-block rewrites remain deferred.
- `modules/investments/application/investment-ux.ts` remains deferred for the
  dedicated hardcoded i18n migration.
- The shared hardcoded fallbacks in `shared/ui/form/auth-text-field.tsx` and
  `shared/patterns/error-state.tsx` remain unchanged because localizing them
  safely requires a wider component/API decision.
- The audit's UX-dependent issues remain open, including stale/partial-data
  status behavior, public Plan stubs, Inbox handoff effect previews, and
  structured Together access-impact explanations.

## Validation

- JSON parse: pass — all 44 locale JSON files parsed successfully.
- Namespace/key parity: pass — VI and EN key sets match; 0 mismatches.
- ICU/interpolation parity: pass — 0 argument mismatches across 2,945 paired
  messages.
- Scoped Vietnamese orthography search: pass — 0 forbidden forms.
- Scoped Vietnamese terminology search: pass — 0 targeted occurrences of
  `Money`, `Plan`, `Inbox`, `Partner`, `Active`, `Suggest`, `ReviewItem`,
  `Auth`, `mutation`, or `story`.
- Scoped English implementation-term search: pass — 0 occurrences of
  `mutation`, `source module`, `Real Ledger`, or `story`.
- Lint (`npm run lint`): pass.
- Typecheck (`npm run typecheck`): pass.
- Tests (`npm run test`): pass — 120 files, 901 tests.
- Build (`npm run build`): pass.
- Format check: scoped implementation report check passes with Prettier;
  repository-wide `npm run format:check` is not clean because 2,207 existing
  files are already out of format. No unrelated files were reformatted.
- Remaining scoped terminology exception: `Together` remains in the
  Vietnamese navigation/system destination labels by approved brand policy.
