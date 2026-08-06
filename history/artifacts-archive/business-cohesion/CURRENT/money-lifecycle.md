# Money Lifecycle — Complete Traces

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Every money flow from birth to end state. All 13 lifecycles traced.

**Health-RO note:** Where traces say “BR-14,” they mean the constitutional **Health is read-only** invariant (Health-RO). Product SoT BR-14 text is AI non-invention — see README SoT note and `business-smells.md` Smell 12.2.

---

## 1. Salary / Income Lifecycle

**Path:** Money enters → Account → Categorized → Jar-allocated → Goal-funded → Ritual-reviewed → Health-reflected

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Money arrives** | Accounts | Income hits a Real Account (bank deposit detected or manually entered) |
| S1 | **Transaction recorded** | Transactions | Income transaction created with amount, source, date |
| S2 | **Category assigned** | Categories | Transaction tagged (e.g., "Salary") — manually or via EO-01 auto-categorization |
| S3 | **Allocation decision** | Intention/Inbox | BR-04 kicks in: Off (do nothing), Suggest (Inbox shows suggestion), Auto (allocated automatically) |
| S4 | **Jar(s) funded** | Budgets/Jars | Income distributed across Active Jars per allocation rules. BR-03 enforces Active-only. |
| S5 | **Goal funding** | Goals | If jars are linked to goals, goal progress updates proportionally |
| S6 | **Ritual reviewed** | MonthRitual | At month close, income allocation reviewed against plan |
| S7 | **Health reflected** | Health | Income vs. plan reflected in Health score (read-only, BR-14) |
| S8 | **Next month planning** | Planning | Patterns inform next month's allocation |

### Domains Participating
Accounts, Transactions, Categories, Inbox, Budgets/Jars, Goals, MonthRitual, Health, Planning

### Business Rules Triggered
BR-01 (Real ≠ Virtual), BR-03 (Active jars only), BR-04 (Income placement policy), BR-05 (unmapped → Inbox if manually entered), BR-14 (Health read-only)

### Features Involved
EO-01 (auto-categorization), EO-05 (search confirmation)

### Decision Points
- D1: Auto vs. Suggest vs. Off for income allocation (BR-04 policy)
- D2: Which jars get how much if Suggest mode
- D3: Any adjustment during Month Ritual review

### Automation Points
- Auto-allocation per BR-04 in "Auto" mode
- Auto-categorization suggestion (EO-01)
- Calendar entry for recurring salary pattern (EO-03)

### BR-01 Validation
✅ Income hits Account (Real) first. Jar allocation is intention only. No money "lives" in jars.

### BR-14 Validation
✅ Health reads the salary lifecycle outcome — does not create it, modify it, or trigger it.

---

## 2. Expense Lifecycle

**Path:** Spending occurs → Transaction → Categorized → Jar tracked → Inbox (if unmapped) → Adjusted (if overspent) → Ritual-reviewed → Health-reflected

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Spending occurs** | External | Money leaves a Real Account |
| S1 | **Transaction recorded** | Transactions | Expense transaction: amount, payee, date, account |
| S2 | **Category assigned** | Categories | Auto-categorization (EO-01) suggests; user confirms or overrides |
| S3a | **Mapped path** | Budgets/Jars | Category matches a Jar → spending tracked against that Jar's allocation |
| S3b | **Unmapped path** | Inbox | No matching Jar → ReviewItem created (BR-05). User must resolve. |
| S4 | **Overspend check** | Budgets/Jars | BR-07 policy check: Warn, Block, or Allow negative |
| S5 | **Jar adjustment** | Budgets/Jars | If overspent: reallocation from another jar (EO-19) or accept overspend |
| S6 | **Ritual reviewed** | MonthRitual | Spending reviewed during Month Ritual |
| S7 | **Health reflected** | Health | Spending patterns reflected in score (BR-14 read-only) |

### Domains Participating
Accounts, Transactions, Categories, Inbox, Budgets/Jars, MonthRitual, Health, Cards (if card payment)

