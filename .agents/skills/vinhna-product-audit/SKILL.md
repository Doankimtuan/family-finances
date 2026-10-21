---
name: vinhna-product-audit
description: Audit ViNha usability, UI/UX, feature gaps, redundancy, complexity, issue severity, and roadmap priorities using observed user impact. Use for product evaluation, not implementing fixes or independently calculating finances.
---

# ViNha product audit

Apply [audit operating rules](../../audits/OPERATING.md). Reuse existing journey
and financial evidence; load those skills only for additional verification.

1. Scope one screen or coherent flow. Read its relevant contracts in
   `artifacts/information-architecture/CURRENT/`, `artifacts/ux-redesign/CURRENT/`,
   and `artifacts/design-system-evolution/CURRENT/`. For UI evaluation load
   `ui-ux-pro-max` and run its targeted search CLI; canonical ViNha contracts win.
2. Observe task completion, navigation/discoverability, terminology, redundant
   steps, missing capabilities, empty/error/loading states, and perceived
   responsiveness. Record a concrete user consequence before proposing a fix.
3. Check relevant behavior at 390/440/768/1280px, light/dark, English/Vietnamese,
   keyboard focus, overlays, and reduced motion. The centered 440px shell on
   desktop is intentional. Record untested combinations as coverage gaps.
4. Separate CONFIRMED BUG (reproduced contract violation), PRODUCT OPINION
   (observed friction or proposed capability), POLICY AMBIGUITY, and BLOCKED.
   Missing functionality is not automatically a bug. For perceived delays,
   measure the affected interaction before claiming a performance cause.
5. Rank findings with the scale below. Document affected users, frequency,
   workaround, confidence, and estimated effort (small/medium/large with reason).
   Prioritize severity, then reach/frequency, then effort; financial correctness
   takes precedence over visual polish. Keep opinions in a separate roadmap list.

| Priority | User impact                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| P0       | Observed credential/data exposure, irreversible loss, or widespread financial corruption; stop affected testing. |
| P1       | Core task blocked or persisted financial values wrong, with no safe practical workaround.                        |
| P2       | Material friction or limited incorrect behavior with a safe workaround.                                          |
| P3       | Minor visual/content issue or low-impact usability friction.                                                     |

Each finding needs ID, classification, priority/rationale, environment, minimal
reproduction, expected/actual, user impact, evidence link, and suggested next step.
Never include credentials or tokens. Link duplicate findings by ID.

Complete when the scoped flow has recorded coverage, every confirmed bug has
browser evidence, opinions are separate, and a concise report plus prioritized
next actions is linked from the manifest. Avoid generic recommendations without
observed evidence; label effort estimates and remaining uncertainty explicitly.
