# Workflow & tooling taste

- Prefers plan-driven execution: implement exactly as the plan specifies, never edit the plan file itself, and work through the pre-created to-dos (marking them in_progress) until all are complete. Confidence: 0.9
- Prefers strict phased, contract-based domain workflows: Discovery → Household Reality Validation → Product Decision → Business Blueprint → Implementation Contract, each writing only to artifacts/<phase>/<domain>/CURRENT/ and never modifying frozen sources of truth or redesigning earlier decisions mid-phase. Confidence: 0.9
- Reuse existing shared components and architecture; avoid unnecessary rewrites, speculative components, and temporary hacks. Confidence: 0.85
- Keep a single source of truth: one authoritative copy, immutable history, and an explicit change policy for anything that must evolve. Confidence: 0.75
- Financial correctness outranks UI convenience; expects calculations to be verified against the real formulas — the user cross-checks outputs with detailed step-by-step math and reports mismatches. Confidence: 0.85
- Runs database migrations/SQL through the Supabase MCP tools rather than executing manually. Confidence: 0.7
- Expects complete, explicit deliverables and will call out missing items (e.g., a missing domain), asking whether it was omitted or the input lacked information. Confidence: 0.6
- Adds third-party MCP servers for tooling within Command Code (e.g., Playwright for browser automation via `cmd mcp add`), invoked ephemerally with `npx -y @latest` rather than pinned versions or global installs. Confidence: 0.8
- Prefers conservative, problem-driven scoping: prefer removing or simplifying a feature over adding complexity, avoid speculative and social-network features (chat, reactions, likes, gamification) unless strongly justified, and require every recommendation to answer what concrete financial problem it solves for the household rather than copying competitor features. Confidence: 0.85
- Prefers read-only discovery/audit phases before any implementation, with findings bucketed into NOW/NEXT/LATER and a phased roadmap, then bounded implementation prompts ordered domain/schema → security → application/service → UI → test → migration validation. Confidence: 0.8
- Prefers strongly typed models (as-const unions / discriminated unions) over scattered raw string checks; unknown or unsupported values must fail loudly in dev/tests rather than silently falling back or returning null for a legitimate persisted kind. Confidence: 0.8
- Does not preserve dead or legacy code merely because a migration or constraint still references it; removes dead kinds rather than building backwards compatibility for unused development data (dev data loss acceptable when justified). Confidence: 0.75
- Enforces domain contracts with tests — exhaustive kind/type mapping, allowed outcomes, valid and invalid lifecycle transitions, and exclusion of legacy/removed kinds — not just happy paths. Confidence: 0.8