### Business Rules Triggered
BR-01, BR-03, BR-05 (unmapped → Inbox), BR-07 (overspend policy), BR-14, BR-16 (auto-cat override)

### Features Involved
EO-01 (auto-cat), EO-05 (search), EO-07 (batch Inbox), EO-19 (jar reallocation), EO-20 (split transactions)

### Decision Points
- D1: Confirm/override auto-category (EO-01)
- D2: Map to which Jar (if unmapped)
- D3: How to handle overspend (reallocate vs. accept)
- D4: Split transaction between categories/jars (EO-20)

### Automation Points
- Auto-categorization suggestion (EO-01)
- BR-07 policy enforcement (Warn vs. Block vs. Allow)
- Inbox batch resolution (EO-07)
- BR-16: 3 overrides → auto-cat rule update

### BR-01 Validation
✅ Expense reduces Account balance (Real). Jar tracking is intention-layer only. The account balance is the source of truth.

### BR-14 Validation
✅ Health observes spending patterns; does not change them.

---

## 3. Transfer Lifecycle

**Path:** Money moves between Accounts → Two Transactions → No Jar impact → No Inbox impact

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Transfer initiated** | Accounts | User initiates transfer between own accounts |
| S1 | **Source debit** | Transactions | Debit transaction on source account |
| S2 | **Destination credit** | Transactions | Credit transaction on destination account |
| S3 | **Link established** | Transactions | Two transactions linked as a transfer pair |
| S4 | **Accounts updated** | Accounts | Both account balances reflect transfer |

### Domains Participating
Accounts, Transactions

### Business Rules Triggered
BR-01, BR-06 (positive magnitudes with explicit direction)

### Features Involved
EO-05 (search for transfer history)

### Key Business Characteristic
✅ No Jar impact. No Inbox impact. No Category assignment needed (or "Transfer" category). This is a Real Ledger operation only. Correctly scoped.

### BR-01 Validation
✅ Transfer is purely a Real Ledger operation. Intention Plan is not involved. This validates the domain separation.

---

## 4. Savings Lifecycle

**Path:** Savings product created → Linked to Account → Maturity approaching → Maturity arrives → Inbox decision → Account update → Health reflection

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Product created** | Savings | Savings product defined: amount, term, interest rate, maturity date |
| S1 | **Account linked** | Savings | Product linked to a Real Account holding the funds |
| S2 | **Active** | Savings | Product is active; earning interest; waiting for maturity |
| S3 | **Maturity approaching** | Savings | BR-21 cascade: 30-day, 14-day, 7-day alerts fire |
| S4 | **Maturity arrives** | Savings | Maturity date reached; funds available |
| S5 | **Inbox decision** | Inbox | BR-10: ReviewItem created — Renew / Withdraw / Transfer |
| S6 | **Decision executed** | Transactions | Renewal creates new Savings; withdrawal creates Transaction to Account; transfer moves to another product |
| S7 | **Health reflected** | Health | Savings growth reflected in score (BR-14) |

### Domains Participating
Savings, Accounts, Transactions, Inbox, Health

### Business Rules Triggered
BR-01, BR-10 (maturity → Inbox), BR-14, BR-21 (alert cascade)

### Features Involved
EO-12 (maturity alerts)

### Decision Points
- D1: Renew, Withdraw, or Transfer at maturity
- D2: If renew, new term and amount
- D3: If withdraw, which account receives funds

### Automation Points
- BR-21 alerts fire automatically based on maturity date proximity
- Inbox ReviewItem generated automatically at maturity (BR-10)

### BR-01 Validation
✅ Savings product represents a Real financial product. The linked Account holds real money. Maturity decision involves real money movement.

---

## 5. Installment Lifecycle

