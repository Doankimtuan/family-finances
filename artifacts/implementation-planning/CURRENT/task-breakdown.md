# Technical Task Breakdown — ViNha Implementation Master Plan

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Task Breakdown Structure

Each Story is broken down into 4 mandatory technical tasks: **DB / Schema**, **Backend / API**, **Frontend / UI**, and **Testing / QA**.

---

## 2. Granular Task Breakdown Matrix (72 Technical Tasks)

| Story ID | Technical Task ID | Component Layer | Technical Task Description |
|---|---|---|---|
| **ST-E01-001** | `TSK-E01-001-DB` | Database | Add `jar_id` FK column to `categories` table with `ON DELETE RESTRICT`. |
| **ST-E01-001** | `TSK-E01-001-BE` | Backend | Update `CategoryApplicationService.createCategory()` to require `jar_id`. |
| **ST-E01-001** | `TSK-E01-001-FE` | Frontend | Add required Jar selection dropdown to Category creation UI modal. |
| **ST-E01-001** | `TSK-E01-001-QA` | Testing | Unit test verifying unmapped category rejection (AC-CAT-01). |
| **ST-E01-002** | `TSK-E01-002-DB` | Database | Add `reverses_transaction_id` nullable FK column to `transactions` table. |
| **ST-E01-002** | `TSK-E01-002-BE` | Backend | Create `POST /api/v2/transactions/refund` service linking refund to original. |
| **ST-E01-002** | `TSK-E01-002-FE` | Frontend | Build refund linking UI prompt allowing user to select original expense. |
| **ST-E01-002** | `TSK-E01-002-QA` | Testing | Integration test verifying Jar capacity restoration on refund (AC-TRN-01). |
| **ST-E01-003** | `TSK-E01-003-DB` | Database | Add `corrects_transaction_id` nullable FK column to `transactions` table. |
| **ST-E01-003** | `TSK-E01-003-BE` | Backend | Create atomic 3-way transaction correction service (`Reversed`, reversal, correction). |
| **ST-E01-003** | `TSK-E01-003-FE` | Frontend | Build transaction correction modal and correction audit chain UI expander. |
| **ST-E01-003** | `TSK-E01-003-QA` | Testing | Unit test verifying net balance impact of 3-way correction chain (AC-TRN-02). |
| **ST-E02-001** | `TSK-E02-001-DB` | Database | Create `plan_movements` table with `$0.00` ledger impact constraint. |
| **ST-E02-001** | `TSK-E02-001-BE` | Backend | Create `POST /api/v2/jars/reallocate` API service for virtual Jar capacity movement. |
| **ST-E02-001** | `TSK-E02-001-FE` | Frontend | Render Jar reallocation UI slider with clear virtual capacity warning banner. |
| **ST-E02-001** | `TSK-E02-001-QA` | Testing | Automated test verifying bank account balance is untouched on plan movement (AC-JAR-01). |
| **ST-E02-002** | `TSK-E02-002-DB` | Database | Add `is_emergency` boolean and `intent_note` text to `plan_movements` table. |
| **ST-E02-002** | `TSK-E02-002-BE` | Backend | Update reallocation handler to bypass BR-07 warning modal when `is_emergency = true`. |
| **ST-E02-002** | `TSK-E02-002-FE` | Frontend | Add "Declare Emergency" checkbox and mandatory intent note text input to reallocation modal. |
| **ST-E02-002** | `TSK-E02-002-QA` | Testing | Test verifying modal bypass when emergency box is checked (AC-JAR-02). |
| **ST-E02-003** | `TSK-E02-003-DB` | Database | Schema verify for emergency event log. |
| **ST-E02-003** | `TSK-E02-003-BE` | Backend | Publish `EmergencyDeclaredEvent` to send high-priority alert to partner device (BR-13). |
| **ST-E02-003** | `TSK-E02-003-FE` | Frontend | Render emergency alert banner on partner's device with intent note context. |
| **ST-E02-003** | `TSK-E02-003-QA` | Testing | End-to-end test verifying partner device receives emergency notification. |
| **ST-E03-001** | `TSK-E03-001-DB` | Database | Add `type` discriminator enum column to `review_items` table. |
| **ST-E03-001** | `TSK-E03-001-BE` | Backend | Build strongly-typed `ReviewItem` schema validators (`UnmappedExpense`, etc.). |
| **ST-E03-001** | `TSK-E03-001-FE` | Frontend | Render Inbox decision queue with type-specific icon headers and payloads. |
| **ST-E03-001** | `TSK-E03-001-QA` | Testing | Unit test verifying typed ReviewItem instantiation (AC-INB-01). |
| **ST-E03-002** | `TSK-E03-002-DB` | Database | Add `source` and `pattern_id` columns to `transactions` table. |
| **ST-E03-002** | `TSK-E03-002-BE` | Backend | Build pattern auto-resolution policy engine (`confidence_score` $\ge 0.90$). |
| **ST-E03-002** | `TSK-E03-002-FE` | Frontend | Show pre-filled category/jar suggestions on pattern-generated ReviewItems. |
| **ST-E03-002** | `TSK-E03-002-QA` | Testing | Test verifying silent auto-resolution of high-confidence pattern matches. |
| **ST-E03-003** | `TSK-E03-003-DB` | Database | Add `expires_at` timestamp column to `review_items` table. |
| **ST-E03-003** | `TSK-E03-003-BE` | Backend | Create temporal worker to expire payment reminders > 7 days past due (BR-15). |
| **ST-E03-003** | `TSK-E03-003-FE` | Frontend | Render Archived tab in Inbox for expired and auto-resolved items. |
| **ST-E03-003** | `TSK-E03-003-QA` | Testing | Automated test verifying premature maturity resolution cancels alert cascade (BR-21). |
| **ST-E04-001** | `TSK-E04-001-DB` | Database | Add `status` enum ('Draft', 'InReview', 'PendingReview', 'Approved') to `month_rituals`. |
| **ST-E04-001** | `TSK-E04-001-BE` | Backend | Build scheduled background worker for 30-day temporal auto-lock (`PendingReview`). |
| **ST-E04-001** | `TSK-E04-001-FE` | Frontend | Render read-only locked status banner on auto-locked month rituals. |
| **ST-E04-001** | `TSK-E04-001-QA` | Testing | Test verifying 30-day auto-lock transitions ritual to `PendingReview` (AC-RIT-01). |
| **ST-E04-002** | `TSK-E04-002-DB` | Database | Schema verify for divergence query. |
| **ST-E04-002** | `TSK-E04-002-BE` | Backend | Build Month Ritual Step 1 Category-Jar Divergence Check gate endpoint. |
| **ST-E04-002** | `TSK-E04-002-FE` | Frontend | Build Step 1 UI blocking ritual progression if unmapped categories exist. |
| **ST-E04-002** | `TSK-E04-002-QA` | Testing | Test verifying Step 1 gate blocks progression until mapping is resolved. |
| **ST-E04-003** | `TSK-E04-003-DB` | Database | Add `consecutive_completed_rituals` counter column to `households`. |
| **ST-E04-003** | `TSK-E04-003-BE` | Backend | Build Step 3 Emergency Reflection query and Quick Close eligibility checker (BR-23). |
| **ST-E04-003** | `TSK-E04-003-FE` | Frontend | Render Emergency Reflection card in Step 3 and 1-tap Quick Close summary card. |
| **ST-E04-003** | `TSK-E04-003-QA` | Testing | Test verifying Quick Close mode unlocks after 6 consecutive completed rituals. |
| **ST-E05-001** | `TSK-E05-001-DB` | Database | Create unified calendar projection query indexing recurring patterns, card due dates, and debt payoff dates. |
| **ST-E05-001** | `TSK-E05-001-BE` | Backend | Build `GET /api/v2/calendar/events` multi-domain aggregation service. |
| **ST-E05-001** | `TSK-E05-001-FE` | Frontend | Build Calendar data provider state management store. |
| **ST-E05-001** | `TSK-E05-001-QA` | Testing | Integration test verifying calendar aggregates events across 3 domains (AC-CAL-01). |
| **ST-E05-002** | `TSK-E05-002-DB` | Database | Schema verify for cash flow balance calculation. |
| **ST-E05-002** | `TSK-E05-002-BE` | Backend | Build cash flow deficit prediction algorithm comparing scheduled bills vs expected balances. |
| **ST-E05-002** | `TSK-E05-002-FE` | Frontend | Render mobile interactive Calendar grid view with low-balance warning indicators. |
| **ST-E05-002** | `TSK-E05-002-QA` | Testing | Unit test verifying low balance warning fires on deficit date. |
| **ST-E05-003** | `TSK-E05-003-DB` | Database | Schema verify for installment payoff flag. |
| **ST-E05-003** | `TSK-E05-003-BE` | Backend | Build debt payoff milestone handler triggering `InstallmentComplete` ReviewItem. |
| **ST-E05-003** | `TSK-E05-003-FE` | Frontend | Render payoff milestone badge on Calendar and celebration modal. |
| **ST-E05-003** | `TSK-E05-003-QA` | Testing | Test verifying debt payoff triggers cash flow reallocation prompt. |
| **ST-E06-001** | `TSK-E06-001-DB` | Database | Configure read-only database connection user and replica pool for `modules/health/`. |
| **ST-E06-001** | `TSK-E06-001-BE` | Backend | Implement `HealthReadOnlyDbContext` enforcing zero write calls (BR-24). |
| **ST-E06-001** | `TSK-E06-001-FE` | Frontend | Render financial health score cards and trend charts on Home view. |
| **ST-E06-001** | `TSK-E06-001-QA` | Testing | Automated test attempting write query from Health module -> verify rejection (AC-HLT-01). |
| **ST-E06-002** | `TSK-E06-002-DB` | Database | Create `ai_audit_logs` table recording all AI suggestions and explicit user approvals. |
| **ST-E06-002** | `TSK-E06-002-BE` | Backend | Build AI Non-Invention Policy Guard middleware enforcing BR-14 non-invention rules. |
| **ST-E06-002** | `TSK-E06-002-FE` | Frontend | Render AI suggestion cards with mandatory explicit user confirmation buttons. |
| **ST-E06-002** | `TSK-E06-002-QA` | Testing | Security test verifying AI cannot trigger money movement without user approval. |
| **ST-E06-003** | `TSK-E06-003-DB` | Database | Run full database migration validation and index optimization. |
| **ST-E06-003** | `TSK-E06-003-BE` | Backend | Run full integration test suite and API benchmark. |
| **ST-E06-003** | `TSK-E06-003-FE` | Frontend | Run Playwright E2E suite, accessibility audit (a11y), and bundle size check. |
| **ST-E06-003** | `TSK-E06-003-QA` | Testing | Sign-off GA readiness verification report. |
