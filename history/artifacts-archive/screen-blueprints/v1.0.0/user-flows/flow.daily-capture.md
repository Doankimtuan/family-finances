---
flow_id: flow.daily-capture
title: Daily capture Suggest/Inbox
screens: ["home.index", "money.transaction-add", "inbox.queue"]
run_id: run_screen_blueprints_20260801T200000Z
---

# Daily capture Suggest/Inbox

## Screens

`home.index`, `money.transaction-add`, `inbox.queue`

## Flows

Normal: Home→Add→Suggest place→done. Alt: unmapped→Inbox ReviewItem. Fail: API error. Recover: retry online. Cancel: discard form.

### Normal flow
See summary above (first sentence).

### Alternative flow
See Alt clause.

### Failure flow
See Fail clause.

### Recovery flow
See Recover clause.

### Cancellation flow
See Cancel clause.