**Path:** Installment created → Payment schedule → Payments as Transactions → Interest visible → Completion → Inbox → Health reflection

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Plan created** | Installments | Installment plan defined: total amount, num installments, interest rate |
| S1 | **Schedule generated** | Installments | Payment schedule calculated |
| S2 | **Active — paying** | Installments | Each payment creates a Transaction linked to the plan |
| S3 | **Interest tracked** | Installments | BR-20: interest portion of each payment visible |
| S4 | **Approaching completion** | Installments | paid_installments approaches num_installments |
| S5 | **Completed** | Installments | BR-11: paid_installments >= num_installments → complete |
| S6 | **Inbox notified** | Inbox | Completion generates Inbox ReviewItem (celebration/confirmation) |
| S7 | **Health reflected** | Health | Debt reduction reflected (BR-14) |

### Domains Participating
Installments, Accounts, Transactions, Inbox, Health

### Business Rules Triggered
BR-01, BR-11 (completion), BR-14, BR-20 (interest visibility)

### Features Involved
EO-09 (installment interest visibility)

### Decision Points
- D1: Extra payment — pay more than scheduled installment
- D2: Early payoff — pay remaining balance in full

### Automation Points
- Payment schedule generated at creation
- BR-11 completion detection automatic
- Inbox notification on completion automatic

### BR-01 Validation
✅ Each installment payment is a real Transaction debiting a Real Account. The installment plan is a debt structure, not a Jar.

---

## 6. Credit Card Lifecycle

**Path:** Card created → Spending as Transactions → Billing cycle → Payment due → Payment as Transaction → Interest visible → Health reflection

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Card created** | Cards | Card defined: issuer, credit limit, APR, billing cycle date |
| S1 | **Active — spending** | Cards | Spending through card creates Transactions linked to card |
| S2 | **Billing cycle closes** | Cards | Statement generated: balance, minimum payment, due date |
| S3 | **Payment approaching** | Cards | BR-17: 3-day reminder → Inbox ReviewItem |
| S4 | **Payment made** | Transactions | Payment Transaction from Account to Card |
| S5 | **Interest cost visible** | Cards | BR-22: carried balance interest cost displayed (uses EO-02 APR data) |
| S6 | **Health reflected** | Health | Card utilization reflected (BR-14) |

### Domains Participating
Cards, Accounts, Transactions, Inbox, Health

### Business Rules Triggered
BR-01, BR-14, BR-17 (payment reminder), BR-18 (min payment visible), BR-22 (interest cost)

### Features Involved
EO-02 (APR, due date, min payment), EO-13 (interest cost display)

### Decision Points
- D1: Pay minimum, full balance, or custom amount
- D2: When to pay (on due date or earlier)

### Automation Points
- BR-17: automatic 3-day reminder
- BR-18: minimum payment always visible
- BR-22: interest cost calculated from APR (EO-02 → EO-13 dependency)

### BR-01 Validation
✅ Card is a Real payment instrument with credit. Card spending is real money (just deferred). Card payment is a real Transaction.

### Feature Dependency Validation
✅ EO-02 (Card APR) → EO-13 (Interest Cost). Interest cost needs APR data.

---

## 7. Refund Lifecycle

**Path:** Refund received → Corrective Transaction → Category reversal → Jar adjustment → Inbox (if needed) → Health reflection

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Refund received** | Accounts | Money enters account as refund |
| S1 | **Refund transaction** | Transactions | Credit transaction marked as "Refund" |
| S2 | **Original linked** | Transactions | Refund linked to original expense transaction |
| S3 | **Category reversal** | Categories | Refund carries same category as original (or reversed category) |
| S4 | **Jar adjustment** | Budgets/Jars | Spending in that jar is reduced (money "returned" to intention) |
| S5 | **Inbox review** | Inbox | If original was in Inbox, resolution may need update |
| S6 | **Health reflected** | Health | Refund reflected (BR-14) |

### Domains Participating
Accounts, Transactions, Categories, Budgets/Jars, Inbox, Health

### Business Rules Triggered
BR-01, BR-14

### Decision Points
- D1: Link to original transaction (manual or auto)
- D2: Adjust jar allocation (reduce spending tracker)

### Automation Points
- Category can be auto-assigned from linked original transaction

### Gap Identified
⚠️ No business specification for structured refund-to-original linking. Audit trail requires knowing which transaction was reversed.

---

## 8. Recurring Bill Lifecycle

