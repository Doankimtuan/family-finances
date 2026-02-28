# Family Finances AI Knowledge Handoff

## 1. Real Problem Being Solved

This product is not a bookkeeping app. It is a household clarity system for Vietnamese couples who feel financial anxiety because they cannot see one trusted, complete, forward-looking picture of money.

Core user pain points:

- Fragmented truth across bank apps, memory, and spreadsheets.
- No clear projection for major life decisions (land purchase, mortgage, child, job change).
- No shared household visibility between partners.
- Difficulty turning data into action (cognitive load of raw numbers).

Primary product goal:

- Move users from anxiety to clarity by giving a single source of truth, explainable metrics, and actionable next steps.

## 2. Product/UX Contract (Implemented Direction)

- **Language**: Bilingual (`en` + `vi`) with household-level language setting.
- **Narrative-First**: Replaces dry scores with "Health Stories" (e.g., "Improving", "Healthy") and dynamic visualizations.
- **Action-Oriented**: Focuses on "Priority Actions" and "ETA" (Expected Time of Arrival) rather than just status.
- **Consolidated Navigation**: Mobile-first design with 4 primary tabs: **Home** (Dashboard), **Money** (Accounts/Assets/Debts/Flow), **Activity** (Transactions), and **Plan** (Insights/Health/Goals/Budgets).
- **Constructive Framing**: Uses progress-focused, non-shaming vocabulary (e.g., "Building" vs "Fragile").
- **Manual Logging**: Optimized for high-speed manual data entry (under 10 seconds).
- **Vietnamese Financial Context**: Native support for gold (`lượng`), VND scale, and complex mortgage rate structures (promo-to-floating).

## 3. Technical Baseline

Stack in use:

- Next.js 16 App Router + TypeScript
- Supabase (Postgres, Auth, RLS, Realtime)
- Supabase Edge Functions + `pg_cron`/`pg_net` for scheduled AI execution
- shadcn-style UI primitives + Tailwind
- Recharts
- TanStack Query + Supabase Realtime integration

Deployment target:

- Vercel + Supabase hosted

## 4. Current Solution Architecture

### Frontend structure

- **App Shell**: Wraps pages with mobile-friendly container, sticky header (with Settings access), and 4-tab bottom navigation.
- **Components**: Shared primitives under `components/ui/*` (Card, MetricCard, SectionHeader, Progress, EmptyState, Badge).
- **Server Actions / API routes**: Typed action states with revalidation and audit logging. AI feedback/read state endpoints added under `app/api/ai-insights/*`.

### Data flow pattern

- **Server Discovery**: Fetches household-scoped context and data early.
- **Realtime Bridge**: `HouseholdRealtimeSync` ensures multi-device consistency without manual refreshes.
- **Explainability**: Complex metrics (Health, Insights) provide drill-downs or "How this is calculated" narratives.
- **Scheduled AI**: New Supabase Edge dispatcher runs on cron cadence, gated by deterministic triggers and monthly quota.

## 5. Database and Migrations (Current)

Migration files:

- `00001_extensions.sql` to `00008_household_assumptions_settings.sql` (Core schema and lifecycle/RLS)
- `00009_goal_cashflow_directions.sql` (Goal inflow/outflow + account direction)
- `00010_ai_insights_foundation.sql` (AI storage, runs, delivery, feedback, prompt versions, RPC locks)
- `00011_ai_scheduler_cron.sql` (scheduler config + `invoke_ai_cycle` + cron jobs)

### Key data model additions for AI

- `ai_prompt_versions`: Prompt registry with active version per AI function.
- `ai_insight_runs`: Idempotent run tracking (`running/completed/failed/skipped`) per household + function + period.
- `ai_insights`: Structured AI output (`content_json`) + narrative text + metadata (model, tokens, latency).
- `ai_insight_deliveries`: Per-member delivery/read status for in-app/email channels.
- `ai_insight_feedback`: Helpful/not-helpful user feedback linked to prompt version.
- `ai_scheduler_config`: Singleton table storing edge URL + worker secret + on/off flag.

### Why AI is modeled separately from `insights`

- Existing deterministic `insights` remains stable and low-cost.
- New `ai_*` tables support prompt versioning, run lifecycle, feedback analytics, and cost controls.
- Separation allows gradual rollout and safer fallback behavior.

## 6. Core Business Logic Implemented

### Deterministic engines (existing)

- Dashboard aggregates, financial health score, and baseline insights remain rule-based and explainable.

### Scheduled AI engine (new)

Implemented lean cost-optimized AI set (no continuous inference):

1. **`monthly_review`**
- Runs monthly (VN 08:00 day 1).
- Generates Vietnamese financial summary + exactly 1 concrete weekly action.

