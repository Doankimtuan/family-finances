# Master Implementation Risk Register — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Risk Evaluation & Mitigation Matrix

| Risk ID | Category | Risk Description | Severity | Impact Area | Mitigation Strategy | Owner |
|---|---|---|---|---|---|---|
| **RSK-IMP-01** | Technical | Migration script fails to map unmapped historical categories to a default Jar. | **HIGH** | Database / BR-12 | Run pre-migration validation dry run in staging; populate default "General Household Jar" before enforcing BR-12 FK. | Lead DB Architect |
| **RSK-IMP-02** | Schedule | Temporal background workers (30-day auto lock, staleness archiving) experience cron drift. | **MEDIUM** | Background Workers | Implement idempotent worker executions with explicit timestamp logging and fallback execution triggers. | Backend Lead |
| **RSK-IMP-03** | Architecture | Health module developers accidentally import write-capable DB context. | **HIGH** | BR-24 (`Health-RO`) | Enforce `HealthReadOnlyDbContext` at compiler level and run automated CI Constitutional test rejecting write queries. | Architecture Board |
| **RSK-IMP-04** | UX | Emergency declaration feature abused for non-emergency overspends to bypass warnings. | **LOW** | User Experience | Surface all emergency declarations prominently during Month Ritual Step 3 for mandatory partner review (BR-13). | Product Owner |
