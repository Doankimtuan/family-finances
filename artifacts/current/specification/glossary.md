# Unified Domain Glossary — ViNha

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Domain Terminology Standards

To eliminate terminology drift across engineering, design, and product specifications, all teams MUST use the standardized terms defined in this glossary.

---

## 2. Canonical Terms & Definitions

| Term | Domain | Definition & Usage Rules | Disallowed Synonyms |
|---|---|---|---|
| **Account** | Accounts | Physical bank account, cash wallet, or credit card line held at a financial institution. Represents Real Ledger money. | "Wallet", "Bank Bucket", "Fund" |
| **Transaction** | Ledger | Immutable record of a real monetary debit or credit. Once posted, cannot be edited or deleted (BR-02). | "Log Entry", "Expense Record", "Receipt Item" |
| **Jar** | Budgets | Virtual spending capacity bucket holding household intention funds (BR-01). Does NOT represent a bank account. | "Budget Envelope", "Virtual Account", "Sub-account" |
| **Category** | Categories | Classification taxonomy for transactions. Maps $N:1$ to active Jars (BR-12). | "Tag", "Folder", "Type Label" |
| **ReviewItem** | Inbox | Strongly-typed decision queue item requiring household or automated triage in Inbox. | "Notification", "Alert Banner", "Task" |
| **Plan Movement** | Budgets | Virtual capacity transfer between Jars. Has `$0.00` ledger balance impact (BR-01). | "Internal Transfer", "Account Transfer", "Ledger Movement" |
| **Emergency Declaration** | Budgets | User intent metadata attached to a Plan Movement indicating unexpected essential spending. Bypasses BR-07 warning modal. | "Emergency Cash", "Overdraft", "Loan" |
| **Month Ritual** | MonthRitual | Monthly reflection and closure workflow that reviews spending, annotations, and locks Jar allocations (BR-08). | "Monthly Audit", "Closing Books", "Budget Reset" |
| **Quick Close** | MonthRitual | 1-tap summary approval mode for Month Ritual unlocked after 6 consecutive completed assisted rituals (BR-23). | "Fast Mode", "Skip Ritual", "Auto Approve" |
| **Health (`Health-RO`)** | Health | Read-only domain computing financial scores, trend analytics, and narrative insights (BR-24). | "Health Engine Writer", "Auto Optimizer" |
