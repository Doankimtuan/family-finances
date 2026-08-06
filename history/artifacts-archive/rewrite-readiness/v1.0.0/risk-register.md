# Risk Register

| ID | Severity | Title | Blocking | Owner |
|----|----------|-------|----------|-------|
| R01 | High | shared/ui not scaffolded; HeroUI not installed | N | Frontend Lead |
| R02 | Medium | Architecture Folder-Structure still cites components/ | N | Chief Architect |
| R03 | Medium | Strangler DB migrations live at /supabase while domain code empty | N | Database Architect |
| R04 | Medium | Observability stack named but not wired | N | Platform |
| R05 | Low | Design Foundation v1.0.0 historical side-nav language | N | Design System Architect |
| R06 | Low | Performance budgets not numeric in SoT | N | Performance Engineer |
| R07 | High | Idempotency and offline fail-closed must be enforced in code | N | Backend Lead |
| R08 | Medium | i18n en/vi catalogs not yet present | N | Frontend Lead |

## R01: shared/ui not scaffolded; HeroUI not installed

- **Severity:** High
- **Blocking:** No
- **Description:** Rewrite workspace has modules/ skeleton and package.json rewrite stub but no @heroui/react and no shared/ui implementation yet.
- **Impact:** Sprint 1 blocked until bootstrap installs deps and scaffolds shared patterns.
- **Likelihood:** Certain until S1 starts
- **Mitigation:** Mandatory S1 day-0: npm install HeroUI stack; scaffold shared/{ui,patterns,hooks,lib,utils}; map tokens.
- **Recommendation:** Do not start feature UI before AppViewport + HeroUI theme green.
- **Owner:** Frontend Lead


## R02: Architecture Folder-Structure still cites components/

- **Severity:** Medium
- **Blocking:** No
- **Description:** Architecture Definition Folder-Structure.md lists components/; Design Foundation v1.1.0 mandates shared/ui with components/ as legacy alias.
- **Impact:** Developer confusion / wrong import paths.
- **Likelihood:** Medium
- **Mitigation:** Implementation Plan and Design Foundation already document alias; S1 handbook: prefer shared/. Do not edit Architecture SoT in this board.
- **Recommendation:** Treat Architecture path as historical alias; CODEOWNERS/lint later.
- **Owner:** Chief Architect


## R03: Strangler DB migrations live at /supabase while domain code empty

- **Severity:** Medium
- **Blocking:** No
- **Description:** Live supabase retained; rewrite modules empty. Risk of drifting from legacy schema assumptions.
- **Impact:** API/DB mismatches during Money/Plan sprints.
- **Likelihood:** Medium
- **Mitigation:** Tech Spec + strangler: validate against existing migrations before new DDL; prefer additive migrations.
- **Recommendation:** S3 kickoff: schema review vs ledger/plan commands.
- **Owner:** Database Architect


## R04: Observability stack named but not wired

- **Severity:** Medium
- **Blocking:** No
- **Description:** Architecture locks Sentry/OTel-style monitoring; not present in rewrite workspace.
- **Impact:** Weak incident response early sprints.
- **Likelihood:** High if deferred past S6
- **Mitigation:** Add minimal request_id logging in S1 shell; Sentry before MVP release DoD.
- **Recommendation:** Track in MVP Release DoD.
- **Owner:** Platform


## R05: Design Foundation v1.0.0 historical side-nav language

- **Severity:** Low
- **Blocking:** No
- **Description:** Superseded by v1.1.0; CURRENT is correct; historical pack could confuse.
- **Impact:** Wrong desktop chrome if someone reads v1.0.0.
- **Likelihood:** Low
- **Mitigation:** SUPERSEDED_BY marker exists; readiness docs restate 440px no sidebar.
- **Recommendation:** Developers use CURRENT only.
- **Owner:** Design System Architect


## R06: Performance budgets not numeric in SoT

- **Severity:** Low
- **Blocking:** No
- **Description:** Performance principles exist; LCP/INP numeric gates soft.
- **Impact:** Ambiguous perf DoD.
- **Likelihood:** Medium
- **Mitigation:** Adopt Foundation CWV targets as release gate (LCP<2.5s, INP<200ms, CLS<0.1) in QA.
- **Recommendation:** Add to MVP Release DoD checklist in delivery (no SoT edit required).
- **Owner:** Performance Engineer


## R07: Idempotency and offline fail-closed must be enforced in code

- **Severity:** High
- **Blocking:** No
- **Description:** Specs clear (BR-15, REQ-018); not yet implemented.
- **Impact:** Duplicate captures / silent offline queues if engineers improvise.
- **Likelihood:** Medium without tests
- **Mitigation:** Playwright AC-018 in S3; Idempotency-Key on mutate routes per Tech Spec.
- **Recommendation:** Hard fail any PR that adds offline write cache.
- **Owner:** Backend Lead


## R08: i18n en/vi catalogs not yet present

- **Severity:** Medium
- **Blocking:** No
- **Description:** Product requires en/vi; workspace lacks locale catalogs.
- **Impact:** Hard-coded strings debt.
- **Likelihood:** High if deferred
- **Mitigation:** Introduce i18n scaffold in S1/S2 with en keys; vi fill progressive.
- **Recommendation:** No user-facing string without i18n key after S2.
- **Owner:** Frontend Lead
