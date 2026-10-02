# INBOX OVERVIEW — STITCH VISUAL PARITY REVIEW

## Status

PASS — Inbox Overview composition now follows the canonical Stitch design; remaining differences are classified below.

## Stitch

Light ID: `80394649d39f4c458d55e834611d45c2`  
Dark ID: `1efc32d2855745c6ae118f880dafefe1`  
Project ID: `16826760243481546078`  
Stitch MCP: both screens opened successfully.

Route: `/vi/inbox` (English verified at `/en/inbox`).

Evidence: [Stitch light](evidence/inbox-overview/stitch-light.png), [Stitch dark](evidence/inbox-overview/stitch-dark.png), [before, 440px Vietnamese dark](evidence/inbox-overview/current-before-440px-vi-dark.png), [after, 390px Vietnamese dark](evidence/inbox-overview/current-after-390px-vi-dark.png), [after, 440px Vietnamese dark](evidence/inbox-overview/current-after-440px-vi-dark.png), [after, 390px Vietnamese light](evidence/inbox-overview/current-after-390px-vi-light.png), [after, 440px Vietnamese light](evidence/inbox-overview/current-after-440px-vi-light.png), [after, 390px English dark](evidence/inbox-overview/current-after-390px-en-dark.png).

## Differences Found

21 grouped meaningful differences: 15 implementation defects fixed and 6 classified differences remaining.

## Differences Fixed

1. Header eyebrow/title hierarchy and spacing.
2. Summary card hierarchy, contents, and vertical rhythm.
3. Privacy control moved from the summary card to the header trailing area.
4. Open/Archived segmented control spacing and count treatment.
5. Search and filters separated into their own surfaces.
6. Selected filter count and horizontally scrollable filter chips.
7. A single queue heading/count replaces repeated type-group headings.
8. Mixed queue retains the live backend order.
9. Independent item cards replace the enclosing grouped list panel.
10. Removed urgency side-bars absent from Stitch.
11. Leading icon, status badge, and unread cue hierarchy.
12. Amount and action are separated into the card footer.
13. Savings maturity rows show the product/account name before lifecycle state.
14. Maturity date and available current rate use actual item data and centralized locale formatters.
15. Loading skeleton follows the final queue composition.

## Source Files

- `app/[locale]/(product)/inbox/inbox-chrome.ts`
- `app/[locale]/(product)/inbox/inbox-financial-amount.tsx`
- `app/[locale]/(product)/inbox/inbox-presentations.ts`
- `app/[locale]/(product)/inbox/inbox-privacy-toggle.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-list.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-row.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-skeleton.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-tabs.tsx`
- `app/[locale]/(product)/inbox/inbox-summary.tsx`
- `app/[locale]/(product)/inbox/page.tsx`
- `shared/patterns/inbox-row.tsx`
- `shared/patterns/top-app-bar.tsx`
- `tests/unit/inbox-scan-hierarchy.test.tsx`
- `tests/unit/inbox-ui-polish.test.tsx`

## Shared Components Changed

1. `InboxRow`: added a card presentation while preserving existing compact-row callers.
2. `TopAppBar`: supports the Inbox-specific eyebrow treatment and header trailing privacy action.

## Inbox Presentation

Hierarchy: PASS  
Grouping: PASS  
Filters: PASS  
Row density: PASS  
Status treatment: PASS  
Empty state: PASS — existing shared empty state retained.  
Loading state: PASS — skeleton aligned to the final composition.  
Error state: PASS — existing shared error presentation retained.

## Inbox Semantics

Item types preserved: PASS  
Pending semantics: PASS  
Resolved semantics: PASS  
Completed semantics: N/A — there is no `COMPLETED` state in the current model.  
Archived semantics: PASS  
Read ≠ Resolved: PASS — read state remains independent of resolution state.

The existing states (`PENDING`, `RESOLVED`, `DISMISSED`, `ACKNOWLEDGED`, `AUTO_RESOLVED`, `EXPIRED`, and `ARCHIVED`) remain distinct. Archive and detail actions continue through their existing product flows.