**Path:** RecurringPattern defined → Calendar entry → Transaction on schedule → Auto-categorized → Inbox review → Jar allocation → Ritual review

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Pattern defined** | Planning | RecurringPattern: amount, frequency, payee, category hint |
| S1 | **Calendar populated** | Planning | EO-03: upcoming bills visible in calendar (from EO-04 pattern) |
| S2 | **Bill due** | Planning | Scheduled date arrives |
| S3 | **Transaction created** | Transactions | Pattern generates a real Transaction |
| S4 | **Auto-categorized** | Categories | EO-01 suggests category based on pattern |
| S5 | **Inbox reviewed** | Inbox | User confirms/rejects auto-categorization (or auto-resolution R2) |
| S6 | **Jar allocated** | Budgets/Jars | Spending tracked against corresponding Jar |
| S7 | **Ritual reviewed** | MonthRitual | Recurring spending reviewed against plan |

### Domains Participating
Planning, Transactions, Categories, Inbox, Budgets/Jars, MonthRitual, Health

### Business Rules Triggered
BR-01, BR-05, BR-14, BR-16

### Features Involved
EO-04 (RecurringPatterns), EO-03 (Calendar), EO-01 (auto-cat)

### Decision Points
- D1: Confirm pattern-generated transaction (vs. skip/modify)
- D2: Confirm auto-category

### Automation Points
- Pattern → Calendar (EO-04 → EO-03)
- Pattern → Transaction creation (automated)
- Auto-categorization suggestion (EO-01)

### Feature Dependency Validation
✅ EO-04 (Patterns) → EO-03 (Calendar). Calendar entries come from Patterns.

---

## 9. Goal Funding Lifecycle

**Path:** Goal created → Linked to Jar(s) → Monthly allocation → Progress tracked → Milestone celebrated → Completion → Health reflection

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Goal created** | Goals | Goal defined: target amount, timeline, linked jar (R1: single-jar; multi-source deferred EO-14) |
| S1 | **Jar linked** | Goals | Goal connected to one Active Jar (Philosophy text allows “one or more”; Decision Board defers multi-source) |
| S2 | **Monthly funding** | Budgets/Jars | Each month, jar allocation contributes to goal |
| S3 | **Progress tracked** | Goals | Current / Target visible; percentage calculated |
| S4 | **Milestone reached** | Goals | 25%, 50%, 75% milestones trigger EO-18 celebration |
| S5 | **Completed** | Goals | Target reached |
| S6 | **Health reflected** | Health | Goal achievement reflected (BR-14) |

### Domains Participating
Goals, Budgets/Jars, Health

### Business Rules Triggered
BR-01, BR-03 (funding through Active jars), BR-14

### Features Involved
EO-18 (goal celebration)

### Decision Points
- D1: Which jars fund which goals
- D2: Adjust goal target/timeline mid-cycle
- D3: What to do after completion (new goal or celebrate)

### Automation Points
- Progress calculation automatic
- Milestone detection (25/50/75%) triggers celebration (EO-18)

### BR-01 Validation
✅ Goals are intentions, not money containers. Money lives in Accounts. Goals are funded through Jar allocations, which are intention envelopes.

---

## 10. Emergency Spending Lifecycle

**Path:** Unexpected expense → Transaction → Category → Inbox → Jar reallocation → Policy check → Health reflection → Ritual note

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Emergency occurs** | External | Unexpected large expense |
| S1 | **Transaction recorded** | Transactions | Expense transaction with "Emergency" or relevant category |
| S2 | **Inbox created** | Inbox | BR-05: unmapped or overspent → Inbox ReviewItem |
| S3 | **Reallocation decision** | Budgets/Jars | User moves allocation from Emergency Jar or other jars (EO-19) |
| S4 | **Policy check** | Budgets/Jars | BR-07: overspend policy triggers (Warn is likely mode) |
| S5 | **Partner visibility** | Tenancy | BR-13: material change visible to partner |
| S6 | **Ritual note** | MonthRitual | Emergency noted in month ritual for context |
| S7 | **Health reflected** | Health | Emergency impact on score (BR-14) |

