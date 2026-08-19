# ViNha Home IA/UX Implementation — 07A

## Summary

Implemented the Home hierarchy and core UX corrections without changing
financial calculations, read-model contracts, routes outside the requested
actions, chart type/data, or motion behavior.

## Before → after Home hierarchy

Before:

1. Long contextual header with a cash-flow conclusion, metadata, and a
   duplicated Inbox count.
2. Period selector and current-position pulse.
3. Cash flow and spending cards.
4. Conditional Plan card.
5. Conditional Inbox card.

After:

1. Compact Home header with localized greeting, Home identity, and icon.
2. Period selector.
3. Money now: total across accounts, subordinate net cash flow, and one
   state-aware primary action.
4. This period: cash flow and spending grouped as one period story.
5. Needs attention: stable Inbox location with pending or quiet-clear state.
6. Plan ahead: stable compact Plan summary, including the zero-Jar setup
   state.

## Header changes

Removed the dynamic cash-flow H1, supporting paragraph, account/Inbox metadata,
and Home-content Inbox header pill. The compact `primary` TopAppBar keeps the
short greeting and Home identity so the authoritative amount arrives earlier.

## Money-now changes

The existing balance and net cash-flow calculations remain unchanged. The
financial pulse remains the only prominent surface. With an account,
`Add expense` still routes to `APP_PATH.MONEY_ADD`; with no account, the action
becomes localized `Add an account` / `Thêm tài khoản`, uses the primary action
style, and routes to `APP_PATH.MONEY`.

The account-create capability is owned by the Money hub. `/money/accounts` is
only a redirect to that hub, so no new direct account route was invented.

The main amount is wrapped in an accessible group labelled with the existing
localized `Total across accounts` meaning.

## Day-zero implementation

The existing definition remains `accountCount === 0 && activeJarCount === 0`.
The previous Invite / Plan / Add expense trio is now:

1. Add an account — primary, online-only, routes to the Money hub.
2. Set up Plan — secondary, optional, routes to `APP_PATH.PLAN`.
3. Invite a member — quiet secondary destination, routes to
   `APP_PATH.INVITATIONS`.

No actionable Add expense control is rendered in day-zero. On the day-zero
surface, the localized description now explains that an account is needed for
real transactions and that Plan/invitations can wait.

## Needs-attention behavior

Inbox now has a stable Home location before Plan. Pending state shows the
localized pending count once and one primary Open Inbox action. Clear state
renders the existing neutral clear copy without a count badge, large empty
card treatment, or unnecessary destination button. The persistent bottom-nav
badge remains outside Home content.

## Plan-ahead behavior

Plan now follows Needs attention and always renders when the Home dashboard is
available. It remains compact and uses only active Jar count, income
allocation mode, and the existing Open Plan destination. Zero active Jars
renders the existing setup-needed copy and Open Plan action instead of removing
the conceptual section.

## State handling

No state-machine framework was added. Existing whole-screen loading/failure and
offline behavior remain intact. Home now explicitly handles the attention
pending/clear and Plan configured/setup-needed presentation states. Freshness,
stale, partial-source, and permission-specific contracts remain deferred
because the current read model does not expose authoritative metadata for
them.

Health is still not rendered on Home; no new score or financial-health claim
was introduced.

## Shared primitive changes

Reused `Page`, `Section`, `KpiBlock`, `TopAppBar`, `Balance`, `Button`,
`QuickAction`, `AppIcon`, and existing registries. `FilterChip` was not
changed; the 44px shared-foundation decision remains deferred. No new UI
library, icon library, motion library, or generic dashboard abstraction was
added.

## Accessibility

- Day-zero no longer exposes an actionable Add expense control.
- The main amount retains the existing visible total label and an explicit
  accessible group label.
- Home content announces the Inbox pending count once.
- DOM order follows header → period control → money now → this period → Needs
  attention → Plan ahead → bottom navigation.
- Existing shared focus behavior and 44px-or-larger action targets were
  preserved.

## Browser evidence

Authenticated Home screenshots for this implementation could not be captured.
The available in-app browser opened the local app but had no authenticated tab;
`/en/home` resolved to the login screen. The configured E2E credentials were
also rejected by the local login flow, so populated, day-zero, pending Inbox,
clear Inbox, VI/EN, light/dark, quarter, offline, reduced-motion, and
390/440/768/1280 Home states were not claimed as browser-verified in this
batch. Existing pre-change audit screenshots remain untouched and are not
used as evidence for this implementation.

## Deferred work

- shared visual foundation and the FilterChip 44px decision;
- chart point-by-point accessibility and visualization polish;
- freshness/stale/partial data contracts;
- motion simplification and the dedicated Home motion pass;
- broader Money, Plan, and Home content work;
- authenticated browser screenshots at the required widths and states.

## Validation

- Home IA/action unit tests: pass — 4 files, 17 tests.
- Full unit suite: pass — 120 files, 901 tests.
- Lint: pass — `npm run lint`.
- Typecheck: pass — `npm run typecheck`.
- Build: pass — `npm run build`.
- Home locale parity: pass — 89 leaf keys in EN and VI.
- Targeted Home E2E: unauthenticated redirect passed; authenticated case
  reached login but failed because the configured E2E credentials were
  rejected. No authenticated result is claimed.
