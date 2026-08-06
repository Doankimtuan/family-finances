# Current Product Gap

## Basis Of Comparison

This comparison uses the current repository artifacts and implementation visible in:

- `artifacts/domain-philosophy/CURRENT/domains/categories.md`
- `artifacts/domain-reality-validation/CURRENT/domains/categories.md`
- `artifacts/business-evolution/CURRENT/category-jar-contract.md`
- `artifacts/final/Project Knowledge Base.md`
- `modules/ledger/application/category-jar-policy.ts`
- `modules/ledger/application/commands/create-category.ts`
- `modules/ledger/application/queries/list-transactions.ts`
- `modules/ledger/application/transaction-types.ts`
- `modules/plan/application/commands/create-jar.ts`
- `supabase/migrations/20260802130000_ledger_transactions_inbox.sql`
- `supabase/migrations/20260803220000_sprint1_category_jar_refund_correction.sql`
- `app/[locale]/(product)/money/transactions/*`
- `app/[locale]/(product)/plan/jars/create-category-form.tsx`

It identifies factual gaps only. It does not propose solutions.

## Current Product Facts

- Categories are part of the Ledger application surface rather than a separate module tree.
- Categories have income or expense kind.
- Categories have name, household scope, system-template scope, active state, sort order, and timestamps in observed schema.
- System categories include Food, Transport, Home, Health, Other, Salary, and Bonus in observed seed data.
- Household categories are member-readable/writable under RLS.
- Category names are unique per household and kind.
- Household categories are required to bind to a jar under the observed Category-Jar contract.
- System template categories may have no jar binding.
- Creating a jar seeds a matching household category in observed application code.
- Transactions can reference category and jar.
- Transaction list and detail queries include category name.
- Transaction capture supports selecting a category.
- Category selection can auto-fill jar from category mapping in observed transaction record paths.
- Unmapped expenses can create Inbox review items.
- Month ritual gate can surface categories used in a period without an active jar binding.

## Factual Gaps Against Real-World Domain

| Real-world concept | Current observed product coverage | Factual gap |
| --- | --- | --- |
| Provider category hints | Category data exists as household/system records. | No observed field distinguishing external provider category from household category. |
| Merchant-to-category memory | Category selection exists. | No observed durable merchant-to-category rule in current category implementation. |
| Merchant identity | Transactions expose note and category name. | No observed structured merchant entity or normalized merchant field for category use. |
| Mixed-purpose purchase | One transaction references one category and one jar. | No observed split categorization in current implementation. |
| Category visual identity | Philosophy mentions possible icon/color. | No observed icon or color fields in current category schema. |
| Category archival behavior | Schema has `is_active`; list query filters active categories. | No observed category archive/restore user flow in current application files. |
| Category rename or merge | Category creation exists. | No observed rename or merge command for categories. |
| Historical category drift | Transactions reference category id. | No observed explicit history of category meaning changes. |
| Confidence or uncertainty | Inbox items can carry confidence in other contexts. | No observed category-specific confidence model for inferred classification. |
| Receipt or line-item evidence | Transaction category is single label. | No observed receipt-line classification concept. |
| Duplicate category detection beyond exact uniqueness | Unique index covers lowercase same-name per household and kind. | No observed near-duplicate or synonym detection. |
| Multi-language category aliases | Category name is a single value. | No observed alias or localized household category name model. |
| Formal statistical taxonomy alignment | Product has simple categories. | No observed COICOP-like or external taxonomy mapping. |
| Card MCC distinction | Cards and transactions exist separately. | No observed explicit distinction between MCC/provider category and household category in current category model. |

## Non-Gaps Observed

- The product correctly treats categories as classification labels, not money containers.
- The product already separates category meaning from real account balances.
- The product already recognizes the category-to-jar boundary as a cross-domain contract.
- The product already keeps categories household-scoped while allowing system templates.
- The product already supports basic category assignment during transaction capture.
- The product already surfaces unmapped category/jar situations through Inbox or ritual evidence.
