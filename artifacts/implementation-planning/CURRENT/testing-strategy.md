# Multi-Tier Testing Strategy — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Testing Pyramid Architecture

ViNha enforces a **Multi-Tier Quality Assurance Strategy** spanning 6 testing layers to guarantee financial accuracy and operational stability.

```
                  /\
                 /  \  E2E Business Scenarios (Playwright)
                /----\
               /      \  Integration & Event Tests (Vitest)
              /--------\
             /          \  Unit Tests (Vitest / Jest)
            /------------\
           /              \  Constitutional & BR Enforcement Tests
          /----------------\  Security & Accessibility (a11y) Audits
```

---

## 2. Test Layer Specifications

| Test Tier | Target Scope | Key Testing Focus & Automated Suite | Minimum Pass Criteria |
|---|---|---|---|
| **Tier 1: Unit** | Domain Entities, Calculators, Helpers | Business rules, Jar balance updates, refund calculations. | 100% Pass, $\ge 90\%$ Coverage |
| **Tier 2: Integration** | Repositories, Services, Event Handlers | Database transactions, 3-way correction chains, typed Inbox handlers. | 100% Pass |
| **Tier 3: E2E Scenarios** | User Journeys, UI Workflows | Month Ritual workflow, emergency reallocation UI, refund linking flow. | 100% Pass |
| **Tier 4: Constitutional** | BR-01 & BR-24 Compliance | Verification that Jar movements execute `$0.00` ledger transactions and Health makes zero writes. | 100% Pass (Zero Exceptions) |
| **Tier 5: Accessibility** | Mobile UI Components | Touch targets, screen reader ARIA labels, color contrast (WCAG 2.1 AA). | Zero Violations |
| **Tier 6: Security & Load** | API Endpoints & DB Connections | Auth middleware, read-only replica bounds, rate limiting. | Zero Security Vulnerabilities |
