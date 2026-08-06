# ST-E08-001 — Known Limitations

1. **Maintenance flag is env-only** — `NEXT_PUBLIC_MAINTENANCE_MODE` / `MAINTENANCE_MODE`; no remote feature-flag service yet.
2. **Offline escalate is informational** — banners still disable mutations locally; `/offline` does not auto-open on every disabled press.
3. **Permission shell is explanatory** — partners are not hard-blocked from opening `/together/policies` (read-only); Admin mutations redirect on FORBIDDEN.
