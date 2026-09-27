# Final Design Defect Log — ViNha Design QA

**Audit Gate**: Task 13 Final Design QA  
**Scope**: All 55 canonical screen pairs, Task 11 Component System, and Cross-Domain Reference Board  
**Target Quality Gate**: **P0 = 0, P1 = 0, P2 = 0 (ALL DEFECTS RESOLVED & VERIFIED)**

---

## 1. Final Design Defect Audit Table

| ID         | Screen / Component                  | Severity | Defect Description                                                                                                                | Applied Fix & Normalization                                                                                                               | Verified Status |
| ---------- | ----------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **DEF-01** | `SCR-08` Savings Overview           | **P0**   | Direct inline settlement buttons bypassed destination account picker, risking unallocated funds in the double-entry ledger.       | Removed inline settlement affordances in `ba345835...` (Light) and `2a88b26d...` (Dark). Settlement routed through detail flow.           | **VERIFIED**    |
| **DEF-02** | `SCR-09` / `SCR-55` Opening Balance | **P0**   | Initial balance entry fields lacked explicit disclaimer microcopy, allowing confusion between opening capital and monthly income. | Added mandatory callout banner: _"Khoản này không tính là thu nhập mới của tháng"_, wired to `record_opening_balance`.                    | **VERIFIED**    |
| **DEF-03** | `SCR-01` Home Dashboard             | **P1**   | Light canonical had divergent layout structure from Dark canonical (split liquid cash hero vs single net wealth card).            | Re-generated Light canonical (`c48a58d9...`) to synchronize 1-to-1 with Dark canonical (`d4a4d84e...`) in hero, chart, and pillars.       | **VERIFIED**    |
| **DEF-04** | `SCR-05` Decision Inbox             | **P1**   | Exploratory design presented "Smart Batch Assistant / Tái tục nhanh 6 sổ", which lacked backend database transaction support.     | Eliminated batch assistant; created dedicated Task 09 suite (`SCR-41` to `SCR-45`) enforcing strict individual decision contracts.        | **VERIFIED**    |
| **DEF-05** | `SCR-03` Fast Add Transaction       | **P1**   | Form contained unbacked live jar budget impact simulation requiring non-existent form loader data.                                | Removed unbacked budget simulation; streamlined into a 5-second fast add sheet (`8df9a911...`) with category-to-jar mapping.              | **VERIFIED**    |
| **DEF-06** | `SCR-06` Together Hub               | **P1**   | Displayed unbacked spending review thresholds (`> ₫ 1M`) and renewal policy selectors not supported by the tenancy schema.        | Redesigned into dedicated Task 10 suite (`SCR-46` to `SCR-50`) strictly bound to verified schema policies.                                | **VERIFIED**    |
| **DEF-07** | `SCR-02` Money Overview             | **P2**   | Domain cards experienced awkward badge text wrapping on narrow 360px viewports when titles exceeded 16 characters.                | Polished in `31dcf3d3...` (Light) and `b7af0cf4...` (Dark) with clean 2-line rhythm: title on line 1, status pill on line 2 (`shrink-0`). | **VERIFIED**    |
| **DEF-08** | `DS-01` Dark Component Board        | **P2**   | Pre-refresh Dark component board used overly saturated neon green for income tokens, causing glare on dark backgrounds.           | Re-calibrated to refined Warm Precision emerald (`#34D399`) and mint teal (`#2DD4BF`) in canonical `b07644fd...`.                         | **VERIFIED**    |
| **DEF-09** | `SCR-44` Inbox Archived Queue       | **P3**   | Read-only historical rows displayed active disclosure chevrons (`>`), falsely implying they were clickable navigation items.      | Replaced disclosure chevrons with static resolution badges (`Đã gán`, `Đã xác nhận`) in `aa797df4...` (Light) and `2898b2b5...` (Dark).   | **VERIFIED**    |
| **DEF-10** | `SCR-21` Sell Investment            | **P3**   | Sell flow lacked a prominent one-tap full liquidation CTA, requiring manual typing of fractional shares.                          | Added prominent `Tất cả (MAX)` pill button in `0f00e929...` (Light) and `05f20908...` (Dark).                                             | **VERIFIED**    |

---

## 2. Final Defect Summary

- **P0 Defects**: 2 identified $\rightarrow$ **2 resolved (0 open)**
- **P1 Defects**: 4 identified $\rightarrow$ **4 resolved (0 open)**
- **P2 Defects**: 2 identified $\rightarrow$ **2 resolved (0 open)**
- **P3 Defects**: 2 identified $\rightarrow$ **2 resolved (0 open)**

**Final Quality Gate**: **ALL DEFECTS RESOLVED & AUDITED (PASS)**
