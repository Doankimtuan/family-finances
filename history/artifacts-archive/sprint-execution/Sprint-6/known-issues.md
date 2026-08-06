# Known Issues — Sprint 6

| ID | Issue | Severity | Notes |
|----|-------|----------|-------|
| KI-S6-01 | No dedicated Postgres Health-RO role | Low | Spec task mentioned RO DB user; app-level shield + no Health writes covers AC-HLT-01 |
| KI-S6-02 | Playwright / a11y / bundle not in CI | Medium | ST-E06-003 plan listed them; unit+constitution+lint+typecheck are the shipped GA gates |
| KI-S6-03 | AI suggestion UI confirmation cards not built | Low | Guards + audit ready; no LLM assist surface in rewrite yet |
| KI-S6-04 | Spec-track vs rewrite `ST-E06-*` ID collision | Info | Documented; Spec track is Health-RO/GA |
