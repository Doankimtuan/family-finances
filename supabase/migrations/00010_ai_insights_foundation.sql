-- ============================================================================
-- 00010_ai_insights_foundation.sql
-- Scheduled AI insight foundation: storage, delivery, feedback, and run locking.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Prompt version registry
-- --------------------------------------------------------------------------

create table if not exists public.ai_prompt_versions (
  id bigserial primary key,
  function_type text not null,
  version text not null,
  role_frame text not null,
  task_instruction text not null,
  output_contract jsonb not null default '{}'::jsonb,
  guardrails jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_prompt_versions_function_type_check check (
    function_type in ('monthly_review', 'goal_risk_coach', 'spending_anomaly_explainer')
  ),
  constraint ai_prompt_versions_version_not_blank check (length(trim(version)) > 0),
  constraint ai_prompt_versions_unique unique (function_type, version)
);

create unique index if not exists ai_prompt_versions_active_unique
  on public.ai_prompt_versions (function_type)
  where is_active = true;

comment on table public.ai_prompt_versions is 'Versioned prompts used for scheduled household AI insight generation.';

-- --------------------------------------------------------------------------
-- Run tracking and idempotency lock
-- --------------------------------------------------------------------------

create table if not exists public.ai_insight_runs (
  id bigserial primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  function_type text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'running',
  attempt_count integer not null default 1,
  trigger_source text not null,
  scheduler_job_id text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_insight_runs_function_type_check check (
    function_type in ('monthly_review', 'goal_risk_coach', 'spending_anomaly_explainer')
  ),
  constraint ai_insight_runs_status_check check (
    status in ('running', 'completed', 'failed', 'skipped')
  ),
  constraint ai_insight_runs_trigger_source_check check (
    trigger_source in ('pg_cron', 'manual', 'replay', 'vercel_cron')
  ),
  constraint ai_insight_runs_period_check check (period_end >= period_start),
  constraint ai_insight_runs_attempt_positive check (attempt_count > 0),
  constraint ai_insight_runs_unique unique (household_id, function_type, period_start, period_end)
);

create index if not exists idx_ai_runs_status_started
  on public.ai_insight_runs (status, started_at desc);

comment on table public.ai_insight_runs is 'Execution lifecycle log for each scheduled AI insight run and period.';

-- --------------------------------------------------------------------------
-- Generated AI insights
-- --------------------------------------------------------------------------

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  function_type text not null,
  period_start date not null,
  period_end date not null,
  prompt_version_id bigint references public.ai_prompt_versions(id) on delete set null,
  run_id bigint references public.ai_insight_runs(id) on delete set null,
  language char(2) not null default 'vi',
  model_provider text not null default 'google',
  model_name text not null default 'gemini-2.5-flash',
  content_text text not null,
  content_json jsonb not null default '{}'::jsonb,
  recommendation_text text not null,
  confidence_label text,
  token_input integer,
  token_output integer,
  latency_ms integer,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint ai_insights_function_type_check check (
    function_type in ('monthly_review', 'goal_risk_coach', 'spending_anomaly_explainer')
  ),
  constraint ai_insights_period_check check (period_end >= period_start),
  constraint ai_insights_language_check check (language in ('vi', 'en')),
  constraint ai_insights_confidence_check check (
    confidence_label is null or confidence_label in ('high', 'medium', 'low')
  ),
  constraint ai_insights_token_input_nonnegative check (token_input is null or token_input >= 0),
  constraint ai_insights_token_output_nonnegative check (token_output is null or token_output >= 0),
  constraint ai_insights_latency_nonnegative check (latency_ms is null or latency_ms >= 0),
  constraint ai_insights_unique_period unique (household_id, function_type, period_start, period_end)
);

create index if not exists idx_ai_insights_household_generated
  on public.ai_insights (household_id, generated_at desc);

create index if not exists idx_ai_insights_household_function_period
  on public.ai_insights (household_id, function_type, period_start desc);

comment on table public.ai_insights is 'Structured and human-readable AI insights generated on a household schedule.';

-- --------------------------------------------------------------------------
-- Delivery status for each member/channel
-- --------------------------------------------------------------------------

