# Reusable Hooks — Pattern v1

## Extracted this freeze

**None.** Only one async form submit (`login` + `useTransition`). Rule of Three not met.

## Watchlist

| Hook | Trigger |
|------|---------|
| `useFormSubmit` / `useActionTransition` | ≥3 server-action form screens |
| `useConfirm` | ≥3 confirmation dialogs |
| `useDisclosure` | ≥3 open/close overlays outside Dialog/Sheet |

## Existing hooks to keep

- `useAppFormatter` — locale formatting
- Splash `useEffectEvent` resolve — intentional, not generalized
