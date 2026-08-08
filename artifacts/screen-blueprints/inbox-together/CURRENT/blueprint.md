# Phase E4 — Lean Inbox + Together Blueprint

Status: Canonical lean implementation blueprint.

Scope: Inbox review queue + Together household collaboration. Documentation only.

Authorities: Phase B IA, Phase C UX, Phase D DS, `artifacts/current/domains/inbox/`, `artifacts/current/domains/together/`, current `app/[locale]/(product)/inbox/`, `app/[locale]/(product)/together/`, invite accept, and Together onboard surfaces only.

## Critical invariants

- Inbox is a review/work queue, not a second financial ledger.
- Resolving Inbox attention does not invent money movement; any real money effect must use the canonical source-domain mechanism.
- Delegation and batch processing are **not approved** product capabilities (deferred IB-PD-012 / IB-PD-014). Do not invent them.
- Together never moves money, allocates jars, or funds goals.
- Together roles are only `partner` | `admin` (`HOUSEHOLD_ROLE`). No Owner, Viewer, Guest, Approver, or custom roles.
- Shared actions remain attributable to the actual actor (invite creator, policy editor, Inbox resolver).

Financial effect vocabulary for this batch: **NONE** | **SOURCE_DOMAIN**.

---

## 1. Current Surface Inspection (max 8)

1. **Hierarchy** — Inbox queue is filter/search-heavy before the decision list; detail stacks ReviewCard → why → long typed decision panels without a single dominant decision question.
2. **Missing source navigation** — Detail has `sourceId` / kind context but no clear link into the owning Money/Plan object and back with origin preserved.
3. **Action priority confusion** — Maturity panel exposes many equal-weight buttons; dismiss sits below every typed panel and can compete with the real decision.
4. **Duplicate / ad-hoc chrome** — Queue and Together use raw bordered rows/buttons instead of calibrated `Page` / `Section` / `BottomActionBar` patterns used elsewhere.
5. **Permission ambiguity (UI)** — Together `MemberList` compares `role === "admin"` with a literal; role change has a domain contract but **no** tenancy application command/UI — must not invent ownership transfer.
6. **Batch/delegation gap vs UX journey names** — Critical journeys mention batch/delegate, but Product Decision deferred them; current code has no batch/delegate APIs. Treat as out of scope.
7. **Stale/recovery** — Queue runs `runInboxStalenessWorker` best-effort; detail only mutates when `PENDING`. Expired/archived recovery UI is thin (status text only).
8. **Responsive** — Long maturity/early-withdraw decision stacks lack sticky primary action; 390px thumb reach at risk on detail.

---

## 2. Canonical UX Surfaces

### Inbox Queue — `/inbox`

| | |
|---|---|
| Purpose | Browse unresolved financial attention; separate historical items. |
| Hierarchy | TopAppBar → offline → Open/Archived tabs → list (or empty/error) → optional kind filter/search secondary. |
| Primary action | Open a Pending item. |
| Secondary | Switch Archived tab; filter/search within list. |
| Components | `TopAppBar`, `EmptyState`, `StatusAlert`, `ReviewCard` (via queue list), existing tabs/offline banner. Prefer `Page`/`Section` polish if touched. |
| Nav | Tab Inbox; detail via `inboxItemPath(id)`. |
| Ownership / permission | Active household member; Viewer-equivalent does not exist in tenancy — Partners and Admins share daily Inbox rights. |
| Financial effect | **NONE** (read-only queue). |

### Inbox Review Detail — `/inbox/[id]`

| | |
|---|---|
| Purpose | Understand one typed review item and take one valid outcome. |
| Hierarchy | Back/identity → decision question + kind → source facts → consequence hint → primary outcome → secondary dismiss/defer-if-present → link to source domain. |
| Primary action | Kind-specific resolve/ack that ends attention (or routes to source-domain confirm). |
| Secondary | Dismiss when allowed; open source object; return to queue. |
| Components | `ReviewCard`, `InboxDecisionPanel`, `StatusAlert`, `Button`, `Dialog`/confirm for dismiss; reuse Money/Savings forms only via existing actions — do not fork. |
| Nav | Success → `/inbox` (preserve Open tab). Source link → Money transaction / savings / plan object when `sourceId` + `source_type` allow. Return preserves Inbox origin. |
| Ownership / permission | Pending mutations: Partner or Admin (membership gate already used). Read historical for members. |
| Financial effect | **NONE** for Inbox state itself. Outcome may be **SOURCE_DOMAIN** when owning module executes (see flows). |

