# ST-E02-004 — Known Limitations

1. **Supabase dashboard required** — Google and Apple providers must be enabled with redirect allowlist including `{origin}/auth/confirm` (B-ENV-03 / B-ENV-04). App cannot enable providers by itself.
2. **IdP happy-path e2e env-gated** — Playwright asserts hierarchy + start (redirect or fail-closed Alert). Full Google/Apple consent UI is not automated.
3. **Account linking** — Same-email merge / conflict UX is **ST-E02-005**, not this story.
4. **Sign-out / delete** — **ST-E02-006**.
5. **PKCE via server `signInWithOAuth`** — Uses SSR cookie client with `skipBrowserRedirect: true` then browser navigates to returned URL. If a specific Supabase project mis-handles PKCE cookies, fall back investigation may need browser-client start (documented if observed).
