# Tailwind & Design Tokens Review — Engineering Foundation Audit

**Board:** Engineering Foundation Audit Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Styling Architecture & Tailwind v4 Audit

ViNha uses **Tailwind CSS v4** (`@tailwindcss/postcss`) configured alongside HeroUI (`@heroui/styles`) and custom utility class merge helpers.

Core styling configuration:
- Class combination utility: `cn()` in `shared/utils/cn.ts` (using `clsx` + `tailwind-merge`).
- Component variant styling: `tailwind-variants` (`tv()`).
- Theme configuration: `shared/theme/` and Next.js dark/light mode (`next-themes`).

---

## 2. Audit Findings & Utility Standardization

| Audit Check | Standard Requirement | Codebase Status | Verdict |
|---|---|---|---|
| **Class Merging** | All dynamic component class prop overrides pass through `cn(...)`. | Enforced across all `shared/ui/` primitives. | **PASSED** |
| **Arbitrary Values** | Arbitrary Tailwind values (`rounded-[17px]`, `px-[13px]`) avoided in favor of canonical tokens. | Clean usage of canonical Tailwind scale (`rounded-xl`, `px-4`, `gap-2`). | **PASSED** |
| **Semantic Colors** | Uses semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-danger`). | Color tokens strictly bound to semantic theme variables. Zero hardcoded hex colors in UI JSX. | **PASSED** |
| **Mobile Responsiveness** | Touch-first, mobile responsive classes (`sm:`, `md:`, `flex-col sm:flex-row`). | Mobile-first breakpoint design strictly followed. | **PASSED** |

---

## 3. Styling Rules for Future Sprints

1. **Always Use `cn()` for Class Overrides**: Never concatenate className strings with raw template literals; always wrap with `cn()`.
2. **Prefer Semantic Tokens**: Use `bg-content1`, `text-default-500`, `border-divider` instead of raw color hex codes.
