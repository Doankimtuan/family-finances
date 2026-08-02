# Dependency Analysis — sprint-001

## Story dependency graph

```mermaid
flowchart TD
  E01001[ST-E01-001 shell tokens]
  E01003[ST-E01-003 shared ui]
  E01002[ST-E01-002 chrome layouts]
  E02001[ST-E02-001 splash welcome]
  E02002[ST-E02-002 email login session]
  E02003[ST-E02-003 register forgot]
  E02004[ST-E02-004 Google and Apple Login]
  E02005[ST-E02-005 Account Linking]
  E02006[ST-E02-006 signout delete]
  E01001 --> E01003 --> E01002 --> E02001 --> E02002 --> E02003 --> E02004
  E02004 --> E02005
  E02004 --> E02006
```

**Cycles:** none.

## Capability dependencies

| Capability | Depends on | Story |
|------------|------------|-------|
| Google Login | Email session chrome + confirm adapter | `ST-E02-004` |
| Apple Login | Same as Google; Apple dashboard config | `ST-E02-004` |
| Account Linking | OAuth providers live; BR-02b policy | `ST-E02-005` |
| Sign-out / delete | OAuth or email session established | `ST-E02-006` |

## Intra-story interface freezes

| Before | After |
|--------|-------|
| Email login + confirm working | OAuth buttons + PKCE |
| Google + Apple Login working | Account Linking conflict UX |
| OAuth session working | Sign-out / delete |

## External dependencies

| Dependency | Status |
|------------|--------|
| Product / blueprints / tech Auth Strategy v2 | Adopted (CURRENT SoTs) |
| Design System / Pattern v1 | Ready |
| B-ENV-03 Google | Execution STOP until configured |
| B-ENV-04 Apple | Execution STOP until configured |
| B-ENV-05 Linking policy | Execution STOP until set for `ST-E02-005` |
