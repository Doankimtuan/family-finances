# Health bounded context

Leaf context for household financial **health scores, insights, and scenarios**.

## BR-24 / Health-RO (AC-HLT-01)

Health is **compute-on-read only**:

- No `commands/` folder
- No direct Supabase client (`createSupabaseServerClient`, browser, admin)
- No `.insert` / `.update` / `.upsert` / `.delete` / `.rpc`
- No persisted Health snapshots (legacy `calculateAndPersistHealthSnapshot` retired)

Orchestration (`getHealthDetail`) may **read** ledger / plan / inbox application queries. It must never import operational `commands/**`.

Platform helper: `asReadOnlySupabaseClient` in `modules/platform/supabase/read-only.ts` for any future direct reads.

## BR-14 / AI Non-Invention

Insights use **counts-only** params from verified household facts. Always includes `ai_guardrail`. Platform guards: `assertAiSuggestionGrounded`, `assertNoAutonomousMoneyMove`.
