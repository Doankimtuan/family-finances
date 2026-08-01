---
flow_id: flow.offline-mutation
title: Offline mutation blocked
screens: ["money.transaction-add", "system.offline"]
run_id: run_screen_blueprints_20260801T200000Z
---

# Offline mutation blocked

## Screens

`money.transaction-add`, `system.offline`

## Flows

Normal: detect offline→block submit→system.offline/Alert. Alt: read-only browse. Fail: N/A. Recover: retry online. Cancel: discard.

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
