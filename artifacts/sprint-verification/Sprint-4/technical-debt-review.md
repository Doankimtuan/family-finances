# Technical Debt Review — Sprint 4

## Pack-declared debt (validated)

| ID | Item | Board severity |
|----|------|----------------|
| TD-S4-01 | Wire cron / Edge for autolock | **Raise to High** — Spec AC, not optional polish |
| TD-S4-02 | Divergence → category mapping CTA | Low (agree) |
| TD-S4-03 | Richer autolock `preview_json` | Low (agree) |

## Pack-declared known issues

| ID | Board |
|----|-------|
| KI-S4-01 no pg_cron | **Blocking** under AC-RIT-01 (pack rated Low — understated) |
| KI-S4-02 no deep-link | Non-blocking |
| KI-S4-03 no dual-approve QC | Non-blocking for Alpha if Assisted same; Spec lifecycle prefers partner |

## Additional debt discovered

| ID | Item | Priority |
|----|------|----------|
| TD-V4-01 | Past-period lock hollow (`assertPlanPeriodUnlocked` current-only; unused `is_month_ritual_locked`) | **Critical** |
| TD-V4-02 | Autolock skips past months without run & without unmapped | High |
| TD-V4-03 | `isRitualAutolockDue` unused by worker (TS/SQL drift) | Medium |
| TD-V4-04 | Fail-open + empty-catch gates | High |
| TD-V4-05 | Correction does not reset Quick Close streak | Medium |
| TD-V4-06 | Cross-BC inbox/ledger mutation inside plan RPC | Medium (carry) |
| TD-V4-07 | Helper-only tests sold as AC evidence | High |
| TD-V4-08 | Emergency reflection not a hard gate | High (REQ-RIT-02) |

## Debt score

**7.5 / 10** (higher = more debt) — significant architecture/product debt relative to claimed COMPLETE.

## Maintainability score (inverse of erosion)

**5.5 / 10**
