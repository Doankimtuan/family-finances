# ST-E01-001 — Known Limitations

1. **No ThemeToggle UI** — Light/dark follows system preference via `next-themes`. Manual toggle belongs to Together/preferences (later stories), not this verify story.
2. **Landing ≠ AppViewport component** — `/[locale]` marketing landing uses CSS `--app-viewport-max` without `#app-viewport-root` / portal host. Product routes under `(product)` use full AppViewport.
3. **AC-019 paths incomplete** — Keyboard accessibility for capture, Inbox resolve, and Month Ritual is not fully exercised; only shell foundation is in scope.
4. **E2E dependency** — Playwright Chromium must be installed in the environment (`npx playwright install chromium`).
5. **Auth chrome not verified** — Auth layout without BottomNav is `ST-E01-002` / later; out of scope here.
