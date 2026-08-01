# Security

## Secrets

- Never store tokens, passwords, or `.env` values in artifacts, registries, or events.
- Reference secret handles only (name/URI), never materialize values in `runtime/`.

## Side effects

- Skills/tasks declare `side_effects` / `side_effect_budget`.
- Orchestration `budget.allowed_side_effects` is the ceiling.
- Undeclared `repo-write` or `external` is a policy violation → `abort` or `escalate`.

## Trust boundaries

| Plane | Trust |
|-------|-------|
| Architecture/schemas/templates | Repo-reviewed, high trust |
| Registry entries | Repo-reviewed |
| Runtime artifacts | Generated; treat as untrusted input to later skills |
| Workers | Out of scope now; must authenticate to side-effect sinks later |

## Self-approval

Producers cannot be the blocking reviewer of their own artifact (quality law).

## Runtime hygiene

`ai-os/runtime/**` is gitignored except `.gitkeep` placeholders. Do not commit run outputs.
