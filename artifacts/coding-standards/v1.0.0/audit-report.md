---
document: Audit Report
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
---

# Audit Report — Manual Review Required

Repository audit performed at freeze time against the active rewrite (`app/`, `modules/`, `shared/`; `archive/legacy-v1/` excluded — retired, out of scope). Items below are **not** auto-fixed in this board run because each requires a product/design/DB decision, not a mechanical rename. See [safe-refactor-log.md](./safe-refactor-log.md) for what *was* auto-fixed.

## 1. Capture / edit transaction form duplication

**Files:** `app/[locale]/(product)/money/transactions/capture-transaction-form.tsx` (298 lines), `app/[locale]/(product)/money/transactions/[id]/edit/edit-transaction-form.tsx` (394 lines).

Near-identical direction segmented control, account radio list, tag/category chips, jar select, and their long Tailwind class-ternary strings are duplicated between create and edit flows. Manual because: capture is a fire-and-forget create with optimistic UX; edit adds confirm-before-save/delete states and pre-fills from an existing transaction — extracting a shared form shell requires reconciling these state machines, not just moving JSX.

**Recommendation:** extract a shared `TransactionFormFields` pattern (direction segment, account list, tag chips, jar select) into `shared/patterns/`, parameterized by `mode: "create" | "edit"` only where behavior genuinely differs. Track as its own story under Engineering Review.

## 2. Onboard locale/timezone/currency literals

**File:** `app/[locale]/(onboard)/together/onboard/onboard-wizard-screen.tsx`

```ts
locale: locale === "vi" ? "vi-VN" : "en-VN",
timezone: "Asia/Ho_Chi_Minh",
baseCurrency: "VND",
```

`i18n/locales.ts` already maps `en -> en-US` via `toIntlLocale`, but onboard independently hardcodes `en -> en-VN`. This is a **possible product inconsistency** (which BCP-47 tag is correct for English UI in a Vietnam-based household?), not a pure refactor — renaming it without product sign-off could silently change stored household locale data. Flagging for product/architecture review rather than auto-fixing.

**Recommendation:** either (a) onboard should call `toIntlLocale(locale)` instead of re-deriving the tag, or (b) if `en-VN` is intentional (English UI, Vietnam region formatting), `toIntlLocale` should be corrected to match and a `Locale`/region constant introduced. Needs a product decision before either direction is coded.

## 3. Domain literal duplication feeding both Zod and UI

- `modules/ledger/application/transaction-types.ts` declares `TransactionDirection = "income" | "expense"` as a bare union; `record-transaction.ts` and `update-transaction.ts` each independently declare `z.enum(["income", "expense"])`; capture/edit forms each independently declare `(["expense", "income"] as const)` for their segmented control order.
- `modules/ledger/application/account-types.ts` declares the `AccountType` union; `create-account.ts` independently declares a matching `z.enum([...])` list.
- `modules/inbox/application/review-items.ts` uses raw `"pending"` / `"resolved"` string literals for inbox item status without a shared `as const` object.

**Why manual:** these unions back Postgres check constraints (ledger transactions/accounts) and RPC contracts (inbox resolve). Converting to a shared `as const` object per [Enums Policy](./enums-policy.md) is safe for the TypeScript/Zod layer, but must be verified against `supabase/migrations/*` constraint definitions in the same PR to avoid a silent drift between the TS-side allowed values and the DB-side constraint — a Rule-of-Three-safe mechanical string replace alone is not enough verification for money-path enums per BR-15.

**Recommendation:** introduce `TransactionDirection`, `AccountType`, and `InboxItemStatus` as `as const` objects in their owning module's `application` folder (pairing with existing `INVITATION_STATUS` precedent in tenancy), update Zod schemas to derive from `Object.values(...)`, and add a unit test asserting the TS-side value set matches the migration's `CHECK` constraint list.

## 4. Scattered `"VND"` currency default

~10 sites (`transaction-types.ts`, `get-real-position.ts`, `list-accounts.ts`, `review-items.ts`, several money page fallbacks) each hardcode `"VND"` as a fallback currency independently.

**Why manual:** introducing `DEFAULT_CURRENCY = "VND"` is mechanically simple, but this codebase is explicitly single-currency-locked per Business Rules (BR-01 real ledger) — confirming there is no multi-currency roadmap item that would make a shared constant premature is a product-scope question, not a pure refactor.

**Recommendation:** add `DEFAULT_CURRENCY` to `modules/ledger/application` (e.g., alongside `transaction-types.ts`) and replace the ~10 fallback sites once confirmed non-controversial.

## 5. Repeated signed-amount formatting

**Files:** `app/[locale]/(product)/money/page.tsx`, `.../money/transactions/page.tsx`, `.../money/accounts/[id]/page.tsx`, `.../money/transactions/[id]/page.tsx`

Each independently builds the same `` `${tx.type === "expense" ? "−" : "+"}${formatCurrency(...)}` `` template.

**Recommendation:** extract a `formatSignedAmount(transaction, locale)` helper into `shared/i18n/formatters.ts` (which already owns `formatCurrency`). Deferred to manual review only because it touches 4 call sites with slightly different destructuring context — low risk, but bundled with item 1's form-shell extraction work makes more sense than a standalone drive-by change.

## 6. Repeated CTA / segmented-control class blobs

~15 files repeat a long `inline-flex min-h-11 w-full items-center justify-center rounded-md ... focus-visible:outline-2 ...` class chain for link-styled buttons instead of composing the existing `Button`/`shared/ui` primitives or a link variant.

**Why manual:** promoting this into a `Button`-as-`Link` variant or a new `LinkButton` pattern is a design-system-adjacent decision (matches Engineering Review's `reusable-components.md` process) — not something this board should invent unilaterally per `ai-agent-rules.md` ("never create duplicate components... never bypass shared/ui").

**Recommendation:** raise as an Engineering Review Rule-of-Three candidate (`LinkButton` or a `Button` `as={Link}` polymorphic prop) in the next Engineering Review cycle.

## 7. Architecture doc drift (pre-existing, unrelated to this board)

`artifacts/architecture-definition/CURRENT/Folder-Structure.md` still promotes a root `components/` folder for shared UI, which conflicts with the Developer Constitution's `folder-rules.md` (root `components/` must not grow). This predates this board run and is **out of scope** — Architecture Definition is a separate frozen SoT that this board must not redesign. Flagged here only so it is not mistaken for a Coding Standards gap.

## 8. Motion token bracket form (`duration-[var(--duration-fast)]`, `ease-[var(--ease-standard)]`, `shadow-[var(--elevation-1)]`)

Observed alongside the radius codemod (item in [safe-refactor-log.md](./safe-refactor-log.md)) but **not** auto-fixed: several files use the bracket arbitrary-value form for duration/ease/shadow tokens instead of the paren `(--token)` form already used for spacing (e.g. `px-(--space-4)`). Unlike radius, Tailwind has no first-class `duration-fast` / `ease-standard` utility name to fall back to, so the fix is bracket-to-paren, not bracket-to-canonical-utility, and touches a different token category than this board was chartered to fix mechanically. Low priority; recommend a follow-up Coding Standards addendum once the Tailwind Policy's motion-token guidance is confirmed with the Design System board.

## Explicitly out of scope

- `archive/legacy-v1/**` — retired; not audited, not touched, per Constitution `ai-agent-rules.md` rule 13.
- Any change to Postgres migrations, RLS policies, or RPC contracts.
- Any change to Product/Architecture/Design System decisions.
