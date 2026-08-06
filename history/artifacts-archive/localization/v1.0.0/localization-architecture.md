# Localization Architecture

## Stack

- **Library:** `next-intl` (only)
- **Locales:** `en` (default), `vi`
- **Prefix:** always (`/en/...`, `/vi/...`)
- **App Router:** pages under `app/[locale]/...`
- **Edge/proxy:** Next.js 16 `proxy.ts` composes `next-intl` middleware + Supabase session refresh

## Request path

1. Request hits `proxy.ts`
2. `createMiddleware(routing)` negotiates locale (path → cookie → Accept-Language → `en`)
3. `updateSession(request, response)` refreshes auth cookies without dropping locale redirects
4. `app/[locale]/layout.tsx` validates locale, `setRequestLocale`, loads messages via `getRequestConfig`
5. `NextIntlClientProvider` wraps the tree for client components

## Module map

```
i18n/
  routing.ts       defineRouting
  navigation.ts    Link, useRouter, usePathname, redirect
  request.ts       getRequestConfig
  load-messages.ts merge namespace JSON files
  locales.ts       toIntlLocale (en-US / vi-VN)
  set-locale.ts    validate + setRequestLocale helper
messages/
  en|vi/*.json     namespaced catalogs
shared/i18n/
  formatters.ts
  use-app-formatter.ts
  zod.ts
global.ts          AppConfig type augmentation
```

## Server vs client

| Context | API |
|---------|-----|
| Server Components / metadata | `getTranslations`, `getMessages`, `setRequestLocale` |
| Client Components | `useTranslations`, `useLocale`, `useFormatter` / `useAppFormatter` |
| Navigation | `@/i18n/navigation` (never raw `next/link` for app routes) |

## Fallback & missing keys

- Unknown locale segment → `notFound()`
- Missing namespace file at runtime → load English file for that namespace
- Missing message key → `getMessageFallback` returns `namespace.key`; logged in development via `onError`

## Extension points (later sprints)

- Household-persisted locale preference (path/cookie remains source of truth for v1)
- Progressive fill of domain namespaces (`money`, `plan`, `inbox`, …) as features ship
- Auth namespace when auth UI lands
