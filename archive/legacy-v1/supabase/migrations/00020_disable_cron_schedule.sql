-- ============================================================================
-- 00020_disable_cron_schedule.sql
-- Disable all AI cron schedules. AI is now on-demand only.
-- ============================================================================

-- Unschedule the cron jobs (they were created in 00011_ai_scheduler_cron.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai_monthly_review_v1') THEN
    PERFORM cron.unschedule('ai_monthly_review_v1');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai_weekly_goal_risk_coach_v1') THEN
    PERFORM cron.unschedule('ai_weekly_goal_risk_coach_v1');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai_weekly_spending_anomaly_v1') THEN
    PERFORM cron.unschedule('ai_weekly_spending_anomaly_v1');
  END IF;
END;
$$;

-- Also ensure the scheduler config is disabled
UPDATE public.ai_scheduler_config
SET is_enabled = false
WHERE true;
