# Phase 3B Remaining Risks & Codex Handoff

## 1. Agent Ownership Boundaries Preserved

In accordance with ViNha multi-agent governance rules:

- **Antigravity (Frontend & UX Owner)** modified only presentation-layer, shared UI, and translation catalog files.
- **No changes were made to**:
  - Supabase database migrations
  - PostgreSQL RPC functions
  - Row Level Security (RLS) policies
  - Financial balance calculations
  - Ledger transaction mutations
  - Auth session cookies or security policies
  - Household membership rules

---

## 2. Codex Handoff: Database Stored Procedures & System Notes

### Context

In Phase 3B, Antigravity implemented presentation-level display translation for system-generated savings transaction notes via `localizeTransactionNote`. This completely resolved the issue (F5) in the UI without altering database records.

### Recommendation for Codex (Backend Owner)

1. **Future Migration Note Generation**:
   - Several PostgreSQL functions (e.g. `create_saving`, `settle_saving`, `early_settle_saving`) currently insert hardcoded Vietnamese strings directly into `transactions.note`:
     ```sql
     'Gửi tiết kiệm: ' || p_product_name
     ```
   - In future database refactors or migrations, Codex should consider writing structured event identifiers (e.g. `SAVINGS_PRINCIPAL_PLACEMENT`) into transaction metadata (`metadata->>'system_event_kind'`) and storing locale-neutral identifiers rather than embedding natural language strings in the `note` column.
2. **Historical Ledger Immutability**:
   - Historical ledger rows in `transactions` must remain intact. Antigravity's display-time parser cleanly handles all historical prefix variations (`Gửi tiết kiệm:`, `Fund saving:`, `Saving funded:`, etc.), so no historical data migration or update script is required.

---

## 3. HeroUI & React Aria Upstream Consideration

### Context

HeroUI v3 unconditionally wraps modal dialogs in React Aria Components `<DialogTrigger>`, which triggers a `PressResponder rendered without pressable child` warning when modals are controlled externally via `isOpen` / `onOpenChange`.

### Resolution Implemented

Antigravity resolved this cleanly in `shared/ui/bottom-sheet.tsx` and `shared/ui/dialog.tsx` by introducing `ControlledTriggerSink`, which calls `usePress({})` to satisfy RAC's trigger contract without affecting layout or accessibility.

### Future Risk & Upstream Tracking

- If HeroUI is upgraded in a future package update, verify whether HeroUI v3.x or v4 decouples controlled modals from `<DialogTrigger>`. If upstream adopts native controlled modal patterns, `ControlledTriggerSink` can eventually be deprecated.
- For now, `ControlledTriggerSink` is completely stable and zero-overhead.

---

## 4. Phase 3C Boundary

Phase 3C will focus on navigation performance and route transition smoothness. No speculative navigation prefetching, route caching, or transition optimizations were introduced in Phase 3B to preserve clear scope boundaries.
