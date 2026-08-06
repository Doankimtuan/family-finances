# Translation Guidelines

## Language policy

- **English (`en`)** — default development language; catalogs are the typing source of truth
- **Vietnamese (`vi`)** — secondary locale; must keep key parity with `en`

## Key naming

- Files: `camelCase` namespace file names (`emptyStates.json`)
- Keys: `camelCase` (`openApp`, `homeTitle`)
- Prefer flat keys inside a namespace; nest only when a clear section exists
- No sentence-case keys; no emoji in keys

## Content voice

- Calm adult product voice (Calm Ledger)
- Glossary terms stay consistent when business copy lands (Jar, Inbox, ReviewItem, Month Ritual, Partner)
- Vietnamese may be longer — UI must tolerate length (design foundation already notes this)

## Adding a new locale

1. Copy `messages/en/` → `messages/{locale}/`
2. Translate values (keep keys identical)
3. Add locale to `locales` in `i18n/routing.ts`
4. Add BCP-47 mapping in `i18n/locales.ts` (`toIntlLocale`)
5. Update `AppConfig.Locale` union via routing locales
6. Extend tests expecting `['en','vi',…]`

## Adding translations

1. Add key to `messages/en/{namespace}.json` first
2. Mirror key in `messages/vi/{namespace}.json`
3. Consume via `useTranslations` / `getTranslations` — no hardcoded user-facing strings in features
4. Run `npm run test` (key parity) and `npm run typecheck`

## Forbidden

- `react-i18next`, `next-i18next`, or other i18n frameworks
- Hardcoded UI copy in bootstrap/product shell after this freeze
- Editing frozen product/design SoTs to “document” strings — catalogs are the string source
