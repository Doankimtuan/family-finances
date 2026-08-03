# Account evolution — decision log

Status: ACTIVE  
Scope: Money > Accounts recovery vs Product Definition v2.1.0  
Decided: 2026-08-03

## D-01 — Credit cards stay Product-aligned (option 1A)

**Decision:** Do not restore legacy first-class `credit_card` accounts, billing months/items, FIFO settlement, statement/due UX, utilization bars, cashback, or auto-pay in this pass.

**Rationale:** Product Feature Challenge Matrix merges V1 cards into F-Money as **EMI/installments** (“not a billing dump”). Architecture and rewrite schema omit `credit_card` from `accounts.type`. Normative AC is installment completion only (REQ-011 / AC-011 / BR-11).

**Disposition of legacy CC depth:** Documented in `credit-card-analysis.md` as **proposal / remaining roadmap**. Implementation requires an explicit Product SoT change before coding.

## D-02 — Full Accounts MVP this pass

**Decision:** Ship artifacts + Accounts UX/lifecycle MVP:

- Household Real Position framing (ownership = shared ledger, not per-member)
- Available balance on liquid accounts
- Light account health chips (balance-based)
- Quick actions on detail
- Progressive create with opening balance
- Edit (name + type) and archive (soft)
- Cash vs credit IA via links to existing debts / term savings / EMI products (BR-01)

**Out of this pass:** Transfers, CC billing, restore archived, post-create opening-balance mutation, brokerage create option, Product SoT edits.

## D-03 — No Product / Architecture SoT rewrite

**Decision:** Do not edit Product Definition, Architecture, or Tech Spec CURRENT packs to re-authorize billing-cycle credit cards.

**Rationale:** Developer Constitution forbids redesigning Product/Architecture. Valuable legacy behaviors missing from Product are proposals only until Product owns them.