## Visual Parity

Section order: PASS  
Spacing: PASS  
Typography: PASS  
Rows: PASS  
Icons: PASS  
Dividers/surfaces: PASS  
Bottom Navigation relationship: PASS

## Data

Real data preserved: YES  
Invented Inbox logic: NO  
Mock / Logic Pending: 0

Open and archived items still come from `listOpenInboxPage` and `listArchivedInboxItems`. Original item order and records are preserved. Lifecycle dates use the centralized localized date formatter. Rates display only when present in the typed savings payload; the mapper's default `0` is suppressed because it does not prove that a real zero rate was supplied. No sample item or state was added.

Visible Stitch data classification: actual queue items are DIRECT DATA; localized lifecycle dates and display labels are DERIVED FROM VERIFIED EXISTING DATA; Stitch-only bell/language presentation without corresponding Inbox actions is NOT APPLICABLE; mock data count is zero.

## i18n

Vietnamese: PASS  
English: PASS

## Theme

Light: PASS  
Dark: PASS

## Responsive

360: PASS  
390: PASS  
430: PASS  
Long content: PASS

Also checked 440px, 768px, and 1280px. The 440px-centered shell remains intentional on wider viewports. Filter chips scroll inside their row and the document has no horizontal overflow. No content was hidden behind bottom navigation.

## Accessibility

List semantics: PASS  
Keyboard: PASS  
Focus: PASS  
Nested interactions: PASS  
Status semantics: PASS

Interactive rows expose an accessible name containing title, item type/status, read state, and next action. Keyboard focus is visible. Filter touch targets are at least 44px. Reduced-motion preference was checked.

## Validation

Typecheck: PASS  
Lint: PASS  
Tests: FAIL — Inbox-focused suites pass 43/43; full suite has 2 unrelated failures (1,573 passed / 1,575 total).  
Build: PASS — isolated build succeeded; emitted 29 CSS optimizer warnings for escaped utility classes.  
Browser QA: PASS

Unrelated full-suite failures:

- `tests/unit/investment-operation-form.test.tsx`: `InvestmentOperationForm > submits the semantic buy payload and resets the editable fields` cannot find label `opening.quantityLabel`.
- `tests/unit/motion-reveal-usage.test.ts`: `MotionReveal usage contract (B09) > keeps one hero-group reveal on Plan, Home, and Together` expects `tone="hero"` in the unrelated Together screen.

Inbox-focused verification: `inbox-scan-hierarchy.test.tsx`, `inbox-ui-polish.test.tsx`, `phase-12-inbox.test.tsx`, and `product-link-prefetch.test.ts` passed. Typecheck, lint, isolated production build, and `git diff --check` passed.

## Remaining Differences

1. **MOCK / LOGIC PENDING** — Stitch shows a bell and `VN` language chip; the Inbox has no notification action, and language settings live elsewhere. No inert or mock controls were added. To match later, the product needs real Inbox notification and language-selection actions.
2. **MOCK / LOGIC PENDING** — Stitch examples use per-item actions such as “Xem phương án” or “Gắn vào hũ”; Inbox Overview currently opens the existing detail/decision flow with its generic action label. Direct execution is not supported by Overview. Exact parity requires those actions to be provided by their real product flows.
3. **REAL DATA DIFFERENCE** — Stitch shows 14 sample items while the live Inbox currently has 17. The real queue count and contents are retained.
4. **RESPONSIVE ADAPTATION** — Stitch includes a device status bar and home indicator; the web route uses the product's app shell and browser viewport.
5. **ACCESSIBILITY ADAPTATION** — Filter chips maintain 44px minimum touch targets and scroll horizontally, making them slightly taller/scrollable compared with compact Stitch chips.
6. **REAL DATA DIFFERENCE** — Existing partner permission guidance appears below the live queue but not in Stitch; it is retained because it is actual product guidance.

## Verdict

INBOX VISUAL PARITY APPROVED
