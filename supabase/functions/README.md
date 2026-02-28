# Scheduled AI Insights (Supabase Edge Functions)

## Edge Function
- Function name: `ai-cycle-dispatch`
- Endpoint: `/functions/v1/ai-cycle-dispatch`
- Method: `POST`
- Auth header: `Authorization: Bearer <AI_WORKER_SECRET>`

Body:
```json
{
  "functionType": "monthly_review",
  "triggerSource": "manual"
}
```

Allowed `functionType` values:
- `monthly_review`
- `goal_risk_coach`
- `spending_anomaly_explainer`

## Required function secrets
Set in Supabase Edge Function secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `AI_WORKER_SECRET`
- `GEMINI_MODEL` (optional, default `gemini-2.5-flash`)

## Scheduler setup
1. Run DB migrations `00010` and `00011`.
2. Update `public.ai_scheduler_config` singleton row:
   - `edge_function_url` to your deployed function URL.
   - `worker_secret` to the same value as `AI_WORKER_SECRET`.
   - `is_enabled = true`.
3. Verify cron jobs in `cron.job`:
   - `ai_monthly_review_v1`
   - `ai_weekly_goal_risk_coach_v1`
   - `ai_weekly_spending_anomaly_v1`

## Cost controls
- Hard cap: max 6 AI insights per household/month.
- Reserved slot policy: spending anomaly runner skips when monthly count reaches 5.
- If cap is hit, system writes deterministic fallback to existing `insights` table.
