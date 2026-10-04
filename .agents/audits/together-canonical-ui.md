# Together canonical Stitch implementation

Source: Stitch project `16826760243481546078`, screen
`d0e81a7d33c047aaa1d163ba6caf18d8` (ViNha Together & Household Hub).
Retrieved using Stitch MCP; hosted HTML and screenshot downloaded with `curl -L`
to `/tmp/vinha-stitch/`.

## Route and scope

The supplied screenshots and the user's open browser identify `/together`.
The request also mentions `/plan`; canonical IA assigns `/plan` to planning.
An asynchronous clarification was offered. Implementation follows the pictured
household flow at `/together`, preserving the planning route and existing
unrelated workspace changes.

## Implementation

- Shared TopAppBar composition: eyebrow, leading household icon, compact title,
  responsibility badge, and settings shortcut.
- Household identity, actual member count, active status, and Admin/Partner
  responsibility explanation.
- Compact member identities, accessible full names, role context, and active
  status; no fabricated names or avatar identities.
- Admin invitation previews reuse the existing invitation panel, clipboard
  feedback, and revoke confirmation sheet; Partner previews remain read-only.
- Separate app/account settings card, shared-rules and preferences entries.
- Shared semantic tokens, Stitch AppIcon artwork, HeroUI primitives, and matching
  loading header. English and Vietnamese message keys stay aligned.
- Invite CTA and invitation section remain conditional on existing permissions
  and real pending invitations. The current browser actor is a Partner and has
  no pending invitations.
- Canonical Home/Money/Record/Plan/Inbox navigation is retained, per IA.

## Verification

Real authenticated Brave browser:

| Viewport | Shell width | Horizontal overflow | Evidence                                                                  |
| -------- | ----------- | ------------------- | ------------------------------------------------------------------------- |
| 390px    | 390px       | None                | `output/playwright/together-stitch/vi-dark-390.jpg`, `en-light-390.jpg`   |
| 440px    | 440px       | None                | `output/playwright/together-stitch/vi-dark-440.jpg`, `en-light-440.jpg`   |
| 768px    | 440px       | None                | `output/playwright/together-stitch/vi-dark-768.jpg`, `en-light-768.jpg`   |
| 1280px   | 440px       | None                | `output/playwright/together-stitch/vi-dark-1280.jpg`, `en-light-1280.jpg` |

English/light and Vietnamese/dark rendering checked. Reduced motion emulated;
keyboard Tab produces a solid visible focus outline. Settings and member links
reach their existing screens. Browser emulation is temporary and reset afterward.

Checks:

- Repository ESLint passed; changed files passed Prettier and `git diff --check`.
- 43 Together unit/component regression tests passed across four test files,
  including inline invitation actions without a duplicated heading.
- Four read-only Together Playwright smoke tests passed. A temporary ignored
  configuration disables global fixture setup/cleanup, avoiding test data writes.
- Full suite: 1,682 passed, five failures outside this change (Money catalog key
  parity, Money privacy presentation, credit-card facility presentation).
- Typecheck reports two unrelated Home translator type errors in
  `home/home-streaming-sections.tsx` at lines 99 and 340.
- Repository-wide format check reports pre-existing formatting issues in 195
  files; changed-file formatting passes.

## Final review

Applied refactor-review to this task's change set. No new domain strings, route
literals, financial calculations, dependencies, icon system, persisted settings,
or database changes. Existing application queries and mutation/confirmation
contracts are reused. Other workspace changes were excluded from the touch set.
