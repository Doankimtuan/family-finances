# Utilities & Helpers Review — Engineering Foundation Audit

**Board:** Engineering Foundation Audit Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Shared Utilities Inventory

Shared helper functions and formatters reside in `shared/utils/`.

| Utility Function | File Location | Purpose & Implementation | Barrel Exported? | Status |
|---|---|---|---|---|
| `cn(...)` | `shared/utils/cn.ts` | Tailwind class merge utility (`clsx` + `tailwind-merge`). | Yes (`shared/utils/index.ts`) | **PASSED & STANDARDIZED** |
| `formatCurrency(...)` | `shared/lib/` / `shared/utils/` | Currency formatting helper supporting `VND` and `USD`. | Yes | **PASSED** |
| `formatDate(...)` | `shared/lib/` | Date formatting wrapper using `date-fns`. | Yes | **PASSED** |

---

## 2. Standardizations Executed

1. **Barrel Export Index (`shared/utils/index.ts`)**:
   - Standardized `shared/utils/index.ts` to re-export `cn()` and common utilities, allowing clean import paths:
     ```typescript
     import { cn } from "@/shared/utils";
     ```
2. **Zero Duplicate Formatters**: Confirmed that currency and date formatting are centralized in `shared/` rather than re-implemented inside individual UI components.
