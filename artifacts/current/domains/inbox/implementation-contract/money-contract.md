# Money Contract

## Money Behavior By Action

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
| --- | --- | --- | --- | --- | --- | --- |
| Create Review Item | None | None | None | None | Inbox active count may change | Invalid source, generic notification, duplicate active item |
| Review Item | None | None | None | None | Read-only view only | No permission or item not visible |
| Resolve Item | None in Inbox | None in Inbox | None by Inbox | None by Inbox unless owning domain separately accepts outcome | Decision history | Invalid state, invalid outcome, owning-domain rejection |
| Acknowledge Item | None | None | None | None | Decision history | Acknowledgement would hide required decision |
| Dismiss Item | None | None | None | None | Decision history | Required attention cannot be dismissed |
| Defer Item | None | None | None | None | State/workload context | Deferral not allowed |
| Return Deferred To Pending | None | None | None | None | State/workload context | Still deferred or invalid state |
| Expire Time-Bound Item | None | None | None | None | Historical/staleness context | No expiration basis |
| Archive Completed Item | None | None | None | None | Historical context | Item still active |
| Suggest Resolution | None | None | None | None | Read-only suggestion | Not explainable or insufficient pattern |
| Auto-Resolve Pattern | None | None | None | None by Inbox | Decision history | Ambiguous, high-risk, or money-moving outcome |
| Recover Item | None | None | None | None by Inbox | State/history context | Recovery reason invalid |

## BR-01 Contract

- Inbox never creates, edits, reverses, or deletes real ledger money movement.
- Inbox never creates virtual planning allocation by itself.
- Inbox may route an outcome to an owning domain; that domain decides and records its own business truth.
- If an Inbox action appears to require money movement, the action must fail or be delegated to the money-owning domain's contract.

## No Ambiguous Money Movement

- Acknowledgement never means paid.
- Expiration never means paid, cancelled, or resolved.
- Dismissal never means source event was deleted.
- Auto-resolution never means money was moved.
- Resolution means Inbox attention ended; any financial effect must be owned elsewhere.
