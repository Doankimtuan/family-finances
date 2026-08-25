-- Sprint 6 ST-E06-002: AI / assist suggestion audit log (BR-14)

create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_kind text not null,
  surface text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_audit_logs_kind_check
    check (event_kind in ('suggestion', 'approval', 'rejection', 'policy_block'))
);

create index if not exists ai_audit_logs_household_created_idx
  on public.ai_audit_logs (household_id, created_at desc);

comment on table public.ai_audit_logs is
  'BR-14 audit trail for assist suggestions and explicit approvals. Never stores invented balances as truth.';

alter table public.ai_audit_logs enable row level security;

drop policy if exists ai_audit_logs_select_member on public.ai_audit_logs;
create policy ai_audit_logs_select_member on public.ai_audit_logs
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists ai_audit_logs_insert_member on public.ai_audit_logs;
create policy ai_audit_logs_insert_member on public.ai_audit_logs
  for insert to authenticated
  with check (public.is_household_member(household_id));

revoke update, delete on public.ai_audit_logs from authenticated;
grant select, insert on public.ai_audit_logs to authenticated;;