### Together Overview / Members — `/together`

| | |
|---|---|
| Purpose | Household people overview and launcher for invite, policies, preferences. |
| Hierarchy | TopAppBar (household name) → members → invite CTA → invitations/policies/preferences links. |
| Primary action | Invite partner when capacity allows (`HOUSEHOLD_MEMBER_LIMIT`). |
| Secondary | Open invitations, policies, preferences. |
| Components | `TopAppBar`, `SectionHeader`, `MemberList`, `EmptyState`, links via `TOGETHER_PATH`. |
| Nav | Tab Together; children under `TOGETHER_PATH.*`. |
| Ownership / permission | Active member. Role badges: Admin = policy responsibility; Partner = equal daily participation. |
| Financial effect | **NONE**. |

### Invitations — `/together/invitations` (+ accept `/invite/[token]`)

| | |
|---|---|
| Purpose | Create/revoke pending invites; invitee accept/decline. |
| Hierarchy | Send form → created link receipt → pending list with revoke. Accept screen: household + role → accept/decline. |
| Primary | Send invite / Accept invite. |
| Secondary | Copy link, revoke, decline, back to Together. |
| Components | Existing `InvitationsPanel`, invite accept screen, `StatusAlert`, `EmptyState`. |
| Ownership / permission | Invite/revoke: Partner or Admin. Accept/decline: matching invitee only. |
| Financial effect | **NONE**. |

### Policies — `/together/policies`

| | |
|---|---|
| Purpose | View/edit approved household policies; show material recent attribution. |
| Hierarchy | Role context → policy fields → recent events → save (Admin) / read-only (Partner). |
| Primary | Admin save with clear “does not move money” meaning. |
| Secondary | Back to Together. |
| Components | Existing `PoliciesForm` + events list. |
| Ownership / permission | View: Partner/Admin. Edit: Admin only (`canEdit`). |
| Financial effect | **NONE** (policy context only; Planning may consume later). |

### Preferences / account context — `/together/preferences`

| | |
|---|---|
| Purpose | Profile recognition, app preferences, account lifecycle entry. |
| Hierarchy | Profile/role note → preferences → security/lifecycle. |
| Primary | Save preferences where already supported. |
| Secondary | Account lifecycle actions already present. |
| Financial effect | **NONE**. |

### Together Onboard — `/together/onboard`

| | |
|---|---|
| Purpose | Create household when none active (or join via invite path). |
| Primary | Create household / continue invite accept. |
| Financial effect | **NONE**. |

Out of this batch redesign: Health, Money capture/refund/correct screens (except Inbox-origin links), Plan ritual redesign, Settings nesting debates beyond existing `TOGETHER_PATH`.

---

## 3. Main Flows

### Inbox

