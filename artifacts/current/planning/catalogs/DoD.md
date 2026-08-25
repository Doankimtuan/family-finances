---
document: Definition of Done
implementation_plan: v1.0.0
run_id: run_implementation_plan_20260801T210000Z
---

# Definition of Done

## 1. Story DoD

- [ ] Implements referenced Screen Blueprint(s) sections (hierarchy, actions, states)
- [ ] Uses Design System components only (HeroUI via `shared/ui`)
- [ ] AppViewport 440px; no sidebar; mobile-native
- [ ] Listed AC checked and evidenced
- [ ] BR-01 labeling respected where money/plan shown
- [ ] Online mutation guard when story touches ledger/plan writes (BR-15)
- [ ] A11y for capture/Inbox/ritual paths when in scope (REQ-019)
- [ ] No import from retired legacy code
- [ ] Tests for money-moving / ritual-lock commands when applicable

## 2. Sprint DoD

- [ ] Demo script in sprint file completed
- [ ] No open P0 defects for committed stories
- [ ] Acceptance mapping still 100% for delivered ACs
- [ ] Design Review Checklist for new UI

## 3. MVP Release DoD

- [ ] Product MVP features shipped: Auth, Together, Onboard, Home, Money, Plan, Inbox, Health basic
- [ ] Must-not-ship excluded: Approvals depth, AI assist, Wealth, Offline-read, Multi-household
- [ ] Success bar: time-to-clarity path, dual engagement possible, Inbox usable, Ritual completable, real≠virtual intact
- [ ] Playwright: Onboard ≤3, Capture, Inbox resolve, Month Ritual, real≠virtual on Home/Plan, offline mutate blocked
- [ ] No Categories / Decision Tools primary nav
