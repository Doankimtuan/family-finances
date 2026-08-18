# Taste

- Flags fundamental product assumptions that require human input as "PRODUCT DECISION REQUIRED" and refuses to silently decide them. Confidence: 0.85
- Recommendations and reports must be specific and evidence-backed — tied to existing implementation + real user behavior + a concrete user problem — never generic. Confidence: 0.8
- Values correctness-critical, integration-hardening review passes: audits dedupe/idempotency semantics, terminal-state reopen policy, authorization, and atomicity per producer — and fixes real bugs (e.g., cycle-scoped dedupe, terminal reopen guards) rather than only documenting them. Confidence: 0.7
- Flags ambiguous product behavior (e.g., a "later" action that is actually just "acknowledged", or a solo-household audit item that may be an implementation carry-over) as product decisions rather than silently redefining semantics. Confidence: 0.7