| Flow | Entry | Action | Permission | Financial effect | Success | Failure |
|---|---|---|---|---|---|---|
| View queue | Tab `/inbox` | `listOpenInboxItems` / archived list; optional staleness worker | Member | **NONE** | List, empty, or error alert | Prior state unchanged |
| Open item | Queue row | Navigate `inboxItemPath` | Member | **NONE** | Detail with typed panel if Pending | Missing → empty + back |
| Resolve jar-mappable item | Detail (`unmapped_expense` / `income_suggest`) | `resolveInboxAction` → `resolveInboxItemToJar` RPC | Partner/Admin; online | **SOURCE_DOMAIN** — updates existing transaction `jar_id` only; **no new income/expense/transfer** | Item Resolved; queue | Invalid/offline/permission; item stays Pending |
| Acknowledge savings maturity | Detail maturity kinds | `acknowledgeSavingsMaturityAction` (Inbox ack + savings settle/renew) | Partner/Admin; online | **SOURCE_DOMAIN** when withdraw/renew; **NONE** for remind/dismiss-only | Attention ends; savings owns money result | Fail closed; no duplicate settle |
| Acknowledge early withdrawal | Detail early-withdraw kind | `acknowledgeEarlyWithdrawalAction` | Partner/Admin; online | **SOURCE_DOMAIN** (savings confirm/cancel path) | Attention ends | Prior states kept |
| Acknowledge EMI / soft kinds | Detail EMI | `acknowledgeInboxAction` celebrate/later | Partner/Admin | **NONE** | Acknowledged | Pending kept |
| Dismiss when allowed | Detail | `dismissInboxAction` with confirm | Partner/Admin | **NONE** | Dismissed; source truth untouched | Required attention cannot dismiss |
| Batch resolve | — | **Not eligible** | — | — | Do not build | — |
| Delegate to partner | — | **Not eligible** (IB-PD-012 deferred). Emergency may already store `assignedToUserId` context only — do not expand into assignment UX | — | — | Do not build | — |
| Return to source domain | Detail | Link by `source_type` + `sourceId` using `APP_PATH` / money helpers | Member | **NONE** | Source detail with return to Inbox | Missing source → stay on detail |
| Recover stale / historical | Archived tab or expired status | Read history; re-open only if application already supports recover; else show status + source link | Member | **NONE** by Inbox | Understand staleness; no silent rewrite | Do not invent reopen money effects |

### Together

| Flow | Entry | Action | Permission | Financial effect | Success | Failure |
|---|---|---|---|---|---|---|
| View household | Tab `/together` | `listHouseholdMembers` | Member | **NONE** | Members + launchers | Empty/onboard redirect |
| Invite member | Invitations | `createInvitationAction` | Partner/Admin; capacity | **NONE** | Pending invite + share link; inviter attributable | Duplicate/full/invalid email |
| Accept / manage membership | `/invite/[token]` or invitations revoke | Accept/decline/revoke existing actions | Invitee / household actor | **NONE** | Member joined or invite terminal | Expired/mismatch/revoked fail-closed |
| Review roles | Members / preferences / policies subtitle | Display `HOUSEHOLD_ROLE` labels only | Member | **NONE** | Admin vs Partner clear; no ownership language | — |
| Approved shared action (policies) | Policies | `update` via existing policies actions | Admin edit; Partner view | **NONE** | Policy saved; events show actor | Forbidden leaves prior policy |
| Change role / ownership | — | **Only if** tenancy already exposes Change Role command. Today: **no UI/API** — do not invent. Never invent Owner/ownership transfer | Admin only when API exists | **NONE** | Partner↔Admin responsibility only | Leave roles unchanged |

---

## 4. Component Reuse

Prefer existing:

- Shell: bottom tabs, `TopAppBar`, offline banners
- `ReviewCard`, `EmptyState`, `StatusAlert`, `SectionHeader`, `Button`, `Text`, form fields
- Together: `MemberList`, `InvitationsPanel`, `PoliciesForm`, `TogetherPreferences`, `AccountLifecycleCard`
- Inbox: `InboxQueueList`, `InboxQueueTabs`, `InboxDecisionPanel`, `InboxOfflineBanner`
- Calibrated patterns from App Shell / Money / Plan: `Page`, `Section`, `BottomActionBar`, `Dialog` when polishing sticky primary actions

Add only when required:

- Origin-aware “View source” control on Inbox detail (link + return), if not expressible with existing Link + `APP_PATH` helpers
- Short decision receipt strip (“Attention resolved · money unchanged” vs “Savings settled via Savings”) using `StatusAlert` until shared FinancialPreview is promoted

Do not create notification-center, activity-feed, batch toolbar, or partner-assignment abstractions. Do not import `archive/legacy-v1`.

---

## 5. Implementation Boundary

### Likely to change (UI / wiring only)

