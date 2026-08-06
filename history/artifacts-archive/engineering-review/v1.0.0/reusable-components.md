# Reusable Components — Pattern v1

## Created / formalized

| Component | Path | Role |
|-----------|------|------|
| `StatusAlert` | `shared/ui/status-alert.tsx` | Compact Alert title+description |
| `FormField` | `shared/ui/form/form-field.tsx` | Label, error, description, a11y |
| `TextField` | `shared/ui/form/text-field.tsx` | RHF-friendly Input + FormField |
| `ChromeShell` | `shared/patterns/chrome-shell.tsx` | AppViewport + chrome + footer slot |
| `AuthScreenShell` | `shared/patterns/auth-screen-shell.tsx` | Auth column layout |

## Already shared (adopt / export)

| Component | Action |
|-----------|--------|
| `LoadingState` | Use on confirm pending |
| `Alert` | StatusAlert wraps it |
| `ProductStub`, `LocaleSwitcher` | Barrel export |
| `Button` | Default min touch height |

## Not created

See `abstraction-opportunities.md` speculative list.
