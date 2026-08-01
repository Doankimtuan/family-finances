# Testing Checklist

## Automated (required)

- [x] `npm run typecheck` — typed keys + locale unions
- [x] `npm run lint`
- [x] `npm run test`
  - [x] `i18n-routing.test.ts` — locales, default, prefix, BCP-47 map
  - [x] `i18n-messages.test.ts` — en/vi file set + key parity + bootstrap keys
  - [x] `i18n-formatters.test.ts` — currency/number/percent/date/relative
  - [x] `bottom-navigation.test.ts` — five IA tabs (logical hrefs)
- [x] `npm run build` — SSG for `/en/*` and `/vi/*`

## Manual smoke

- [ ] Open `/en` — brand, tagline, Open app, locale switcher
- [ ] Switch to VI — copy updates; URL becomes `/vi`
- [ ] Open `/en/home` and `/vi/home` — TopAppBar + EmptyState + BottomNav labels
- [ ] BottomNav navigation preserves locale prefix
- [ ] Light + dark themes still render (tokens unaffected)

## Fallback checks

- [ ] Invalid locale path (e.g. `/fr/home`) → not found
- [ ] Dev console logs missing-key errors when a key is temporarily removed

## Regression guards

- [ ] No archive/legacy i18n imports
- [ ] Design tokens / AppViewport max width unchanged
- [ ] Health remains route-only (not in BottomNav)
