---
document: Business Catalog
product_definition: v2.0.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_product_definition_20260801T144500Z
created_at: 2026-08-01T14:46:45Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Business Catalog

## V1 Business Rule Decisions

| V1 ID | Decision | Official ID | Reason | Impact | Migration | Dependencies |
|-------|----------|-------------|--------|--------|-----------|--------------|
| `br-real-vs-virtual` | **APPROVED** | `BR-01` | Core differentiator; non-negotiable. | None — retained as axiom. | Keep enforcement; update UI copy only. | — |
| `br-income-allocate` | **MODIFIED** | `BR-04` | Policy retained; default becomes Suggest; hide engineer enums in UX. | New households default Suggest; existing settings preserved until user changes. | Map income_auto_allocate off|suggest|auto_* → Off|Suggest|Auto; default Suggest for new. | F-Plan, F-Inbox |
| `br-expense-allocate` | **MODIFIED** | `BR-05` | Unmapped → Inbox ReviewItem (not buried jar queue jargon). | Review UX moves to Inbox; same resolution semantics. | Alias jar_review_queue items as Inbox ReviewItems in product model. | F-Inbox, F-Money |
| `br-jar-active` | **MODIFIED** | `BR-03` | Clarify Active/Paused/Archived labels; soft-delete narrative resolved. | State matrix documented; no ledger semantics change. | Document state matrix; map archived/soft-deleted to non-targets. | IMP-009, F-Plan |
| `br-closed-month` | **MODIFIED** | `BR-08` | Rename product concept to Month Ritual; lock semantics unchanged. | Terminology + UX ceremony; same freeze/correction rules. | Glossary: month close run → Month Ritual; keep DB concepts mapped. | F-Plan |
| `br-amount-positive` | **APPROVED** | `BR-06` | Accounting invariant remains. | None. | None. | — |
| `br-overspend-policy` | **MODIFIED** | `BR-07` | Default Warn for new households. | Safer default; existing households keep current policy. | Seed warn on create_household. | F-Together |
| `br-month-close-mode` | **MODIFIED** | `BR-09` | Default Assisted for couples. | Ritual UX prefers assisted confirmation. | Default assisted on new households. | F-Plan, F-Together |
| `br-assumptions-admin` | **MODIFIED** | `BR-13` | Admin may gate advanced assumptions; changes must be partner-visible (audit). | Removes silent sole-operator opacity. | Add audit/notification on assumption updates. | F-Together, Notification |
| `br-one-household` | **APPROVED** | `BR-12` | MVP constraint retained; multi-household is Future. | None for Now. | None. | — |
| `br-rls-member` | **APPROVED** | `BR-02a` | Security invariant. | None. | None. | Security |
| `br-savings-maturity` | **APPROVED** | `BR-10` | Maturity actions retained; UX becomes Inbox coach. | Presentation change. | Surface events in Inbox. | F-Inbox, F-Money |
| `br-installment-complete` | **APPROVED** | `BR-11` | Completion rule clear and valid. | None. | Celebrate in Health/Inbox. | F-Health |
| `br-action-context` | **APPROVED** | `BR-02` | Auth + membership required. | None. | None. | F-Auth |

## New Official Rules

| ID | Title | Statement | Phase |
|----|-------|-----------|-------|
| `BR-14` | AI non-invention | AI may explain/suggest from household data; must not invent balances or execute money movement without explicit user/policy path. | Phase 2 |
| `BR-15` | Online-first money mutations | Ledger and plan mutations require online connectivity. Offline read-only is Future; offline writes are out of scope permanently for v2. | Core |

## Official Rule Statements

See `Official-Domain-Model.md` and PRD. **No V1 rule left undecided.** Count V1=14.

Removed V1 rules: 0 (none — all retained as APPROVED or MODIFIED).
