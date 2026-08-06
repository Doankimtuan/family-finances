# Reusable Layout Patterns — Pattern v1

## ChromeShell

`AppViewport` → `data-chrome` region → scrollable `<main>` → optional `footer` (e.g. BottomNavigation).

Used by `(auth)/layout` and `(product)/layout`.

## AuthScreenShell

Full-height column for auth/system screens:

- `centered` — justify-center + token padding/gap
- `data-testid` passthrough

Used by login, welcome, confirm, money-gate. Splash keeps brand-first custom layout.

## Not introduced

FormPage, ListPage, DetailPage, SettingsPage, ReviewPage, BottomActionBar, StickyFooter — speculative for current surface.
