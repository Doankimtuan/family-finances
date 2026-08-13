# Codex UI Guide

Before generating or modifying UI, Codex must:

1. Read Phase B information architecture.
2. Read Phase C UX contract.
3. Read Phase D design system.
4. Inspect existing shared components.
5. Inspect the target screen in a real browser.
6. Identify reusable primitives and patterns.
7. Produce a small implementation plan.
8. Implement one screen or one coherent flow only.
9. Run browser verification at 440px.
10. Verify light and dark modes.
11. Verify English and Vietnamese text fit.
12. Compare against the design contract.
13. Fix visual and interaction issues.
14. Stop.

## Mindset

Codex must never create product UI from prompt text alone when a running browser is available.

Use the existing stack:

- Next.js.
- HeroUI wrappers.
- Tailwind v4 and semantic tokens.
- Geist typography.
- Hugeicons Free Stroke Rounded through the shared `AppIcon` boundary.
- Motion only for purposeful feedback.
- Recharts only when a chart answers a real question.

## Guardrails

- Preserve IA, route ownership, UX flows, and business behavior.
- One primary action per state.
- One screen or one flow per task.
- No hardcoded strings or colors.
- No arbitrary radius values or icon libraries.
- Keep the centered app shell at `max-width: 440px` on every viewport; desktop preserves the mobile interaction model.
- Use HeroUI v3 for primary inputs, selects, dates, times, numbers, buttons, and overlays.
- Do not keep native primary Select, Date, or Time controls when HeroUI equivalents exist.
- No imports from `archive/legacy-v1`.
- No business redesign.
- No card soup.
- No marketing-page composition inside product screens.
- No hidden real money movement.
- No unlabeled estimated or stale values.
