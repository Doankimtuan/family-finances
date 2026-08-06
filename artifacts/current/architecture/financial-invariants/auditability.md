# Auditability

Every financial event must answer:

- Who initiated or authorized it?
- When did it happen in the real world?
- When was it recorded?
- Why was it recorded or changed?
- What was the origin command, event, provider evidence, user action, or worker rule?
- Which household owns it?
- Which account, transaction, product, jar, goal, review item, or policy objects are related?
- What previous state did it supersede or interpret?
- What current state resulted?

## Audit Invariants

1. Audit records must survive correction, reversal, refund, archive, closure, membership changes, and future migration.
2. Read-only consumers must preserve source labels and cannot claim ownership of facts.
3. Automated actions must record worker identity, schedule anchor, selection predicate, idempotency key, and run id.
4. User actions must record actor identity, household authority, reason, and command id.
5. External evidence must preserve source type, source date, import/manual status, and confidence/provider-confirmation label where applicable.

## Minimum Financial Event Envelope

- `event_id`
- `event_type`
- `household_id`
- `source_domain`
- `source_aggregate_id`
- `actor_type`
- `actor_id`
- `occurred_at`
- `recorded_at`
- `reason`
- `origin_command_id`
- `idempotency_key`
- `related_object_ids`
- `previous_state_ref`
- `current_state_ref`

