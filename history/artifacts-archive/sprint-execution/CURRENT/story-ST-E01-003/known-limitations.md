# ST-E01-003 — Known Limitations

1. **Checkbox / Field / Form / Link** — Not added; absent from auth Screen Blueprint Required Components and (except Checkbox) from DS Component Catalog as `shared/ui` entries. Auth nav links should use i18n `Link` + `Text`/`Button`.
2. **HeroUI status naming** — Underlying HeroUI uses `status` (`accent` for info). Callers must use DS `variant` prop on the wrapper.
3. **No e2e for Alert** — Covered by unit smoke; screen-level e2e belongs to E02 auth stories.
4. **Auth screens not built** — Wrappers only; Splash/Welcome/Login are later stories.
