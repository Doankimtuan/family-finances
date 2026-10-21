# Phase 2D — Authenticated browser smoke

**Status: PASS**

The local Next.js 16.3.1 app used the verified development/test Supabase project. Account A logged in, created a 12,000,000 VND, 12%, 12-month declining-balance loan, opened its detail and schedule pages, and reloaded the detail. Account B, a partner in the same synthetic household, then opened the same saved loan and saw the same principal and next payment.

The detail showed 12,000,000 VND remaining principal, a 1,120,000 VND next payment, 1,000,000 VND principal plus 120,000 VND interest, and 12,780,000 VND total repayment. The schedule showed twelve monthly entries; October 21, 2027, installment 12 ends with zero remaining balance. The loan remained separate from liquid account balances.

Both authenticated sessions were captured at a 440 × 900 viewport. No browser console errors were reported. The full 2027 schedule evidence shows installments 3–12; the 2026 schedule page contained installments 1–2. Screenshots are stored with this report:

- [Account A loan detail, 440 × 900](evidence/loan-detail-a-440.png)
- [Account B shared loan detail, 440 × 900](evidence/loan-detail-b-440.png)
- [Account A full 2027 schedule](evidence/loan-schedule-a-2027.png)

The browser flow used temporary identities and loan fixtures only. Those records were removed and the database returned to its pre-run loan counts. This was a focused manual Playwright browser smoke, not the repository’s full end-to-end suite.
