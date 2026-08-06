# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| ACC-PD-001 | Real-world money containers | Represent bank accounts, cash, wallets, and similar real containers. | High | High | Low | Low | APPROVED | Core validated household need: users ask where money is. |
| ACC-PD-002 | Account type | Identify broad type such as cash, bank, wallet, savings, card, other. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep types broad and Vietnam-understandable; do not let type taxonomy become product complexity. |
| ACC-PD-003 | Household-language account names | Let accounts be recognized by ordinary household labels. | High | High | Low | Low | APPROVED | Validated by behavior: users remember "salary bank", "cash", and wallet names. |
| ACC-PD-004 | Opening or starting balance | Establish the initial recorded amount. | High | High | Low | Medium | APPROVED | Needed for recorded position; risk is wrong starting value, handled as a validation concern. |
| ACC-PD-005 | Current recorded balance | Show the product's recorded account amount. | High | High | Medium | Medium | APPROVED | Essential, but must be understood as recorded truth, not always legal institution truth. |
| ACC-PD-006 | Real household position contribution | Include eligible accounts in real position. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Exclude obligations and non-owned credit from owned-money totals; protect BR-01 and credit misunderstanding. |
| ACC-PD-007 | Active versus historical account distinction | Distinguish accounts used now from closed/archived historical accounts. | Medium | High | Low | Low | APPROVED | Young households change accounts over time; history must remain understandable. |
| ACC-PD-008 | Account context for transactions | Transactions carry the account where money moved. | High | High | Low | Low | APPROVED | Strongly validated: users think "paid from which account" before analysis. |
| ACC-PD-009 | Reconciliation against real records | Support comparing product records with bank, wallet, card, or cash reality. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Approve as a lightweight product responsibility; defer advanced workflows and automation. |
| ACC-PD-010 | Preserve history after closure | Closed accounts remain available for historical interpretation. | Medium | Medium | Low | Low | APPROVED | Closure should not erase transaction meaning. |
| ACC-PD-011 | Liquid versus non-liquid distinction | Help distinguish usable money from constrained money. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep simple; avoid detailed liquidity scoring or investment-like classification. |
| ACC-PD-012 | Real money versus virtual planning distinction | Accounts must never behave like jars or goals. | High | High | Low | High | APPROVED | Non-negotiable BR-01 protection. |
| ACC-PD-013 | Institution or provider metadata | Identify bank, wallet provider, or relevant holder for recognition. | Medium | Medium | Low | Low | APPROVED WITH MODIFICATIONS | Keep as recognition metadata; do not require heavy formal setup. |
| ACC-PD-014 | Account number mask | Store/display partial account identifier for recognition. | Medium | Medium | Medium | Medium | DEFERRED | Useful, but privacy and setup burden need research; not required for MVP clarity. |
| ACC-PD-015 | Per-account currency | Allow an account to carry its own currency. | Medium | Low now, higher later | High | High | DEFERRED | Vietnam-first MVP can remain VND-centered; multi-currency creates exchange-rate complexity. |
| ACC-PD-016 | Holder or ownership metadata | Represent who legally or practically owns/uses an account. | Medium | Medium | High | High | APPROVED WITH MODIFICATIONS | Approve household relevance language, not granular permission or surveillance semantics. |
| ACC-PD-017 | Manual balance adjustment record | Record that a balance was manually corrected or reconciled. | High | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Must avoid silent overwrites; decision is product-level accountability, not implementation design. |
| ACC-PD-018 | Balance history snapshots | Preserve historical account balance points. | Medium | Medium | High | Medium | DEFERRED | Valuable for analysis but not needed before core account trust is established. |
| ACC-PD-019 | Imported bank or wallet balances | Bring read-only external balances from providers. | High later | High later | High | High | DEFERRED | Vietnam connectivity, consent, reliability, and duplicate-risk issues require later validation. |
| ACC-PD-020 | Balance freshness / staleness | Communicate when a manually maintained balance may be stale. | Medium | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Product need validated; keep informational, not anxiety-inducing or automation-heavy. |
| ACC-PD-021 | Account grouping | Group accounts by member, institution, or liquidity. | Medium | Medium | Medium | Medium | DEFERRED | Useful after account count grows; premature for simple-first scope. |
| ACC-PD-022 | Transfer recognition | Recognize movement between owned accounts as transfer, not income/expense. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Must remain Real Ledger only with no jar impact; critical for financial correctness. |
| ACC-PD-023 | Statement attachment/reference | Attach or reference bank/wallet statements. | Low | Low | Medium | Medium | DEFERRED | Helps power users, but adds document-management burden outside core account clarity. |
| ACC-PD-024 | Export account records | Allow account records to be portable. | Medium | Medium | Medium | Low | APPROVED | Consistent with data portability; scope remains account facts, not advanced reports. |
| ACC-PD-025 | Multi-currency account support | Support households with multiple currencies. | Medium later | Medium later | High | High | DEFERRED | Valid future pressure, not validated as common for Vietnam-first young households now. |
| ACC-PD-026 | Open-banking/provider feed integration | Connect to banks or wallets for read-only data. | High later | High later | High | High | DEFERRED | Premature until provider reliability, regulation, and user trust are researched. |
| ACC-PD-027 | Precise liquidity classification | Detailed liquidity states and constraints. | Medium | Medium | High | Medium | DEFERRED | Simple liquid/non-liquid distinction is enough for now. |
| ACC-PD-028 | Account sub-classification | Finer taxonomy within account types. | Low | Low | Medium | Medium | DEFERRED | Existing Product Decision Board already deferred account sub-classification; still low value now. |
| ACC-PD-029 | Cross-border wallet or QR awareness | Represent cross-border payment context. | Low now | Low now | High | Medium | DEFERRED | Observed future pressure only; not a core young-household need now. |
| ACC-PD-030 | Read-only investment or wealth accounts | Track investment/wealth accounts read-only. | Medium later | Medium later | High | High | DEFERRED | Wealth is future scope; avoid investment-advice boundary risk. |
| ACC-PD-031 | Account access status | Represent frozen, restricted, pending verification, or closed states. | Medium | Medium | Medium | Medium | DEFERRED | Valuable later for e-wallet/provider maturity; active/historical is enough for current scope. |
| ACC-PD-032 | Stronger reconciliation workflow | Structured manual/import reconciliation process. | High later | High later | High | Medium | DEFERRED | Approve reconciliation as responsibility, but full workflow waits for usage evidence. |
| ACC-PD-033 | Provider connection status | Show external connection health. | Medium later | Medium later | Medium | Medium | DEFERRED | Depends on provider feeds, which are deferred. |
| ACC-PD-034 | Recorded vs institution vs available vs pending balances | Distinguish multiple balance concepts. | Medium later | Medium later | High | High | DEFERRED | Financially correct but too complex before users prove need; current recorded balance remains primary. |
| ACC-PD-035 | Closed-account lifecycle metadata | Capture closure reason/date/status. | Medium | Medium | Medium | Low | APPROVED WITH MODIFICATIONS | Approve closure clarity at product level; keep lightweight and historical, not a state-machine expansion. |
| ACC-PD-036 | Fraud/dispute status awareness | Represent scam, dispute, chargeback, or mistaken transfer state. | Medium later | Medium later | High | High | DEFERRED | Important edge case, but belongs after core account and transaction dispute behavior is validated. |
| ACC-PD-037 | Jar-to-account mapping | Link planning jars directly to specific real accounts. | Low | Low | High | Critical | REJECTED | Directly conflicts with BR-01; jars are intentions and accounts are reality. |
| ACC-PD-038 | Account-level spending analytics | Make Accounts own spending analytics. | Low | Low | Medium | Medium | REJECTED | Analytics belong to Transactions, Categories, Planning, or Health; Accounts must stay passive reality containers. |
| ACC-PD-039 | Health write-back to accounts | Let Health change account records or balances. | Low | Low | High | Critical | REJECTED | Violates Health read-only (BR-24) principle and financial safety. |
| ACC-PD-040 | Automatic money movement from Accounts | Let Accounts automatically move or allocate money for users. | Low | Low | High | Critical | REJECTED | Violates no unnecessary automation and household decision control. |

## Summary

- APPROVED: 9.
- APPROVED WITH MODIFICATIONS: 10.
- DEFERRED: 17.
- REJECTED: 4.
