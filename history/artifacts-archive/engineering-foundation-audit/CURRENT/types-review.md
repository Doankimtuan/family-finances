# Types & Schemas Architecture Review — Engineering Foundation Audit

**Board:** Engineering Foundation Audit Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. TypeScript & Zod Schema Architecture

ViNha enforces a unified **Type-Safe Data Architecture** leveraging Zod (`zod`) schemas and TypeScript type inferences (`z.infer<typeof Schema>`).

Type layers:
1. **Domain Entities**: Defined in `modules/<bc>/domain/` representing core business objects.
2. **DTO & Command/Query Schemas**: Defined in `modules/<bc>/application/*-types.ts` representing API inputs/outputs.
3. **View Models & Props**: Component prop interfaces in presentation layers.

---

## 2. Type Audit Matrix

| Audit Check | Target Standard | Codebase Status | Verdict |
|---|---|---|---|
| **Anonymous Object Elimination** | Zero anonymous inline object types in function parameters or state. | All domain parameters use named TypeScript interfaces or Zod infer types. | **PASSED** |
| **Zod Single Source of Truth** | API validation and frontend form schemas share identical Zod schemas. | Schemas declared in `modules/<bc>/application/*-types.ts` serve both RHF and API validation. | **PASSED** |
| **Strict Type Compilation** | Zero type suppressions (`@ts-ignore`, `any`). | TypeScript strict mode compilation (`npm run typecheck`) passes cleanly. | **PASSED** |
| **ReviewItem Discriminator Union** | Strongly-typed `ReviewItemType` payload schemas. | Discrimination enums defined in `modules/inbox/application/inbox-constants.ts`. | **PASSED** |

---

## 3. Type Governance Guidelines

1. **Export Inferred Types**: Always export the inferred TypeScript type alongside the Zod schema:
   ```typescript
   export const TransactionSchema = z.object({ ... });
   export type Transaction = z.infer<typeof TransactionSchema>;
   ```
2. **No Duplicate Type Declarations**: Do not declare duplicate frontend interfaces for backend DTOs. Share inferred Zod types from module application layers.
