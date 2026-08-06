# Executive Summary

Savings operates as a real-money product lifecycle wrapped in household decision control.

The business system has three layers:

1. Product contract layer: provider, product type, principal, term, rate, maturity date, settlement destination, interest rules, early-withdrawal rules, renewal preference, and immutable cycle history.
2. Real Ledger layer: only confirmed funding, interest posting, settlement, renewal payout, withdrawal, reversal, correction, or provider-confirmed actuals write to Ledger.
3. Household decision layer: maturity, renewal, early withdrawal, failed settlement, and material exceptions route through Inbox/Together before money movement where a human decision is required.

The canonical lifecycle is:

Draft -> Pending Funding -> Active -> Grace Period -> Awaiting Renewal -> Renewed or Completed -> Archived.

Exception lifecycle:

Draft -> Cancelled -> Archived.

Active -> Closed Early -> Archived.

Any unrecoverable funding/settlement/provider error enters deterministic review, not silent mutation.

Paused is not an operational Savings state because Phase 3 rejected automatic recurring saving transfer inside Savings and assigned saving intention to Planning. A household may pause planned saving in Planning, but an already funded savings product remains Active, Grace Period, Awaiting Renewal, Completed, Closed Early, Cancelled, or Archived.

Partial withdrawal is not an MVP/v1 core behavior. It is deferred. Until explicitly approved in a later product decision, the deterministic rule is: user-requested early withdrawal is full withdrawal; provider-confirmed partial settlement is handled as an exception review that records actual provider outcome and leaves remaining principal only if the provider has already confirmed it.