### Domains Participating
Accounts, Transactions, Categories, Inbox, Budgets/Jars, Tenancy, MonthRitual, Health

### Business Rules Triggered
BR-01, BR-05, BR-07, BR-13, BR-14

### Features Involved
EO-19 (jar reallocation), EO-07 (batch Inbox for resolution)

### Decision Points
- D1: Which jars to pull from
- D2: Accept overspend or reallocate
- D3: Partners discuss (BR-13 visibility)

### Gap Identified
⚠️ No explicit "emergency mode" declaration. No business-level differentiation between "I overspent on dining" and "I had a genuine emergency." Both look the same in the system.

---

## 11. Household Shared Expense Lifecycle

**Path:** Partner A captures expense → Transaction → Category → Inbox (visible to both) → Both review → Jar allocation → Health (household-scoped)

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Partner A spends** | External | Partner A makes a purchase |
| S1 | **Transaction captured** | Transactions | Partner A records transaction |
| S2 | **Category assigned** | Categories | Categorization (auto or manual) |
| S3 | **Inbox visible** | Inbox | BR-02 + BR-02a: ReviewItem visible to all household members |
| S4 | **Both review** | Tenancy | Either partner can resolve Inbox item |
| S5 | **Jar allocated** | Budgets/Jars | Spending tracked against household jar |
| S6 | **Health reflected** | Health | Household-scoped health update |

### Domains Participating
Accounts, Transactions, Categories, Inbox, Budgets/Jars, Tenancy, Health

### Business Rules Triggered
BR-01, BR-02, BR-02a, BR-05, BR-13, BR-14

### Decision Points
- D1: Who resolves the Inbox item (either partner)
- D2: Agreement on jar allocation

### Automation Points
- BR-02a: RLS ensures only household members see transactions
- BR-13: material changes visible to both

### BR-01 Validation
✅ The transaction happens in Real Ledger. The household (Tenancy) controls visibility. The jar allocation is intention.

---

## 12. Manual Adjustment Lifecycle

**Path:** User opens account or jar → Adjusts balance / allocation intentionally → Audit trail → Partner visibility → Ritual / Health reflection

Manual Adjustment is distinct from Correction. Correction fixes an **error**. Manual Adjustment is an intentional **reconciliation or plan change** (opening balance tweak, jar allocation edit mid-month, cash count reconciliation).

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Need recognized** | User | Cash count differs from recorded balance, or plan needs mid-month rebalancing |
| S1a | **Ledger adjustment path** | Accounts / Transactions | Explicit adjustment Transaction on Real Account (never silent overwrite of balance) |
| S1b | **Intention adjustment path** | Budgets/Jars | Jar allocation changed via Movement / EO-19 reallocation (intention only) |
| S2 | **BR-01 fork validated** | System | Path S1a mutates Real; path S1b mutates Intention — never conflated as one “adjust money” action |
| S3 | **Partner visibility** | Tenancy | Material adjustments partner-visible (BR-13) |
| S4 | **Locked-month gate** | MonthRitual | If month approved (BR-08), intention adjustments blocked; ledger corrections use explicit correction path |
| S5 | **Ritual / Health** | MonthRitual / Health | Adjustment appears in ritual audit; Health reflects outcome (Health-RO) |

### Domains Participating
Accounts, Transactions, Budgets/Jars, Tenancy, MonthRitual, Health (optional Inbox if adjustment creates unmapped residue)

### Business Rules Triggered
BR-01, BR-03, BR-06, BR-08, BR-13, Health-RO, BR-15 (online mutations)

### Decision Points
- D1: Is this a Real Ledger reconciliation or an Intention reallocation?
- D2: Does partner need to acknowledge (BR-13)?
- D3: Is the month locked (BR-08)?

### Gap Identified
⚠️ Product language sometimes collapses “adjust” into one UX verb. Without a clear Real vs Intention fork in the mental model, users may believe adjusting a jar changes bank balance (BR-01 risk). EO-19 Decision Board notes say reallocations “create a ledger transaction” while Philosophy says jars do not move Account money — **ownership ambiguity** documented in `business-smells.md` Smell 16.2.

