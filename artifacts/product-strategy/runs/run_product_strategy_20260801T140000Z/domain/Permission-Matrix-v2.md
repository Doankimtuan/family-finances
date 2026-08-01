---
generated_by: Product Strategy Board
run_id: run_product_strategy_20260801T140000Z
status: PRODUCT_V2_CANDIDATE
source_of_truth: NOT_ADOPTED
v1_unchanged: true
created_at: 2026-08-01T13:59:30Z
---

# Permission Matrix v2

| Action | Partner | Admin | Notes |
|--------|:------:|:-----:|-------|
| View Home/Money/Plan/Inbox/Health | ✓ | ✓ | Equal daily experience |
| Capture transactions | ✓ | ✓ | |
| Resolve Inbox items | ✓ | ✓ | |
| Edit jars/goals/recurring | ✓ | ✓ | |
| Run Month Ritual | ✓ | ✓ | Assisted encourages both |
| Invite/revoke members | ✓* | ✓ | *configurable; default both can invite |
| Edit overspend/automation policies | ✓ | ✓ | Audit required |
| Edit advanced assumptions (inflation etc.) | view | ✓ | Partner-visible audit; softens V1 sole-admin opacity |
| Service/aggregates | — | system | Unchanged security posture |

Membership + RLS remain mandatory (`perm-*` knowledge preserved).