create table if not exists public.ai_insight_deliveries (
  id bigserial primary key,
  insight_id uuid not null references public.ai_insights(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(user_id) on delete cascade,
  channel text not null default 'in_app',
  delivery_status text not null default 'pending',
  delivered_at timestamptz,
  read_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_insight_deliveries_channel_check check (channel in ('in_app', 'email')),
  constraint ai_insight_deliveries_status_check check (
    delivery_status in ('pending', 'sent', 'failed', 'read')
  ),
  constraint ai_insight_deliveries_unique unique (insight_id, recipient_user_id, channel)
);

create index if not exists idx_ai_deliveries_recipient_status
  on public.ai_insight_deliveries (recipient_user_id, delivery_status, created_at desc);

comment on table public.ai_insight_deliveries is 'Per-user delivery/read lifecycle for each generated AI insight.';

-- --------------------------------------------------------------------------
-- Feedback loop for prompt quality
-- --------------------------------------------------------------------------

create table if not exists public.ai_insight_feedback (
  id bigserial primary key,
  insight_id uuid not null references public.ai_insights(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  function_type text not null,
  prompt_version_id bigint references public.ai_prompt_versions(id) on delete set null,
  feedback_value smallint not null,
  feedback_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_insight_feedback_function_type_check check (
    function_type in ('monthly_review', 'goal_risk_coach', 'spending_anomaly_explainer')
  ),
  constraint ai_insight_feedback_value_check check (feedback_value in (-1, 1)),
  constraint ai_insight_feedback_unique unique (insight_id, user_id)
);

create index if not exists idx_ai_feedback_function_prompt
  on public.ai_insight_feedback (function_type, prompt_version_id, created_at desc);

comment on table public.ai_insight_feedback is 'User helpful/not-helpful signals tied to prompt versions for iterative improvement.';

-- --------------------------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------------------------

drop trigger if exists trg_ai_insight_deliveries_set_updated_at on public.ai_insight_deliveries;
create trigger trg_ai_insight_deliveries_set_updated_at
before update on public.ai_insight_deliveries
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_insight_feedback_set_updated_at on public.ai_insight_feedback;
create trigger trg_ai_insight_feedback_set_updated_at
before update on public.ai_insight_feedback
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row-level security and policies
-- --------------------------------------------------------------------------

alter table public.ai_prompt_versions enable row level security;
alter table public.ai_insight_runs enable row level security;
alter table public.ai_insights enable row level security;
alter table public.ai_insight_deliveries enable row level security;
alter table public.ai_insight_feedback enable row level security;

-- Prompt versions: readable by authenticated users, writable by service roles.
drop policy if exists ai_prompt_versions_select_authenticated on public.ai_prompt_versions;
create policy ai_prompt_versions_select_authenticated
on public.ai_prompt_versions
for select
using (auth.uid() is not null);

drop policy if exists ai_prompt_versions_service_write on public.ai_prompt_versions;
create policy ai_prompt_versions_service_write
on public.ai_prompt_versions
for all
using (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'))
with check (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

-- Runs: readable by household members; writable by service roles.
drop policy if exists ai_insight_runs_select_member on public.ai_insight_runs;
create policy ai_insight_runs_select_member
on public.ai_insight_runs
for select
using (public.is_household_member(ai_insight_runs.household_id));

drop policy if exists ai_insight_runs_service_write on public.ai_insight_runs;
create policy ai_insight_runs_service_write
on public.ai_insight_runs
for all
using (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'))
with check (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

-- AI insights: readable by household members; writable by service roles.
drop policy if exists ai_insights_select_member on public.ai_insights;
create policy ai_insights_select_member
on public.ai_insights
for select
using (public.is_household_member(ai_insights.household_id));

drop policy if exists ai_insights_service_write on public.ai_insights;
create policy ai_insights_service_write
on public.ai_insights
for all
using (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'))
with check (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

-- Deliveries: readable by household members; recipient can mark read; inserts by service role.
drop policy if exists ai_insight_deliveries_select_member on public.ai_insight_deliveries;
create policy ai_insight_deliveries_select_member
on public.ai_insight_deliveries
for select
using (public.is_household_member(ai_insight_deliveries.household_id));

drop policy if exists ai_insight_deliveries_recipient_update on public.ai_insight_deliveries;
create policy ai_insight_deliveries_recipient_update
on public.ai_insight_deliveries
for update
using (
  ai_insight_deliveries.recipient_user_id = auth.uid()
  and public.is_household_member(ai_insight_deliveries.household_id)
)
with check (
  ai_insight_deliveries.recipient_user_id = auth.uid()
  and public.is_household_member(ai_insight_deliveries.household_id)
);

drop policy if exists ai_insight_deliveries_service_insert on public.ai_insight_deliveries;
create policy ai_insight_deliveries_service_insert
on public.ai_insight_deliveries
for insert
with check (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

drop policy if exists ai_insight_deliveries_service_delete on public.ai_insight_deliveries;
create policy ai_insight_deliveries_service_delete
on public.ai_insight_deliveries
for delete
using (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

-- Feedback: members can read household rows and write only own feedback.
drop policy if exists ai_insight_feedback_select_member on public.ai_insight_feedback;
create policy ai_insight_feedback_select_member
on public.ai_insight_feedback
for select
using (public.is_household_member(ai_insight_feedback.household_id));

drop policy if exists ai_insight_feedback_insert_own on public.ai_insight_feedback;
create policy ai_insight_feedback_insert_own
on public.ai_insight_feedback
for insert
with check (
  ai_insight_feedback.user_id = auth.uid()
  and public.is_household_member(ai_insight_feedback.household_id)
);

drop policy if exists ai_insight_feedback_update_own on public.ai_insight_feedback;
create policy ai_insight_feedback_update_own
on public.ai_insight_feedback
for update
using (
  ai_insight_feedback.user_id = auth.uid()
  and public.is_household_member(ai_insight_feedback.household_id)
)
with check (
  ai_insight_feedback.user_id = auth.uid()
  and public.is_household_member(ai_insight_feedback.household_id)
);

drop policy if exists ai_insight_feedback_delete_own on public.ai_insight_feedback;
create policy ai_insight_feedback_delete_own
on public.ai_insight_feedback
for delete
using (
  ai_insight_feedback.user_id = auth.uid()
  and public.is_household_member(ai_insight_feedback.household_id)
);

-- --------------------------------------------------------------------------
-- Realtime publication
-- --------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ai_insights'
  ) then
    execute 'alter publication supabase_realtime add table public.ai_insights';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ai_insight_deliveries'
  ) then
    execute 'alter publication supabase_realtime add table public.ai_insight_deliveries';
  end if;
end $$;

-- --------------------------------------------------------------------------
-- Run claim/finalize RPCs
-- --------------------------------------------------------------------------

create or replace function public.claim_ai_insight_run(
  p_household_id uuid,
  p_function_type text,
  p_period_start date,
  p_period_end date,
  p_trigger_source text,
  p_scheduler_job_id text default null
)
returns table (
  run_id bigint,
  should_run boolean,
  attempt_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.ai_insight_runs%rowtype;
begin
  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin') then
    raise exception 'Not authorized';
  end if;

  if p_period_end < p_period_start then
    raise exception 'Invalid period: end before start';
  end if;

  insert into public.ai_insight_runs (
    household_id,
    function_type,
    period_start,
    period_end,
    status,
    attempt_count,
    trigger_source,
    scheduler_job_id,
    started_at
  ) values (
    p_household_id,
    p_function_type,
    p_period_start,
    p_period_end,
    'running',
    1,
    p_trigger_source,
    p_scheduler_job_id,
    now()
  )
  on conflict (household_id, function_type, period_start, period_end) do nothing
  returning id, ai_insight_runs.attempt_count
  into run_id, attempt_count;

  if found then
    should_run := true;
    return next;
    return;
  end if;

  select *
  into v_existing
  from public.ai_insight_runs
  where household_id = p_household_id
    and function_type = p_function_type
    and period_start = p_period_start
    and period_end = p_period_end
  for update;

  if not found then
    raise exception 'Unable to load run lock row';
  end if;

  if v_existing.status = 'completed' then
    run_id := v_existing.id;
    should_run := false;
    attempt_count := v_existing.attempt_count;
    return next;
    return;
  end if;

  if v_existing.status = 'running' and v_existing.started_at > (now() - interval '30 minutes') then
    run_id := v_existing.id;
    should_run := false;
    attempt_count := v_existing.attempt_count;
    return next;
    return;
  end if;

  update public.ai_insight_runs
  set
    status = 'running',
    attempt_count = v_existing.attempt_count + 1,
    trigger_source = p_trigger_source,
    scheduler_job_id = p_scheduler_job_id,
    started_at = now(),
    finished_at = null,
    error_message = null,
    meta_json = '{}'::jsonb
  where id = v_existing.id
  returning id, ai_insight_runs.attempt_count
  into run_id, attempt_count;

  should_run := true;
  return next;
end;
$$;

create or replace function public.finish_ai_insight_run(
  p_run_id bigint,
  p_status text,
  p_error_message text default null,
  p_meta_json jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin') then
    raise exception 'Not authorized';
  end if;

  if p_status not in ('completed', 'failed', 'skipped') then
    raise exception 'Invalid run status: %', p_status;
  end if;

  update public.ai_insight_runs
  set
    status = p_status,
    finished_at = now(),
    error_message = p_error_message,
    meta_json = coalesce(p_meta_json, '{}'::jsonb)
  where id = p_run_id;

  if not found then
    raise exception 'Run id % not found', p_run_id;
  end if;
end;
$$;

grant execute on function public.claim_ai_insight_run(uuid, text, date, date, text, text)
to authenticated, service_role;

grant execute on function public.finish_ai_insight_run(bigint, text, text, jsonb)
to authenticated, service_role;

-- --------------------------------------------------------------------------
-- Seed v1 prompt versions for three lean AI functions
-- --------------------------------------------------------------------------

insert into public.ai_prompt_versions (
  function_type,
  version,
  role_frame,
  task_instruction,
  output_contract,
  guardrails,
  is_active
)
values
(
  'monthly_review',
  'v1',
  'Bạn là người kể chuyện tài chính gia đình, ưu tiên sự rõ ràng, bình tĩnh và hành động thực tế cho hộ gia đình Việt Nam.',
  'Tóm tắt tháng vừa qua bằng tiếng Việt, nêu tiến triển/điểm cần chú ý dựa đúng số liệu, và kết thúc bằng đúng 1 hành động cụ thể trong 7 ngày tới.',
  '{"type":"object","required":["title","summary","wins","risks","action"],"properties":{"title":{"type":"string"},"summary":{"type":"string"},"wins":{"type":"array","items":{"type":"string"}},"risks":{"type":"array","items":{"type":"string"}},"action":{"type":"string"}}}'::jsonb,
  '["Không bịa số","Không tư vấn sản phẩm tài chính cụ thể","Không giật gân","Bám sát dữ liệu hộ gia đình","Kết thúc bằng đúng 1 hành động cụ thể"]'::jsonb,
  true
),
(
  'goal_risk_coach',
  'v1',
  'Bạn là cố vấn tiến độ mục tiêu tài chính, thực dụng và nhạy cảm với bối cảnh gia đình Việt Nam.',
  'Phân tích mục tiêu có nguy cơ trễ hạn dựa trên chênh lệch tốc độ đóng góp, diễn giải ngắn gọn bằng tiếng Việt, và đưa ra đúng 1 hành động tuần này.',
  '{"type":"object","required":["title","risk_reason","impact","action"],"properties":{"title":{"type":"string"},"risk_reason":{"type":"string"},"impact":{"type":"string"},"action":{"type":"string"}}}'::jsonb,
  '["Không bịa số","Không áp đặt","Không đề xuất sản phẩm tài chính","Không cảnh báo quá mức","Đúng 1 hành động cụ thể"]'::jsonb,
  true
),
(
  'spending_anomaly_explainer',
  'v1',
  'Bạn là chuyên gia nhận diện biến động chi tiêu, tập trung giải thích nguyên nhân và hành động ngắn hạn phù hợp.',
  'Giải thích bất thường chi tiêu so với nền gần đây bằng tiếng Việt, nêu 1-2 nguyên nhân khả dĩ từ dữ liệu và đề xuất đúng 1 hành động thực thi trong tuần.',
  '{"type":"object","required":["title","what_changed","drivers","action"],"properties":{"title":{"type":"string"},"what_changed":{"type":"string"},"drivers":{"type":"array","items":{"type":"string"}},"action":{"type":"string"}}}'::jsonb,
  '["Không bịa số","Không phán xét","Không cảnh báo quá mức","Chỉ dùng dữ liệu đã cho","Đúng 1 hành động cụ thể"]'::jsonb,
  true
)
on conflict (function_type, version) do nothing;
