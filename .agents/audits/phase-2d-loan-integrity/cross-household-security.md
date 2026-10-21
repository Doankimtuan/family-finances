# Phase 2D — Cross-household security

**Status: PASS — same-household sharing allowed; foreign-household access denied**

Two temporary households and three disposable authenticated identities were created with run-scoped names. Account A was an admin in Household A; Account B was a partner in Household A; Account C was an admin in Household B. All reads and public loan operations used the users’ authenticated clients. Privileged access was used only for setup, scoped cleanup, and read-only catalog/count verification.

| Check                                                                   | Result                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------- |
| Household A admin reads its loan and schedule                           | Allowed                                                  |
| Household B admin reads its own loan and schedule                       | Allowed                                                  |
| Household A admin reads Household B loan                                | No rows returned                                         |
| Household B admin reads Household A loan or schedule                    | No rows returned                                         |
| Household A partner reads the shared Household A loan and schedule      | Allowed                                                  |
| Household A partner reads Household B loan                              | No rows returned                                         |
| Partner creates a valid loan through the authenticated public RPC       | Allowed; schedule persisted                              |
| Household B admin attempts to update Household A loan                   | Zero rows affected; original loan unchanged              |
| Authenticated direct table insert into Household A by Household B admin | Denied with `P0001 not_allowed`; no marker row persisted |
| Authenticated direct call to the internal schedule helper               | Denied with `42501`                                      |

Cleanup removed all run-scoped loans, schedules, memberships, households, and three temporary auth identities. The final read-only inventory returned to baseline: 1 household, 2 household members, 0 loans, and 0 schedule entries. No permanent account was created or altered.