### BR-01 Validation
✅ Manual Adjustment must choose one truth layer. Real adjustments create Transactions. Intention adjustments change jar allocations only.

### Health-RO Validation
✅ Health observes post-adjustment state; never initiates adjustments.

---

## 13. Correction Lifecycle

**Path:** Error discovered → Reversal Transaction → Original marked reversed → New correct Transaction → Inbox re-review → Jar adjustment → Ritual audit

### States

| # | State | Domain | Description |
|---|-------|--------|-------------|
| S0 | **Error discovered** | Any | Wrong amount, wrong category, wrong account, duplicate |
| S1 | **Reversal created** | Transactions | A reversal Transaction (NEVER delete original) |
| S2 | **Original marked** | Transactions | Original transaction marked as "reversed" — linked to reversal |
| S3 | **Correct recreated** | Transactions | New transaction with correct details |
| S4 | **Inbox re-review** | Inbox | If original was Inbox-resolved, item may need re-resolution |
| S5 | **Jar adjustment** | Budgets/Jars | Jar spending tracker corrected |
| S6 | **Ritual audit** | MonthRitual | Correction visible in ritual audit trail |

### Domains Participating
Transactions, Categories, Inbox, Budgets/Jars, MonthRitual

### Business Rules Triggered
BR-01, BR-05, Health-RO

### Decision Points
- D1: Reversal vs. adjustment (reversal is the correct path; Manual Adjustment is a different lifecycle)
- D2: Does the corrected transaction need Inbox re-review?

### Gap Identified
⚠️ No business-level specification for reversal-to-original linking. What information links a reversal to its original? Is it a reference? A linked transaction pair? This affects audit integrity.

---

## Cross-Lifecycle Observations

### Lifecycles That Intersect

| Intersection | How |
|-------------|-----|
| Expense ↔ Credit Card | Card spending IS an expense lifecycle on a card account |
| Expense ↔ Installment | Installment payments ARE expenses with a debt structure |
| Expense ↔ Recurring Bill | Recurring bills BECOME expenses on schedule |
| Income ↔ Goal Funding | Income allocation feeds goal funding |
| Correction ↔ Any | Correction can apply to any transaction in any lifecycle |
| Manual Adjustment ↔ Correction | Same UX verb risk — different intent (reconcile/plan vs fix error) |
| Manual Adjustment ↔ Emergency | Emergency reallocation is a specialized Intention adjustment |

### BR-01 Cross-Check

All money lifecycles respect BR-01. Money always lives in Accounts (Real Ledger). Jars, Goals, and Planning are intention layers. Inbox bridges them. No lifecycle violates this separation. Manual Adjustment is the highest BR-01 UX risk if Real and Intention forks are not labeled distinctly.

### Health-RO Cross-Check

Health appears in every lifecycle as the final, read-only observer. No lifecycle shows Health triggering, creating, or modifying money. Constitutional Health-RO holds. (Product SoT BR-14 = AI non-invention — separate constraint; see Smell 12.2.)

### Lifecycle Completeness

| Lifecycle | Complete? | Note |
|-----------|-----------|------|
| Salary/Income | ✅ | Start to next-month planning |
| Expense | ✅ | Start to health reflection |
| Transfer | ✅ | Self-contained, correct scope |
| Savings | ✅ | Creation to maturity decision |
| Installment | ✅ | Creation to completion + celebration |
| Credit Card | ✅ | Creation to payment + interest |
| Refund | ⚠️ | Missing structured reversal linking |
| Recurring Bill | ✅ | Pattern to ritual review |
| Goal Funding | ⚠️ | Philosophy allows multi-jar; EO-14 deferred → single-jar in R1 |
| Emergency | ⚠️ | Missing "emergency mode" concept |
| Household Shared | ✅ | Visible to both partners |
| Manual Adjustment | ⚠️ | Real vs Intention fork underspecified; EO-19 wording tension |
| Correction | ⚠️ | Missing reversal-audit link specification |