- `app/[locale]/(product)/inbox/page.tsx`
- `app/[locale]/(product)/inbox/[id]/page.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-list.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-tabs.tsx`
- `app/[locale]/(product)/inbox/inbox-decision-panel.tsx`
- `app/[locale]/(product)/inbox/inbox-offline-banner.tsx`
- `app/[locale]/(product)/inbox/actions.ts` (wiring only)
- `app/[locale]/(product)/together/page.tsx`
- `app/[locale]/(product)/together/member-list.tsx`
- `app/[locale]/(product)/together/invitations/**`
- `app/[locale]/(product)/together/invite-actions.ts` (wiring only)
- `app/[locale]/(product)/together/policies/**`
- `app/[locale]/(product)/together/preferences/page.tsx`
- `app/[locale]/(product)/together/account-lifecycle-card.tsx`
- `app/[locale]/(invite)/invite/[token]/**` (accept UX polish only)
- `messages/en/inbox.json`, `messages/vi/inbox.json`
- `messages/en/together.json`, `messages/vi/together.json`

### Tests likely to change

- `tests/e2e/inbox.smoke.spec.ts`
- `tests/e2e/inbox-queue.smoke.spec.ts`
- `tests/e2e/inbox-decisions.smoke.spec.ts`
- `tests/e2e/together-invites.smoke.spec.ts`
- `tests/e2e/together-policies.smoke.spec.ts`
- Focused unit tests under inbox/tenancy already covering list/resolve/invite if present

### Routes that must stay unchanged

- `/inbox`, `/inbox/[id]`
- `/together`, `/together/invitations`, `/together/policies`, `/together/preferences`, `/together/onboard`
- `/invite/[token]`

Use `APP_PATH` / `TOGETHER_PATH` / `inboxItemPath` / `invitePath` only — no magic route strings.

### Business / permission code that must stay untouched

- Inbox money contract: Inbox never creates ledger movements by itself
- `resolve_inbox_item_to_jar` semantics (jar_id update on existing tx only)
- Savings settle/renew/early-withdraw application commands
- Tenancy `HOUSEHOLD_ROLE`, invitation lifecycle, policy update Admin gate, `HOUSEHOLD_MEMBER_LIMIT`
- Product Decision deferred/rejected: batch grouping, partner targeting UX, engagement analytics, Together money movement, custom roles

### Do not modify

- `modules/ledger/**` write semantics
- `modules/plan/**` ritual/allocate semantics (except existing emergency Inbox producers already in place)
- Money capture/refund/correct UI beyond Inbox origin links
- Health, Investments, Cards/Loans product screens
- Auth providers beyond invite accept already wired

---

## 6. Minimal Acceptance Criteria

### Inbox

- Main Open queue renders (list, empty, or load error).
- Item open → resolve/ack happy path works for at least one jar-resolvable kind and one ack kind.
- Batch/delegate: **absent** (correct) — no invented UI.
- Source-domain navigation from detail when source is known; return to Inbox preserves context.

### Together

- Household/member view works with Partner/Admin labels.
- Invite create happy path works (link/receipt).
- Role display correct; no Owner/Viewer language.
- Approved shared action: Admin policy save or Partner read-only policies works; actor attribution on material events remains.
- Actor attribution remains correct for invite create and policy change.

### UI

- 390px and 440px: no critical overflow/unreachable primary action on queue + detail + Together hub.
- VI/EN main copy for changed strings.
- Light/dark main surfaces usable.

### Safety

- No fake money movement from Inbox or Together.
- No duplicate financial write (maturity/early-withdraw only via savings actions once).
- Permissions/roles remain canonical Partner/Admin.
- Source-domain ownership of money/plan facts remains intact.

---

## 7. Minimal Test Plan

1. Typecheck
2. Lint
3. Focused Inbox/Together unit/application tests already in repo (extend only if wiring breaks)
4. Authenticated Playwright main cases:
   - Inbox queue renders
   - Inbox resolve or acknowledge happy path (when fixture item exists)
   - **Skip** batch/delegate (unsupported)
   - Together household/member view
   - Invite send UI happy path
   - One approved shared action: open policies (Admin edit or Partner view)

For flows touching real money (savings maturity withdraw/renew, early withdraw confirm):

- Assert UI calls existing savings application actions only
- Assert no second ledger capture from Inbox
- Prefer “money unchanged” checks for jar-resolve (balance same; jar association updated)

Do not require exhaustive state-matrix testing.
