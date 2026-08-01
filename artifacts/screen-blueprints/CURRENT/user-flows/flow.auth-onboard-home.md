---
flow_id: flow.auth-onboard-home
title: Auth → Onboard → Home
screens: ["auth.splash", "auth.login", "onboard.wizard", "home.index"]
run_id: run_screen_blueprints_20260801T200000Z
---

# Auth → Onboard → Home

## Screens

`auth.splash`, `auth.login`, `onboard.wizard`, `home.index`

## Flows

Normal: splash→login→session→onboard≤3→home. Alt: register→confirm. Fail: auth error Alert. Recover: retry. Cancel: leave register to welcome.

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
