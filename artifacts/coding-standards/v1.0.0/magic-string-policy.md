---
document: Magic String Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Magic String Policy

## Rule

Never hardcode a literal from any of the categories below at a call site. Define it once in [Constants Policy](./constants-policy.md) homes and import it.

| Category | Forbidden example | Required |
|----------|-------------------|----------|
| Route paths | `href="/money/transactions/${id}"` | `href={moneyTransactionPath(id)}` from `RoutePath` / `app-path.ts` builders |
| localStorage keys | `"vinha.auth.rememberEmail"` inline | `StorageKey.AUTH_REMEMBER_EMAIL` |
| Query keys (TanStack Query) | `["transactions"]` inline | `QueryKey.TRANSACTIONS` |
| Mutation keys | `"updateTransaction"` inline | `MutationKey.UPDATE_TRANSACTION` |
| API paths | `"/auth/confirm"` inline | `AUTH_ADAPTER_CONFIRM_PATH` |
| Event names | `"transaction:created"` inline | module event constant |
| Permissions / roles | `"admin"` inline | `HOUSEHOLD_ROLE.ADMIN` |
| Transaction types / statuses | `"income"` / `"pending"` inline | `TransactionDirection` / `INVITATION_STATUS.PENDING` |
| Feature flags | `"new-inbox-ui"` inline | `FeatureFlag.NEW_INBOX_UI` |
| Cookie names | `"NEXT_LOCALE"` inline | `LOCALE_COOKIE_NAME` |
| Theme names | `"dark"` inline | `ThemeMode.DARK` |
| Locale names | `"en-VN"` inline | `toIntlLocale(locale)` / `Locale.EN` |

Comparisons, switch cases, object keys, and default parameter values are all "call sites" — the rule applies to all of them, not only to variable assignment.

## Why this matters here specifically

This is the single highest-signal AI code smell found in the repository audit:

- 4 money screens hardcode `` `/money/transactions/${id}` ``, `` `/money/transactions/${id}/edit` ``, and `` `/money/accounts/${id}` `` even though `moneyTransactionPath` / `moneyAccountPath` already exist in `app-path.ts`.
- `REMEMBER_KEY = "vinha.auth.rememberEmail"` is declared as a file-local constant instead of a shared `StorageKey`.
- 9 Playwright specs hardcode `"/together/onboard"` instead of importing `APP_PATH.ONBOARD`.
- Onboard hardcodes `"en-VN"` / `"Asia/Ho_Chi_Minh"` / `"VND"` instead of reusing `toIntlLocale` and shared defaults.

These are exactly the kind of literal duplication that silently drifts (e.g., renaming a route in one file but not the other) and that this policy exists to prevent going forward.

## Allowed exceptions

- One-off values with no reuse potential and no product meaning (e.g., a CSS `aria-label` string that is already localized via `t(...)`, a `data-testid` value — see [naming-policy.md](./naming-policy.md) for `data-testid` conventions).
- Values already passed through i18n (`t("key")`) — the *translation key* is a message-catalog concern (Localization SoT), not a magic string under this policy. The *underlying English/Vietnamese copy* must never be hardcoded — that rule is unchanged from the Constitution's `design-rules.md`/localization law.
- Test fixtures explicitly asserting exact route strings for regression safety may reference the constant directly (`APP_PATH.ONBOARD`) rather than re-deriving it — never a re-typed literal.

## Review gate

Any of the following **fails** review (see [review-checklist.md](./review-checklist.md)):

- A hardcoded route string where a `RoutePath` / `APP_PATH` entry or builder already exists or should exist.
- A hardcoded storage/query/mutation key.
- A hardcoded status/type/role/permission string that has (or should have) a shared constant.
- A hardcoded locale, cookie, or theme name.
