# Phase 3A — Remaining risks and limits

- **Test-only validation:** All authenticated flows used the verified development/testing Supabase project. Production data and production behavior were not tested.
- **Stale invitation browser path:** Expired, revoked, accepted, and mismatched invitation metadata are rejected in application unit tests. The browser did not click an already-rendered invitation after its server-side state changed; the existing acceptance RPC is the final authority for that race.
- **Pristine empty-Jar fixture:** No active-Jar UI was verified by archiving the fixture’s starter Jars. A separately created household with zero Jar rows was not used.
- **RPC failure simulation:** The recoverable Plan error branch was verified with a temporary local hook that returned a failure for the budget RPC. A live Supabase outage was not induced.
- **Existing diagnostics:** Unit and browser runs showed pre-existing HeroUI/JSDOM warnings and stream-close messages at context shutdown. They did not cause failed tests or captured page errors.

No known financial or authorization defect was introduced by these changes. No migration was added or applied.
