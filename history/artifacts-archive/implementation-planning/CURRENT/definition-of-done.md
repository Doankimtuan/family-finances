# Definition of Done (DoD) Framework — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Multi-Level Definition of Done (DoD)

To guarantee software excellence, every Task, Story, and Sprint MUST satisfy its respective Definition of Done prior to sign-off.

---

## 2. Technical Task DoD
- [ ] Code strictly follows TypeScript strict mode with zero type suppressions (`any`).
- [ ] All constants, path strings, and enums imported from home constants files (No magic strings).
- [ ] Code passes Biome / ESLint and Prettier formatting checks without warnings.
- [ ] Unit test written and passing for task logic with $\ge 90\%$ line coverage.

---

## 3. User Story DoD
- [ ] All Given-When-Then Acceptance Criteria (AC) verified via automated integration or E2E tests.
- [ ] **BR-01 Check**: Plan movements execute `$0.00` ledger transactions.
- [ ] **BR-24 Check**: Health components make zero write calls or database mutations (`Health-RO`).
- [ ] UI components pass accessibility audit (WCAG 2.1 AA compliant, keyboard navigable).
- [ ] Code reviewed and approved by 2 senior engineers.

---

## 4. Sprint DoD
- [ ] 100% of selected sprint stories satisfy Story DoD.
- [ ] Zero open P1/P2 regression bugs.
- [ ] Automated regression suite passes 100%.
- [ ] Staging deployment verified and signed off by Implementation Planning Board.
