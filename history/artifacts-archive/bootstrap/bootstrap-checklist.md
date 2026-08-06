# Bootstrap Checklist — Sprint 0

## Audits

- [x] dependency-audit.md
- [x] dependency-graph.md
- [x] package-cleanup-report.md
- [x] folder-audit.md
- [x] configuration-audit.md

## Packages

- [x] Approved stack installed
- [x] Missing HeroUI / Phosphor / Motion / next-themes / RHF / etc. added
- [x] eslint-plugin-unused-imports added
- [x] package-lock.json generated (npm)
- [x] No dual UI kits

## Folders

- [x] features/
- [x] providers/
- [x] styles/
- [x] types/
- [x] shared/ui/
- [x] shared/patterns/
- [x] shared/hooks/
- [x] shared/lib/
- [x] shared/utils/
- [x] archive/ untouched (read-only)
- [x] components/ not grown

## Foundation

- [x] ThemeProvider (next-themes, system default)
- [x] QueryProvider
- [x] SupabaseProvider + client factories
- [x] ToastProvider
- [x] ModalProvider (host inside AppViewport)
- [x] AppProvider composition
- [x] SafeArea
- [x] AppViewport 440px
- [x] BottomNavigation (5 IA tabs; Health not 6th)
- [x] TopAppBar shell
- [x] Design tokens + dark mode
- [x] Geist typography

## Shared UI

- [x] Button, IconButton, Text, Heading
- [x] Input, Textarea, Select
- [x] Avatar, Badge, Divider, Spinner, Skeleton
- [x] Card, Sheet, Dialog, Toast (patterns)
- [x] EmptyState, LoadingState, ErrorState

## DX / Config

- [x] TypeScript strict + aliases
- [x] ESLint + Prettier
- [x] Vitest + Testing Library
- [x] Playwright config
- [x] Husky + lint-staged
- [x] typecheck / format scripts

## Gates

- [x] typecheck
- [x] lint
- [x] build
- [x] vitest
- [x] playwright --list

## Freeze

- [x] artifacts/bootstrap/CURRENT/
- [x] BOOTSTRAP_READY
