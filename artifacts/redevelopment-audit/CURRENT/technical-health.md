# Technical Health

Obvious issues only. No deep code review was performed.

## Issues

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| Large route-colocated UI files over 250 lines concentrate layout, validation, mutation, and interaction state. | High | High | Medium |
| `shared/patterns` is a broad catch-all for shell, product, module, overlay, and state patterns. | Medium | High | Medium |
| Empty scaffold folders (`components/`, `packages/`, `shared/lib`, many `modules/*/{domain,infrastructure}`) obscure what is active versus aspirational. | Medium | Medium | Low |
| Compatibility routes `/money/add` and `/money/cards` remain in the active app tree. | Medium | Medium | Low |
| Deprecated domain aliases and action wrappers remain in ledger/savings/money action files. | Medium | Medium | Medium |
| Route files repeatedly implement locale validation, `setLocale`, session lookup, and membership redirect logic. | Medium | Medium | Medium |
| Health route is outside bottom navigation but still product-facing. | Medium | Medium | Low |
| Money has the deepest route hierarchy and the most mixed UI ownership. | Medium | High | Medium |
| App routes import multiple modules directly for orchestration. This is visible especially in Money, Inbox, Plan, and Savings flows. | Medium | High | Medium |
| Product-specific shared cards (`JarCard`, `GoalCard`, `HealthCard`, `LoanCard`, `AccountCard`, `CreditCardCard`) may be too module-specific for `shared/patterns`. | Medium | Medium | Medium |
| There is no visible shared action-page pattern for edit/refund/correct/early-withdraw/pay/close flows. | Medium | High | Medium |
| Dialog and sheet primitives exist, but form presentation conventions are not centralized. | Medium | Medium | Medium |
| `ProductStub` exists but appears unused in current product routes. | Low | Low | Low |
| `InstallmentCard` remains as a deprecated alias to `LoanCard`. | Low | Low | Low |
| Tailwind source exclusions are necessary because archive/docs contain invalid/banned examples. This is pragmatic but increases maintenance coupling to repo layout. | Low | Low | Low |

## Notable Strengths

- Centralized route constants through `APP_PATH`.
- Tailwind v4 and HeroUI are configured consistently.
- Semantic design tokens exist for surfaces, text, actions, status, money direction, health, and charts.
- App shell separates auth/system/product chrome.
- Bottom navigation uses typed tab definitions and app path constants.
- Shared primitives exist for common UI controls and states.
- Provider composition is centralized.

## Risk Concentration

Highest redesign risk is in large client components and deep Money/Plan workflows. These areas will absorb most IA and component-system churn unless normalized early in Phase B.

