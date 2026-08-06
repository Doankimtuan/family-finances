---
document: Localization Foundation
status: LOCALIZATION_READY
version: v1.0.0
frozen: true
---

# Localization Foundation

**Status: `LOCALIZATION_READY`**

Production-ready `next-intl` foundation for English (`en`) and Vietnamese (`vi`) before Sprint 1 business work.

## Documents

1. [localization-architecture.md](./localization-architecture.md)
2. [namespace-strategy.md](./namespace-strategy.md)
3. [translation-guidelines.md](./translation-guidelines.md)
4. [locale-switching-flow.md](./locale-switching-flow.md)
5. [formatting-rules.md](./formatting-rules.md)
6. [developer-guide.md](./developer-guide.md)
7. [testing-checklist.md](./testing-checklist.md)
8. [quality-report.md](./quality-report.md)
9. [FREEZE.json](./FREEZE.json)

## Runtime entry points

| Area | Path |
|------|------|
| Routing | `i18n/routing.ts` |
| Request / messages | `i18n/request.ts`, `i18n/load-messages.ts` |
| Navigation | `i18n/navigation.ts` |
| Catalogs | `messages/en/*`, `messages/vi/*` |
| Proxy | `proxy.ts` |
| Types | `global.ts` |
| Formatters | `shared/i18n/formatters.ts` |
| Zod helpers | `shared/i18n/zod.ts` |

## Constraints honored

- No edits to existing frozen SoTs under other `artifacts/**/CURRENT/` packs
- `next-intl` only
- Bootstrap UI strings localized; no business domain catalogs beyond stub placeholders
- Design shell (tokens, AppViewport 440px, BottomNav IA) unchanged aside from string sources
