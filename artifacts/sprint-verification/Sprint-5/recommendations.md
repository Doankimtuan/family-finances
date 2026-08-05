# Recommendations — Sprint 5

File-level guidance only. This board does **not** implement fixes.

---

## R1 — Ship BR-11 ReviewItem (closes B1)

| Action | Path |
|--------|------|
| On installment final payment / status complete, create Inbox item typed `InstallmentComplete` | New ledger or inbox command; reuse `ReviewItemType.INSTALLMENT_COMPLETE` in `modules/inbox/application/inbox-constants.ts` + schemas |
| Do not pretend calendar projection equals settlement | Keep milestone tag; add real write on payoff |
| Celebration CTA should deep-link to the created item when present | `calendar-view.tsx` + `inboxItemPath` |

---

## R2 — Fix projection math (closes B2)

| Action | Path |
|--------|------|
| Stop hardcoding `dueDay: 1` | `modules/plan/application/queries/get-household-calendar.ts`; add `next_due_date` / due day on `installment_plans` (TD-S5-01 migration) |
| Cap or replace synthetic card amounts | `calendar-projection.ts` `projectCardDueEvents` — use statement remaining / minimum payment when available |
| Fix liability monthly delta | `projectLiabilityEvents` — use installment-like payment field, or emit single balloon event, never full `remainingAmount` each month |
| Add unit tests for each corrected rule | `tests/unit/plan-calendar.test.ts` |

---

## R3 — Tests (closes B3)

| Test | Suggested location |
|------|-------------------|
| Single call merges three sources with tags | Unit: `mergeAndSortEvents([...projectRecurring, ...card, ...installment])` + assert dates/sources |
| `getHouseholdCalendar` with fixtures/mocks | `tests/integration/` or mocked unit |
| Deficit banner / celebration selectors | Extend Playwright smoke for `/plan/calendar` |
| Assert via constants | `CalendarEventSource.*`, `InstallmentPlanStatus.ACTIVE`, `DEFAULT_CURRENCY` |

---

## R4 — Deep-links & UX hygiene

| Action | Path |
|--------|------|
| Resolve installment → correct money route (card account or plan detail) | `calendar-view.tsx` `eventHref` |
| Prefer `moneyCardPath` for cards using account id for `CARD_DUE` | Same file |
| Add prev/next month controls using `?month=` | `calendar-view.tsx` / page |
| Optionally pass `forecast` for day running balance | `page.tsx` props |

---

## R5 — Spec / catalog (SoT boards)

| Action |
|--------|
| Publish AC-CAL-01 GWT in Spec Sync acceptance repo (or stop citing it) |
| Align traceability module path to `modules/plan` CalendarSchedule |
| Decide REST adapter vs amend Tech Spec to RSC query |
| Rematerialize ST-E05-003 AC to BR-11 / InstallmentComplete, not AC-CAL-01 alone |
