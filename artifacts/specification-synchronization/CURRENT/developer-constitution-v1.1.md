# Developer Constitution v1.1 — ViNha Engineering Governance

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v1.1  

---

## 1. Immutable Blocking Laws (Do Not Skip)

1. **No Magic Strings**: All domain constants, path strings, event names, and status enums MUST be imported from documented home files (`modules/<bc>/application/*-constants.ts`, `app-path.ts`). Hardcoding raw strings is strictly forbidden.
2. **Developer Constitution Compliance**: All development work must conform to this constitution. Engineers MUST NOT redesign Product, Architecture, or Design System.
3. **Canonical Source of Truth Reference**: The canonical Source of Truth is located strictly under `artifacts/specification-synchronization/CURRENT/`. No code may implement patterns from deprecated or un-synchronized specifications.
4. **Zero Import from Legacy Archive**: Imports from `archive/legacy-v1` are permanently blocked. Use only `shared/ui`, Design Tokens, and v2 module APIs.

---

## 2. Source of Truth Directory Mapping

| Domain / Specification Area | Canonical Source of Truth File |
|---|---|
| **Product Vision & Identity** | [product-definition-v2.1.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/product-definition-v2.1.md) |
| **Architecture & Bounded Contexts** | [architecture-definition-v2.1.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/architecture-definition-v2.1.md) |
| **Technical Schemas & APIs** | [technical-specification-v2.1.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/technical-specification-v2.1.md) |
| **Business Rules Inventory** | [business-rules.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/business-rules.md) |
| **Functional Requirements** | [requirements.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/requirements.md) |
| **Acceptance Criteria** | [acceptance-criteria.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/acceptance-criteria.md) |
| **Domain Terminology** | [glossary.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/glossary.md) |

---

## 3. Mandatory PR Review Checklist

Before submitting a Pull Request, developers MUST verify:
- [ ] Code passes TypeScript strict mode compilation with zero type suppressions.
- [ ] Zero magic strings; all constants imported from constants home.
- [ ] **BR-01 Check**: Plan movements execute `$0.00` ledger transactions.
- [ ] **BR-24 Check**: Health components make zero write calls or database mutations (`Health-RO`).
- [ ] Unit tests cover Given-When-Then Acceptance Criteria for affected features.
- [ ] 3-way correction audit chain and refund linkage contracts verified.
