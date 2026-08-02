---
flow_id: flow.auth-onboard-home
title: Auth → Onboard → Home
screens: ["auth.splash", "auth.login", "onboard.wizard", "home.index"]
run_id: run_sot_auth_v2_adoption_20260802T014716Z
---

# Auth → Onboard → Home

## Screens

`auth.splash`, `auth.login`, `onboard.wizard`, `home.index`

## Flows

Normal: splash→login (OAuth-first or email)→session→onboard≤3→home. Alt: register→confirm; login→OAuth→`/auth/confirm` exchange→home/onboard. Fail: auth error Alert. Recover: retry. Cancel: leave register to welcome. Guest: forbidden.

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
