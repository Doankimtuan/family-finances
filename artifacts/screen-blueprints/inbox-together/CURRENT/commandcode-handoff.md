# CommandCode Handoff — Inbox + Together

Build one coherent Inbox + Together UI batch without reopening business decisions or rereading the repo broadly.

## Read First (only)

1. `artifacts/screen-blueprints/inbox-together/CURRENT/blueprint.md`
2. `artifacts/screen-blueprints/inbox-together/CURRENT/final-verdict.md`
3. Current UI:
   - `app/[locale]/(product)/inbox/**`
   - `app/[locale]/(product)/together/**`
   - `app/[locale]/(invite)/invite/[token]/**`
   - `app/[locale]/(onboard)/together/onboard/**` only if onboard polish is required for no-household gate
4. Application APIs already imported by those screens (`modules/inbox/application`, `modules/tenancy/application`, savings actions used by Inbox maturity/early-withdraw)
5. Shared patterns: `TopAppBar`, `ReviewCard`, `EmptyState`, `StatusAlert`, `SectionHeader`, `Button`, `Page`/`Section`/`BottomActionBar` if polishing

Do not read archived artifacts, legacy-v1, or unrelated Money/Plan redesign docs beyond path helpers and existing savings action signatures.

## Non-Negotiable Rules

### Inbox money & ownership

| UI action | What Inbox may do | What must happen for money |
|---|---|---|
| View queue / open item | Read review items | Nothing |
| Resolve unmapped/income_suggest | Call `resolveInboxAction` → `resolveInboxItemToJar` | **SOURCE_DOMAIN**: RPC sets `transactions.jar_id` on existing `source_id`. **No new transaction.** Balances unchanged. |
| Dismiss / EMI ack / remind-tomorrow | Inbox status only | **NONE** |
| Savings maturity confirm/switch/withdraw | Call `acknowledgeSavingsMaturityAction` in money/savings actions | **SOURCE_DOMAIN**: existing `settleSaving` / `renewSaving` only. Never reimplement settle in Inbox. |
| Early withdrawal confirm/cancel | Call `acknowledgeEarlyWithdrawalAction` | **SOURCE_DOMAIN** via savings module |
| Emergency / payment reminder | Explain + dismiss/ack per existing panel | **NONE** in Inbox; Plan/Money remain owners |

Copy rules:

- Resolve attention ≠ paid / transferred / refunded
- Expiration ≠ paid
- Dismiss ≠ deleted source
- Amount on ReviewCard is source context, not a balance to edit in Inbox

### Together money & roles

| Action | Effect |
|---|---|
| Members, invite, accept, revoke, policies, preferences | **NONE** money |
| Roles | Display `HOUSEHOLD_ROLE.ADMIN` / `HOUSEHOLD_ROLE.PARTNER` only |
| Change Role UI | **Do not invent** — no tenancy change-role command exists today |
| Owner / Viewer / custom roles / ownership transfer | Forbidden |
| Partner engagement scoring / activity surveillance | Forbidden |

### Explicitly out of scope (do not build)

- Batch multi-select resolve (deferred grouping)
- Partner assignment / delegation UX (deferred IB-PD-012)
- Notification center / marketing alerts in Inbox
- Together-initiated money movement
- New permission matrices

## Build Order

1. **Inbox queue ready state**
   - Keep Open / Archived tabs (`?tab=archived` existing behavior)
   - Prefer calm list hierarchy: tabs → items; keep filter/search secondary
   - Empty active queue = no decisions needed (not “finances are safe”)
   - Use `ReviewCard`; routes via `inboxItemPath` / `APP_PATH.INBOX`

2. **Inbox detail + typed decisions**
   - Hierarchy: kind/decision question → source facts → primary outcome → dismiss confirm
   - Keep kind branching in `InboxDecisionPanel`; do not collapse distinct kinds into one generic form
   - Offline fail-closed (existing)
   - On success: `replace` to Inbox queue (existing); avoid navigation loops
   - Add **View source** when `sourceId` + source type known:
     - `transaction` → money transaction detail path helper
     - savings-guided → savings detail path if already available
     - `plan_movement` / emergency → plan context if path exists; else omit rather than invent
   - Preserve return to Inbox (origin = Inbox)

3. **Jar resolve path**
   - Active jars only (existing `listCaptureJars` / select)
   - Pattern suggestion is optional read-only (confidence); never auto-submit from UI
   - Success receipt: attention resolved; real money unchanged; jar association updated

4. **Savings maturity / early-withdraw path**
   - Keep calling savings actions already wired
   - Primary button weight may follow suggestion, but all outcomes must stay explicit
   - If money moves, receipt must say Savings/Money changed via source domain — not “Inbox paid”

5. **Together hub**
   - Members list with role badges using `HOUSEHOLD_ROLE` constants (fix magic `"admin"` compare)
   - Invite CTA → invitations
   - Links to policies + preferences via `TOGETHER_PATH`

6. **Invite flow**
   - Keep create + copy link + revoke
   - Accept screen remains fail-closed for invalid/expired/mismatch
   - Attribution: inviter identity is accountability context only

7. **Policies as approved shared action**
   - Admin edit / Partner read-only (`canEdit`)
   - Material events list already present — keep actor attribution
   - Confirm or clear copy: policy change does not move money

8. **i18n + states**
   - EN + VI for changed strings
   - Empty, offline, permission, not-found
   - Light/dark; 390 and 440 no critical breakage
   - Prefer sticky primary decision action on long detail if polishing

## Implementation Notes

- Owner modules: `inbox` (queue/detail), `tenancy` (Together/invite)
- Constants:
  - `modules/inbox/application/inbox-constants.ts` (`InboxItemStatus`, `InboxItemKind`, `ReviewItemType`, ack actions)
  - `modules/tenancy/application/app-path.ts`, `tenancy-constants.ts` (`TOGETHER_PATH`, `HOUSEHOLD_ROLE`, invitation codes)
- Prefer existing server actions; do not add new RPCs/commands in this UI batch
- `assignedToUserId` on emergency items is context only — not a product “delegate” feature
- Magic-string law: no hardcoded routes/roles/statuses at call sites

## Exact Touch Set (expected)

```
app/[locale]/(product)/inbox/**
app/[locale]/(product)/together/**
app/[locale]/(invite)/invite/[token]/**
messages/en/inbox.json
messages/vi/inbox.json
messages/en/together.json
messages/vi/together.json
tests/e2e/inbox*.spec.ts
tests/e2e/together-*.spec.ts
```

Touch savings actions **only** if Inbox panel wiring to existing exports breaks — do not change settle/renew semantics.

Do not change:

- Ledger write semantics / transaction capture
- Plan allocate/ritual money guarantees
- Invitation capacity/TTL business rules except display
- Routes listed above
- Home/Money/Plan screens except existing cross-links into Inbox/Together

## Done Means

- Queue + detail + Together hub + invite + policies match blueprint
- No batch/delegate UI
- No Together money movement
- Jar resolve and savings paths use canonical mechanisms once
- Browser evidence: Inbox queue, one resolve/ack happy path, Together members, invite send, policies view/edit as role allows
- Typecheck + lint + focused tests pass

## Highest-Risk Gaps To Fix

1. Inbox maturity actions readable as Inbox moving money → force source-domain language + keep savings actions.
2. Missing source navigation → add view-source + return to Inbox.
3. Role literal / invented role change → use `HOUSEHOLD_ROLE`; do not add change-role UI.
4. Long decision stacks without primary sticky action → polish for 390px.
5. Temptation to “help” with batch/delegate → refuse; deferred by Product Decision.