2. **`goal_risk_coach`**
- Evaluated weekly (VN Monday 08:00).
- Calls AI only if off-track rule is true (e.g., `avg_contribution_3m < required_monthly * 0.9` or near deadline with insufficient pace).

3. **`spending_anomaly_explainer`**
- Evaluated weekly (VN Wednesday 20:00).
- Calls AI only if variable spending anomaly threshold is breached (default +25% vs 3-month baseline).

### Cost guardrails (implemented)

- Hard cap: **max 6 AI generations per household per month**.
- Priority order near cap:
  1. `monthly_review`
  2. `goal_risk_coach`
  3. `spending_anomaly_explainer`
- If cap is exceeded: system stores deterministic fallback alert in existing `insights` (no AI call).

## 7. Implemented Product Modules

- **Dashboard**: Core metrics, health overview, real trend data, quick actions.
- **Health**: Narrative-first health story with dynamic factor decomposition.
- **Insights**: Existing urgency buckets plus new AI storage/delivery backend.
- **Goals**: ETA-focused management with inflow/outflow cash flow tracking.
- **Budgets**: Daily pacing framework.
- **Navigation**: Simplified 4-tab bottom bar + sticky settings access.
- **Onboarding**: Multi-step household setup and first data capture.
- **Decision Tools**: What-if simulators for loans, purchases, and savings.

## 8. Recent Implementation Delta

### Product/UX deltas (already in app)

- Consolidated navigation, improved health storytelling, better insight bucketing.
- Goal cashflow directionality (`flow_type`, source/destination account) integrated into app flows.

### AI infra deltas (new)

- Supabase Edge Function scaffold:
  - `supabase/functions/ai-cycle-dispatch/index.ts`
  - shared modules in `supabase/functions/_shared/*` (`context`, `prompts`, `gemini`, `run-lock`, `store`, etc.)
- Run lock RPCs:
  - `claim_ai_insight_run(...)`
  - `finish_ai_insight_run(...)`
- Feedback/read API routes:
  - `app/api/ai-insights/feedback/route.ts`
  - `app/api/ai-insights/read/route.ts`

## 9. Scheduler and Operations

### Cron schedule (UTC in DB, VN intent)

- `ai_monthly_review_v1`: `0 1 1 * *` (VN 08:00 day 1)
- `ai_weekly_goal_risk_coach_v1`: `0 1 * * 1` (VN Monday 08:00)
- `ai_weekly_spending_anomaly_v1`: `0 13 * * 3` (VN Wednesday 20:00)

### Required secrets/config

Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `AI_WORKER_SECRET`
- `GEMINI_MODEL` (optional, default `gemini-2.5-flash`)

DB runtime config:

- Update singleton `public.ai_scheduler_config` with deployed function URL + same worker secret.
- Set `is_enabled = true` after verification.

### Security posture

- `ai_*` tables are RLS-protected.
- Writes to run/insight generation paths are service-role controlled.
- Member-level access is constrained by `household_id`; delivery read updates restricted to recipient.

## 10. Known Gaps / Next Best Steps

1. **AI Insights UI Integration**
- Render `ai_insights` in dashboard/insights card, with thumbs up/down and read-state interactions.

2. **Weekly Email Digest (Optional)**
- Use `ai_insight_deliveries` channel `email` and queue mail provider integration.

3. **Monitoring & Alerting**
- Add failure alerts for `ai_insight_runs.status = 'failed'` with retry visibility.

4. **Prompt Iteration Analytics**
- Build simple internal report over `ai_insight_feedback` grouped by `function_type` and `prompt_version_id`.

## 11. AI Continuation Guide for Future Agents

- Keep AI **scheduled and gated**, not real-time.
- Prefer deterministic SQL/math pre-computation; AI should explain and recommend, not calculate raw metrics.
- Maintain strict output contracts (JSON), Vietnamese user-facing tone, and exactly one action recommendation.
- Do not merge `ai_insights` into legacy `insights` unless a deliberate migration strategy is approved.
- Respect cost cap and trigger gating; they are product decisions, not temporary safeguards.

Key starting files:

- Handoff + strategy: `AI_KNOWLEDGE_HANDOFF.md`
- AI migrations: `supabase/migrations/00010_ai_insights_foundation.sql`, `supabase/migrations/00011_ai_scheduler_cron.sql`
- Edge dispatcher: `supabase/functions/ai-cycle-dispatch/index.ts`
- Edge shared modules: `supabase/functions/_shared/*`
- Existing deterministic insights engine: `lib/insights/engine.ts`, `lib/insights/service.ts`
- Feedback/read API routes: `app/api/ai-insights/feedback/route.ts`, `app/api/ai-insights/read/route.ts`
