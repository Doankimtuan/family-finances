# App Shell And Home Screen Blueprint

Status: canonical CommandCode implementation handoff package.

Verdict: `COMMANDCODE_HANDOFF_READY_WITH_CONDITIONS`.

## Package Contents

- [app-shell-home-blueprint.md](./app-shell-home-blueprint.md): preserved approved Phase E1 blueprint.
- [implementation-boundary.md](./implementation-boundary.md): precise source, route, test, and no-touch boundaries.
- [acceptance-criteria.md](./acceptance-criteria.md): deterministic implementation acceptance criteria extracted from the approved blueprint.
- [commandcode-handoff.md](./commandcode-handoff.md): self-contained Phase F1 execution handoff for CommandCode.
- [final-verdict.md](./final-verdict.md): packaging verdict and remaining conditions.

## Authority

This package is the canonical implementation source for App Shell, Home, and Home-owned lightweight interactions. The original design-calibration copy may remain for traceability, but implementation agents should use this package.

Do not redesign the blueprint during Phase F1. Implement the approved structure, preserve the five-tab IA, and report any state that cannot be safely produced in browser verification.
