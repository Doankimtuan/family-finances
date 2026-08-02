---
flow_id: flow.inbox-resolve
title: Inbox resolve ReviewItem
screens: ["inbox.queue", "inbox.review-detail"]
run_id: run_screen_blueprints_20260801T200000Z
---

# Inbox resolve ReviewItem

## Screens

`inbox.queue`, `inbox.review-detail`

## Flows

Normal: open card→resolve Active jar. Alt: dismiss/ack maturity. Fail: offline block. Recover: reconnect. Cancel: back to queue.

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
