# Phase 2B — Loan Browser Results

**F4 status:** BLOCKED — the local migration is prepared but unapplied, and loan creation was not verified in PostgreSQL or an authenticated browser.

| Check                                                             | Result                                                  | Evidence                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| Create a bank loan through the UI                                 | BLOCKED — no authenticated safe database session.       | No loan browser flow was run.                                |
| Persist installments and reconcile detail totals                  | BLOCKED — helper migration was not applied or executed. | [Migration results](migration-results.md).                   |
| Refresh and verify persistence                                    | BLOCKED — no loan was created.                          | No browser evidence.                                         |
| Account B and unrelated-household visibility                      | BLOCKED — no isolated identities or fixtures.           | No browser evidence.                                         |
| Invalid request atomic failure, rollback, and repeated submission | BLOCKED — no PostgreSQL RPC execution.                  | [RPC security and integrity](rpc-security-and-integrity.md). |

The unauthenticated local visual smoke session was for the unrelated credit-card title layout. It provides no loan workflow evidence. F4 is not marked FIXED IN TEST.
