# Forms Architecture Review — Engineering Foundation Audit

**Board:** Engineering Foundation Audit Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Form Engine Architecture

Form handling across ViNha is standardized on **React Hook Form (`react-hook-form`)** coupled with **Zod (`zod`)** schema validation via `@hookform/resolvers/zod`.

Form field wrappers live inside `shared/ui/form/`:
- `form-field.tsx`: Base wrapper handling label rendering, field description, accessibility IDs, and inline error message rendering.
- `text-field.tsx`: Standard text input bound to React Hook Form context.
- `checkbox-field.tsx`: Checkbox component bound to React Hook Form context.
- `auth-text-field.tsx`: Specialized input wrapper for authentication forms.

---

## 2. Form Audit Checklist & Verification

| Audit Check | Standard Requirement | Codebase Implementation Status | Verdict |
|---|---|---|---|
| **Boilerplate Reduction** | Shared `FormField` wrapper encapsulates error rendering, labels, and descriptions. | Implemented in `shared/ui/form/form-field.tsx`. Zero repeated boilerplate in forms. | **PASSED** |
| **Schema Validation** | All forms validate against explicit Zod schemas. | Domain forms define schemas in `modules/<bc>/application/*-types.ts`. | **PASSED** |
| **Error Rendering** | Standardized error message callouts and border highlighting. | `form-field.tsx` renders accessible `text-danger` error messages with ARIA live regions. | **PASSED** |
| **Loading & Submitting States** | Submit buttons disable automatically during async mutation handling. | `shared/ui/button.tsx` accepts `isLoading` prop automatically disabling pointer events. | **PASSED** |

---

## 3. Standardization Guidelines

1. **Always Use `FormField` Wrapper**: Developers creating new form components MUST use `shared/ui/form/form-field.tsx` rather than writing custom label/error JSX markup.
2. **Schema Invariance**: Form validation schemas MUST be defined in module application layers alongside domain constants to ensure single source of truth between frontend and backend validations.
