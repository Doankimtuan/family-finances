# Refactor Plan — Execution Order

1. Add `StatusAlert`; migrate login, confirm, money-gate Alerts.
2. Add `FormField` + `TextField`; migrate login fields; share `signInInputSchema`; drop dead `validation` error code.
3. Add `ChromeShell`; wire auth + product layouts.
4. Add `AuthScreenShell`; wire login, welcome, confirm, money-gate.
5. Confirm pending → `LoadingState`.
6. Button default `min-h-11` (non-icon); strip redundant classes.
7. Barrel-export `ProductStub`, `LocaleSwitcher`.
8. lint / typecheck / unit / e2e.
9. Freeze Engineering Pattern v1.
