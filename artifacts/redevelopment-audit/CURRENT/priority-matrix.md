# Priority Matrix

## High Priority

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| Large route-colocated UI files will slow redesign iteration and make visual/system changes expensive. | High | High | Medium |
| Money route hierarchy is broad and deep, with many object and action subflows under one tab. | Medium | High | Medium |
| `shared/patterns` lacks clear ownership tiers. | Medium | High | Medium |
| No visible shared pattern exists for action pages and mutation-heavy workflows. | Medium | High | Medium |
| Route taxonomy is implicit rather than documented. | Medium | High | Low |

## Medium Priority

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| Compatibility routes remain in the app tree. | Medium | Medium | Low |
| Deprecated aliases and wrappers remain visible in current code. | Medium | Medium | Medium |
| Repeated auth/session/membership guard logic appears in route components. | Medium | Medium | Medium |
| Health is product-facing but outside primary bottom navigation. | Medium | Medium | Low |
| Empty scaffold folders obscure active ownership. | Medium | Medium | Low |
| Product-specific shared cards may be too module-specific for global `shared/patterns`. | Medium | Medium | Medium |
| Forms share primitives but not enough workflow-level structure. | Medium | High | Medium |
| Together onboarding path lives under `/together` but route ownership is in `(onboard)`. | Low | Low | Low |

## Low Priority

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| `ProductStub` appears unused. | Low | Low | Low |
| `InstallmentCard` deprecated alias remains. | Low | Low | Low |
| Tailwind source exclusions depend on archive/docs staying outside scan scope. | Low | Low | Low |
| Placeholder platform folders are not visibly active. | Low | Low | Low |

## Suggested Phase B Order

1. Route taxonomy and navigation grouping.
2. Component ownership model.
3. Page/action workflow patterns.
4. Compatibility/deprecated surface disposition.
5. Large component decomposition plan.

