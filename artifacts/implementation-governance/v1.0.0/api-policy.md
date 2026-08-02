---
document: API Policy
implementation_governance: v1.0.0
status: OFFICIAL_IMPLEMENTATION_GOVERNANCE
run_id: run_implementation_governance_20260802T021300Z
created_at: 2026-08-02T02:14:36Z
board: Implementation Governance Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
engineering_patterns_sot: artifacts/engineering-review/CURRENT
localization_sot: artifacts/localization/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
---

# API Policy

Every API route / Server Action that reads or mutates domain data must include:

1. Request DTO
2. Response DTO
3. Zod validation
4. Authorization
5. Error mapping
6. Audit logging for sensitive operations

Additional rules:

- Never expose database entities / raw rows
- Idempotency-Key on money mutations per Tech Spec
- No UI→Supabase; infrastructure/repository only
- Stable error envelopes for clients
