# Engineering Review — Sprint 2

## Reuse

| Asset | Reused? | Notes |
|-------|---------|-------|
| shared/ui FormField, CheckboxField, AmountField, StatusAlert, Button | **Yes** | Reallocate form |
| `assertMoneyActionAllowed` / plan unlock gate | **Yes** | |
| Plan / inbox constants | **Yes** | |
| Policy helpers in unit tests | **Yes** | |
| Command Zod schema in form | **No** | Duplicated client schema |

## Smells

| Item | Severity | Location |
|------|----------|----------|
| Duplicated Zod refine in form | Low | `reallocate-jar-form.tsx` |
| Warn checkbox largely decorative | Medium | Form `awaitingWarn` auto-ack |
| SQL product literals without TS mirror for `plan_movement` source | Low | Migration |
| Cross-BC inbox insert inside plan RPC | Medium | Migration RPC |
| Race-fragile ledger count guard | Low–Med | RPC |

## Abstraction quality

- `plan-movement-policy.ts` is the right home for BR-07 / zero-impact predicates — **good**.
- `applyCapacityDelta` is a thin scalar helper — appropriate.
- No over-engineered event bus — under-engineering relative to Spec events, acceptable for Alpha1 with debt tag.

## Engineering score input

**7.5 / 10**
