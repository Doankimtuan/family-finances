# Locale Switching Flow

## URL model

`localePrefix: 'always'`

| Locale | Examples |
|--------|----------|
| en | `/en`, `/en/home`, `/en/money` |
| vi | `/vi`, `/vi/home`, `/vi/money` |

Bare `/` redirects to a prefixed locale via next-intl middleware.

## Detection order

1. Path prefix (`/vi/home` → `vi`)
2. Locale cookie (next-intl)
3. `Accept-Language`
4. Default `en`

## UI switcher

`shared/patterns/locale-switcher.tsx` (foundation control on landing):

- Uses `usePathname` + `useRouter` from `@/i18n/navigation`
- `router.replace(pathname, { locale })` keeps the logical path, swaps prefix
- Accessible group label from `a11y.localeSwitcher`

## Product navigation

BottomNav and CTAs use `@/i18n/navigation` `Link` / `useRouter` so the active locale prefix is preserved.

## Future: household preference

When Together/Settings persist household locale:

1. Read preference after auth
2. Redirect or `router.replace` to preferred locale if it differs from path
3. Do not remove path-based routing — path remains the request source of truth
