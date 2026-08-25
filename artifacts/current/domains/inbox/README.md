# Inbox Domain Package

This package consolidates the final approved outputs for Inbox.

## Sources

- `household-reality-validation/`
- `product-decision/`
- `business-blueprint/`
- `implementation-contract/`

Business content is copied unchanged from approved CURRENT sources.


## Discovery coverage and redesign status

The Inbox discovery inventory is complete. The following status map is the implementation checklist for the current attention-center redesign.

| Discovered surface | Status | Implementation note |
|---|---|---|
| Open queue | Redesigned | Summary-first hierarchy, semantic item visuals, grouped section, compact rows, and redesigned filter surface. |
| Pending item cards | Redesigned | Shared `ReviewCard` now exposes leading identity, semantic badge tone, amount hierarchy, and quiet next-step cue. |
| Archived/history queue | Redesigned | History section and neutral, visually demoted cards; list remains readable and non-mutating. |
| Open / Archived tabs | Intentionally unchanged because already compliant | Query semantics and two-tab contract remain unchanged; presentation remains compact. |
| Search and kind filters | Redesigned | Existing local behavior preserved; controls now sit in a soft grouped surface with horizontal chip scanning. |
| Item detail | Redesigned | Detail TopAppBar/back affordance, decision-context surface, status hierarchy, source facts, and demoted terminal state. |
| Resolve / acknowledge / dismiss actions | Intentionally unchanged because already compliant | Existing decision panel and server actions remain behaviorally unchanged; only surrounding hierarchy was redesigned. |
| Savings selectors and jar picker | Intentionally unchanged because already compliant | Existing picker/action contracts remain intact to avoid behavior changes. |
| Source links | Intentionally unchanged because already compliant | Existing transaction, Savings, and Plan/Jar destination resolver remains authoritative. |
| Empty, filtered-empty, load-error, not-found, and offline states | Redesigned | State surfaces retain their existing semantics while adopting the new queue/detail hierarchy. |
| Loading skeleton | Redesigned | Skeleton mirrors summary, tabs, filters, grouped section, and item footprints. |
| Home, Plan, and Health entry points | Intentionally unchanged because already compliant | Existing entry conditions, count wiring, and cross-feature navigation were not changed. |
| Modals, dialogs, sheets, overflow menus, bulk actions, delegation | Unreachable/legacy | No current reachable Inbox surface exists; nothing was invented. |
| Legacy/removed item kinds and stale translation keys | Unreachable/legacy | Existing read-boundary filtering and compatibility constants remain unchanged. |
| Ownership/read-only and former-member behavior | Intentionally unchanged because already compliant | Existing capability and permission rules remain authoritative. |

No generation, pending-count, lifecycle, categorization, ownership, route, Supabase/RPC, or financial calculation behavior was changed by this redesign.
