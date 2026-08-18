# Family Finance — Ownership Test Harness 14D-T

Date: 2026-08-18

## Result

The harness is READY in the configured environment.

- Required public URL/key: present.
- Dedicated A/B credentials: present.
- Modern `SUPABASE_SECRET_KEY`: present and preferred over the legacy key.
- `setup`: PASS.
- `preflight`: PASS — `OWNERSHIP TEST HARNESS READY`.
- `cleanup`: PASS on an empty controlled household and after the live fixture runs.

## Preflight evidence

The latest preflight authenticated both dedicated identities and verified:

- A and B are active members of the same controlled household.
- A membership role is `admin`.
- B membership role is `partner`.
- The controlled cash fixture exists.

The runtime output contained only test IDs and membership metadata; no secret
values were printed or written to this report.

## Safety

Setup creates missing Auth users with `email_confirm = true`, refuses to move
users with active memberships outside the controlled household, and refuses a
controlled household containing a non-dedicated member. Cleanup removes only
the exact named controlled household after the same dedicated-member check;
dedicated Auth users remain persistent. Existing developer memberships and
passwords were not changed.

## Harness fixes in 14D-T.1

- `SUPABASE_SECRET_KEY` is now preferred, with
  `SUPABASE_SERVICE_ROLE_KEY` as fallback.
- Cleanup explicitly removes non-cascading controlled fixture children before
  deleting the household.
- The investment fixture uses columns present in the deployed investment
  schema.

## Final state

The controlled household was cleaned after live validation. Therefore the
household is READY during a setup/preflight run and intentionally absent after
cleanup. Dedicated A/B Auth identities remain available for the next isolated
run.
