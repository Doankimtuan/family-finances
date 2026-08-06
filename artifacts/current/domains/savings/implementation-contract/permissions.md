# Permissions Contract

## Actors

Owner: full household money authority.

Partner: household member with money authority as allowed by Together policy.

Viewer: read-only household member.

Admin: support/operations role for audited correction only.

System Worker: deterministic scheduler/detector; cannot make household decisions.

Background Worker: async processor; cannot make household decisions.

## Action Permissions

| Action | Owner | Partner | Viewer | Admin | System Worker | Background Worker |
|---|---:|---:|---:|---:|---:|---:|
| Create Saving | Yes | Yes if money policy allows | No | No | No | No |
| Initiate Funding | Yes | Yes if money policy allows | No | No | No | No |
| Confirm Funding | Yes | Yes if money policy allows | No | Admin only for audited correction | No | No |
| Cancel Draft/Pending | Yes | Yes if money policy allows | No | Admin only for audited correction | No | No |
| Edit Renewal Policy | Yes | Yes if money policy allows | No | No | No | No |
| Mature Saving Detection | No | No | No | No | Yes | Yes |
| Create Maturity Inbox Item | No | No | No | No | Yes | Yes |
| Renew | Yes | Yes if money policy allows | No | No | No | No |
| Switch Package | Yes | Yes if money policy allows | No | No | No | No |
| Withdraw All | Yes | Yes if money policy allows | No | No | No | No |
| Preview Early Withdrawal | Yes | Yes if money policy allows | No | No | No | No |
| Confirm Early Withdrawal | Yes | Yes if money policy allows | No | No | No | No |
| Archive | Yes | Yes if money policy allows | No | Admin only for audited correction | No | No |
| Correct Settlement | No direct user mutation without Ledger correction flow | No direct user mutation without Ledger correction flow | No | Yes, audited | No | No |
| Read Savings | Yes | Yes | Yes if household policy allows | Yes, audited | Yes for processing | Yes for processing |

## Worker Limits

- Workers may detect maturity, create reminders, mark stale previews, and create review items.
- Workers may not renew, withdraw, settle, or move money without required decision and confirmed actuals.
- Workers may not act on Health output.

