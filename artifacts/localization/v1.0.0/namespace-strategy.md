# Namespace Strategy

## Rule

One JSON file per namespace per locale. Never a single monolith catalog.

```
messages/{locale}/{namespace}.json
```

## Namespaces

| Namespace | Purpose |
|-----------|---------|
| `common` | Brand, shared chrome copy, loading, plural samples |
| `navigation` | BottomNav / IA labels |
| `auth` | Auth UI (scaffold) |
| `money` | Money feature (stub title now) |
| `plan` | Plan feature |
| `inbox` | Inbox feature |
| `health` | Health route |
| `settings` | Preferences including language labels |
| `validation` | Zod / form field errors |
| `errors` | Generic / offline / not-found |
| `buttons` | Shared button labels |
| `dialogs` | Confirm dialogs |
| `forms` | Form chrome (optional/required) |
| `emptyStates` | Empty state titles/descriptions |
| `toast` | Toast strings |
| `metadata` | Document title/description |
| `a11y` | Accessibility labels |

## Loading

`i18n/load-messages.ts` merges all namespaces into one messages object for next-intl:

```ts
{ common: {...}, navigation: {...}, ... }
```

Usage:

```ts
const t = useTranslations('navigation');
t('home');
```

## Adding a namespace

1. Add `{name}.json` under `messages/en/` and `messages/vi/` with identical key trees
2. Append the name to `MESSAGE_NAMESPACES` in `i18n/load-messages.ts`
3. Extend `AppMessages` in `global.ts`
4. Add key-parity coverage (automatic via namespace list test)
