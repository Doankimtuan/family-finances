# Technical Debt & Refactoring Plan — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Identified Technical Debt & Code Smells

Based on our codebase audit, the following technical debt items MUST be resolved during sprint implementation:

1. **Magic String Infiltration**: Raw string literals exist in legacy helper functions for category names and transaction status strings.
   - **Remediation**: Refactor all string constants into home constant files (`modules/<bc>/application/*-constants.ts`) as mandated by Developer Constitution v1.1.
2. **Legacy Import Patterns**: Occasional references to old `archive/legacy-v1` helper functions exist.
   - **Remediation**: Replace all legacy imports with `shared/ui` and Design System tokens.
3. **Untyped ReviewItem Handlers**: Legacy Inbox handlers consume untyped JSON payloads.
   - **Remediation**: Refactor all Inbox handlers to consume discriminated union schemas (`ReviewItemType`).

---

## 2. Quality Gates & Enforcement

- **Strict Type Checking**: TypeScript `noImplicitAny: true` and `strictNullChecks: true` enforced on all PRs.
- **Linters & Formatters**: Biome / ESLint and Prettier rules enforced via Husky pre-commit hooks.
- **Zero Magic String Pipeline Check**: Automated CI script checking for un-exported raw string literals in domain logic.
