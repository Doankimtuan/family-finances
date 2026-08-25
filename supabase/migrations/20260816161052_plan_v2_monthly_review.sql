-- PLAN 07: optional Monthly Review metadata and compact historical snapshot.
-- Review state is informational only; no Plan or Money lock is introduced.
alter table public.month_ritual_runs
  add column if not exists viewed_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_snapshot jsonb;

comment on column public.month_ritual_runs.viewed_at is
  'Optional Monthly Review opened timestamp. Never blocks edits.';
comment on column public.month_ritual_runs.reviewed_at is
  'Optional Monthly Review marked-reviewed timestamp. Never blocks edits.';
comment on column public.month_ritual_runs.review_snapshot is
  'Compact report snapshot captured when marked reviewed; not a ledger source of truth.';

create index if not exists month_ritual_runs_review_status_idx
  on public.month_ritual_runs (household_id, period_month, review_status);
;
