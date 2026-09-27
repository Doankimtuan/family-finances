# ViNha Implementation Handoff Package & Engineering Master Guide

**Product**: ViNha (Bilingual Vietnamese/English Household Financial Platform)  
**Status**: **DESIGN FREEZE DECLARED — READY FOR IMPLEMENTATION**  
**Google Stitch Project ID**: `16826760243481546078` ("ViNha Mobile Finance Icon System")  
**Active Design System Asset ID**: `assets/75087efd2c3c42baa6ce67405334331b` ("ViNha Warm Precision")  
**Canonical Component System (Task 11)**:

- **Light Board**: `5c6805523e9644b9b233449304419296`
- **Dark Board**: `b07644fd6dad4c7c81b8a4bf1a51baff`
  **Master Cross-Domain QA Reference Board (Task 13)**:
- **Reference Board ID**: `fe3622ad17ab4eeaa597f15246674c52`

---

## 1. Welcome to the Implementation Phase

This handoff package contains the complete, audited, and normalized engineering specifications for ViNha. The design phase is officially **FROZEN**. There are zero ambiguous screens, zero unmapped components, zero open P0/P1 blockers, and zero unbacked product concepts.

Implementation engineers and AI coding agents can implement any screen or component without guessing.

---

## 2. Reading Order for Engineers & Agents

Before writing or editing code, read the handoff documentation in this exact order:

1. **[Implementation Contract](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/implementation-contract.md)**: Defines what implementation MAY and MAY NOT do, strict P0 financial invariants, and data classification.
2. **[Token Handoff](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/token-handoff.md)**: Complete CSS/Tailwind tokens for colors, typography, corner radii, spacing, and control heights.
3. **[Component Reference Index](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/component-reference-index.md)** & **[Component Screen Map](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/component-screen-map.md)**: Specifications for all reusable UI primitives.
4. **[Implementation Order](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/implementation-order.md)**: Bottom-up sequence from tokens to primitives, shell, auth, hubs, and domain details.
5. **[Existing UI Impact Audit](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/existing-ui-impact.md)**: Technical audit of existing `shared/ui` and `shared/patterns` components.
6. **[Route to Screen Map](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/route-screen-map.md)** & **[Screen Inventory](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/screen-inventory.md)**: Direct mapping from Next.js routes to canonical Stitch screen IDs.
7. **[Theme Parity](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/theme-parity.md)** & **[Localization Readiness](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/localization-readiness.md)**: Dual-theme requirements and bilingual copy dictionaries.

---

## 3. Implementation Agent 10-Point Contract

Every agent or engineer implementing UI must adhere to these 10 binding rules:

1. **Read `implementation-contract.md` first**: Do not write code until you understand the P0 financial invariants.
2. **Read the component system before touching screens**: Primitives in `shared/ui` must be ready and styled before assembling page layouts.
3. **Follow `implementation-order.md`**: Do not jump ahead to complex domain screens before the foundations and shell are solid.
4. **Reuse existing business logic**: Connect to verified domain logic in `modules/ledger`, `modules/savings`, `modules/plan`, `modules/inbox`, and `modules/tenancy`.
5. **Do not redesign**: Follow the canonical Stitch designs pixel-for-pixel. Do not introduce personal styling preferences.
6. **Validate against canonical Light AND Dark Stitch screens**: Every screen must match both theme variants.
7. **Validate at 360, 390, and 430 viewport widths**: Ensure responsive layout resilience across all device sizes within the 440px shell.
8. **Preserve financial semantics**: Opening Balance $\neq$ Income; Transfer $\neq$ Expense; Credit Limit $\neq$ Asset; Jar $\neq$ Bank Account.
9. **Do not mutate production data during visual verification**: Use local mock states or non-destructive reads.
10. **Record deviations before making them**: If a technical blocker is encountered, document it in `blockers.md` before deviating from canonical designs.

---

## 4. Package Document Directory

| Document                                                                                                                                                               | Purpose                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **[README.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/README.md)**                                                         | This master guide and starting instructions                            |
| **[screen-inventory.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/screen-inventory.md)**                                     | Complete inventory of all canonical screens with goals and notes       |
| **[stitch-reference-index.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/stitch-reference-index.md)**                         | Quick lookup table for all Stitch screen IDs (Light/Dark/Superseded)   |
| **[component-reference-index.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/component-reference-index.md)**                   | Reusable UI component families mapped to Task 11 Stitch boards         |
| **[route-screen-map.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/route-screen-map.md)**                                     | Next.js route tree mapped to canonical Stitch screens                  |
| **[component-screen-map.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/component-screen-map.md)**                             | Component to screen usage cross-reference matrix                       |
| **[component-compliance.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/component-compliance.md)**                             | Compliance audit verifying zero one-off UI patterns across all screens |
| **[theme-parity.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/theme-parity.md)**                                             | Light/Dark parity audit covering geometry, content, and contrast       |
| **[localization-readiness.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/localization-readiness.md)**                         | Vietnamese diacritics, English layout resilience, and terminology      |
| **[implementation-contract.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/implementation-contract.md)**                       | Engineering boundaries, permissible actions, and P0 invariants         |
| **[token-handoff.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/token-handoff.md)**                                           | Implementation-facing CSS tokens, Tailwind classes, and typography     |
| **[component-implementation-checklist.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/component-implementation-checklist.md)** | Implementation tracking checklist for reusable UI components           |
| **[screen-implementation-checklist.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/screen-implementation-checklist.md)**       | Implementation tracking checklist for canonical product screens        |
| **[implementation-order.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/implementation-order.md)**                             | Bottom-up dependency graph and staging sequence                        |
| **[existing-ui-impact.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/existing-ui-impact.md)**                                 | Audit classifying existing code as REUSE, RESTYLE, or REFACTOR         |
| **[blockers.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/blockers.md)**                                                     | Blocker log showing 0 open P0 and P1 blockers                          |
| **[final-design-defects.md](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/handoff/final-design-defects.md)**                             | Defect log showing all design defects audited and resolved             |
