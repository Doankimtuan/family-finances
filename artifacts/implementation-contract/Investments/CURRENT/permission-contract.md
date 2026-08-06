# Permission Contract

## Roles

- Owner: member who created or controls the investment record.
- Partner: household member with shared finance access.
- Viewer: household member with read-only access to the holding.
- Admin: household member with administrative authority.
- Background Worker: non-user process limited to permitted read-only maintenance.
- System: deterministic product behavior without independent financial discretion.

## Permission Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
|--------|-------|---------|--------|-------|-------------------|--------|--------|
| Recognize Investment | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Creation requires household authority |
| Activate Holding | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Active exposure requires human confirmation |
| Edit Holding Facts | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Changes affect household interpretation |
| Update Valuation | Allowed | Allowed if visible/shared | Forbidden | Allowed | Allowed only for approved read-only source | Forbidden | Value changes are read-only but sensitive |
| Review Holding | Allowed | Allowed if visible/shared | Allowed read-only comment/context only if permitted | Allowed | Allowed only to flag deterministic stale/missing data | Allowed only for deterministic validation failure | Review is attention, not advice |
| Mark Impaired | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Impairment is sensitive human judgment |
| Record Investment Income Context | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Income context affects financial interpretation |
| Partial Exit | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Exit is human-confirmed investment fact |
| Full Exit | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Exit ends active exposure |
| Cancel Investment | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Cancellation changes lifecycle |
| Reclassify Holding | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Domain ownership changes |
| Archive Holding | Allowed | Allowed if visible/shared | Forbidden | Allowed | Forbidden | Forbidden | Archive changes active visibility |
| Read Holding | Allowed if visible | Allowed if visible/shared | Allowed if visible | Allowed | Allowed only for permitted checks | Allowed for deterministic display/read behavior | Visibility controls sensitivity |
| Health Interpretation | Read-only | Read-only | Read-only if visible | Read-only | Forbidden to mutate | Read-only | BR-24 |

## Forbidden Permissions

- Viewer cannot create, activate, edit, exit, impair, cancel, reclassify, or archive.
- Background Worker cannot create investment decisions, exits, impairments, advice, or money movement.
- System cannot automatically trade, rebalance, exit, contribute, or recommend.
- Health cannot mutate any investment record.
- Planning and Goals cannot mutate investment state.

## Permission Failure Result

- Action is rejected.
- Prior state remains unchanged.
- No money moves.
- User receives permission failure.
