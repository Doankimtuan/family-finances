# Workflow & tooling taste

- Prefers plan-driven execution: implement exactly as the plan specifies, never edit the plan file itself, and work through the pre-created to-dos (marking them in_progress) until all are complete. Confidence: 0.9
- Prefers strict phased, contract-based domain workflows: Discovery → Household Reality Validation → Product Decision → Business Blueprint → Implementation Contract, each writing only to artifacts/<phase>/<domain>/CURRENT/ and never modifying frozen sources of truth or redesigning earlier decisions mid-phase. Confidence: 0.9
- Reuse existing shared components and architecture; avoid unnecessary rewrites, speculative components, and temporary hacks. Confidence: 0.85
- Keep a single source of truth: one authoritative copy, immutable history, and an explicit change policy for anything that must evolve. Confidence: 0.75
- Financial correctness outranks UI convenience; expects calculations to be verified against the real formulas — the user cross-checks outputs with detailed step-by-step math and reports mismatches. Confidence: 0.85
- Runs database migrations/SQL through the Supabase MCP tools rather than executing manually. Confidence: 0.7
- Expects complete, explicit deliverables and will call out missing items (e.g., a missing domain), asking whether it was omitted or the input lacked information. Confidence: 0.6
- Adds third-party MCP servers for tooling within Command Code (e.g., Playwright for browser automation via `cmd mcp add`), invoked ephemerally with `npx -y @latest` rather than pinned versions or global installs. Confidence: 0.8
