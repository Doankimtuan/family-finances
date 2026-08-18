-- ST-E04-004: Debts, savings products, installment/EMI surfaces (AC-010, AC-011, BR-10, BR-11)

-- Liabilities (debts) — owed amounts are NOT bank Balance (BR-01)
create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  creditor text,
  principal_amount numeric(18, 0) not null,
  remaining_amount numeric(18, 0) not null,
  currency char(3) not null default 'VND',
  due_day int,
  note text,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint liabilities_name_not_blank check (length(trim(name)) > 0),
  constraint liabilities_principal_positive check (principal_amount > 0),
  constraint liabilities_remaining_nonneg check (remaining_amount >= 0),
  constraint liabilities_remaining_lte_principal check (remaining_amount <= principal_amount),
  constraint liabilities_due_day_range check (due_day is null or (due_day >= 1 and due_day <= 31))
);

create index if not exists idx_liabilities_household
  on public.liabilities (household_id, is_archived, created_at desc);

-- Term / product savings — maturity guides to Inbox (AC-010 / BR-10)
create table if not exists public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  principal_amount numeric(18, 0) not null,
  currency char(3) not null default 'VND',
  maturity_date date not null,
  status text not null default 'active',
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_accounts_name_not_blank check (length(trim(name)) > 0),
  constraint savings_accounts_principal_positive check (principal_amount > 0),
  constraint savings_accounts_status_check check (
    status in ('active', 'matured', 'closed')
  )
);

create index if not exists idx_savings_accounts_household
  on public.savings_accounts (household_id, status, maturity_date);

-- Card installments / EMI (AC-011 / BR-11)
create table if not exists public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  card_label text,
  total_amount numeric(18, 0) not null,
  installment_amount numeric(18, 0) not null,
  currency char(3) not null default 'VND',
  num_installments int not null,
  paid_installments int not null default 0,
  status text not null default 'active',
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint installment_plans_name_not_blank check (length(trim(name)) > 0),
  constraint installment_plans_amounts_positive check (
    total_amount > 0 and installment_amount > 0
  ),
  constraint installment_plans_counts check (
    num_installments > 0
    and paid_installments >= 0
    and paid_installments <= num_installments
  ),
  constraint installment_plans_status_check check (
    status in ('active', 'completed')
  )
);

create index if not exists idx_installment_plans_household
  on public.installment_plans (household_id, status, created_at desc);

alter table public.liabilities enable row level security;
alter table public.savings_accounts enable row level security;
alter table public.installment_plans enable row level security;

create policy liabilities_select_member on public.liabilities
  for select to authenticated
  using (public.is_household_member(household_id));

create policy liabilities_insert_member on public.liabilities
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy liabilities_update_member on public.liabilities
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy savings_accounts_select_member on public.savings_accounts
  for select to authenticated
  using (public.is_household_member(household_id));

create policy savings_accounts_insert_member on public.savings_accounts
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy savings_accounts_update_member on public.savings_accounts
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy installment_plans_select_member on public.installment_plans
  for select to authenticated
  using (public.is_household_member(household_id));

create policy installment_plans_insert_member on public.installment_plans
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy installment_plans_update_member on public.installment_plans
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert, update on public.liabilities to authenticated;
grant select, insert, update on public.savings_accounts to authenticated;
grant select, insert, update on public.installment_plans to authenticated;

-- Record debt payment — reduces remaining owed (not a bank Balance invent)
create or replace function public.record_liability_payment(
  p_liability_id uuid,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_row public.liabilities%rowtype;
  v_pay numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

  select * into v_row
  from public.liabilities l
  where l.id = p_liability_id
  for update;

  if not found then
    raise exception 'Liability not found';
  end if;

  if not public.is_household_member(v_row.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_row.is_archived then
    raise exception 'Liability archived';
  end if;

  v_pay := least(p_amount, v_row.remaining_amount);

  update public.liabilities l
  set
    remaining_amount = v_row.remaining_amount - v_pay,
    updated_at = timezone('utc', now()),
    is_archived = case
      when v_row.remaining_amount - v_pay = 0 then true
      else l.is_archived
    end
  where l.id = p_liability_id;

  return jsonb_build_object(
    'ok', true,
    'paid', v_pay,
    'remaining', v_row.remaining_amount - v_pay
  );
end;
$$;

grant execute on function public.record_liability_payment(uuid, numeric) to authenticated;

-- Enqueue savings maturity ReviewItem (AC-010) — coach only, no invented balance
create or replace function public.enqueue_savings_maturity(p_savings_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_row public.savings_accounts%rowtype;
  v_item_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_row
  from public.savings_accounts s
  where s.id = p_savings_id
  for update;

  if not found then
    raise exception 'Savings not found';
  end if;

  if not public.is_household_member(v_row.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_row.status = 'closed' then
    raise exception 'Savings closed';
  end if;

  update public.savings_accounts s
  set
    status = 'matured',
    updated_at = timezone('utc', now())
  where s.id = p_savings_id
    and s.status = 'active';

  insert into public.inbox_items (
    household_id,
    kind,
    status,
    source_type,
    source_id,
    amount,
    currency,
    title,
    context_json
  )
  values (
    v_row.household_id,
    'savings_maturity',
    'pending',
    'guided',
    p_savings_id,
    v_row.principal_amount,
    v_row.currency,
    v_row.name,
    jsonb_build_object(
      'flow', 'savings_maturity',
      'maturity_date', v_row.maturity_date
    )
  )
  on conflict (household_id, source_type, source_id) do update
    set
      status = 'pending',
      updated_at = timezone('utc', now()),
      title = excluded.title,
      amount = excluded.amount
  returning id into v_item_id;

  if v_item_id is null then
    select i.id into v_item_id
    from public.inbox_items i
    where i.household_id = v_row.household_id
      and i.source_type = 'guided'
      and i.source_id = p_savings_id;
  end if;

  return jsonb_build_object('ok', true, 'inboxItemId', v_item_id);
end;
$$;

grant execute on function public.enqueue_savings_maturity(uuid) to authenticated;

-- Record EMI payment; complete → Inbox celebrate (AC-011 / BR-11)
create or replace function public.record_installment_payment(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_row public.installment_plans%rowtype;
  v_paid int;
  v_item_id uuid;
  v_completed boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_row
  from public.installment_plans p
  where p.id = p_plan_id
  for update;

  if not found then
    raise exception 'Installment plan not found';
  end if;

  if not public.is_household_member(v_row.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_row.status = 'completed' then
    raise exception 'Installment already completed';
  end if;

  v_paid := v_row.paid_installments + 1;
  v_completed := v_paid >= v_row.num_installments;

  update public.installment_plans p
  set
    paid_installments = v_paid,
    status = case when v_completed then 'completed' else 'active' end,
    updated_at = timezone('utc', now())
  where p.id = p_plan_id;

  if v_completed then
    insert into public.inbox_items (
      household_id,
      kind,
      status,
      source_type,
      source_id,
      amount,
      currency,
      title,
      context_json
    )
    values (
      v_row.household_id,
      'emi_complete',
      'pending',
      'guided',
      p_plan_id,
      v_row.installment_amount,
      v_row.currency,
      v_row.name,
      jsonb_build_object(
        'flow', 'emi_complete',
        'num_installments', v_row.num_installments,
        'paid_installments', v_paid
      )
    )
    on conflict (household_id, source_type, source_id) do update
      set
        status = 'pending',
        updated_at = timezone('utc', now()),
        title = excluded.title
    returning id into v_item_id;

    if v_item_id is null then
      select i.id into v_item_id
      from public.inbox_items i
      where i.household_id = v_row.household_id
        and i.source_type = 'guided'
        and i.source_id = p_plan_id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'paidInstallments', v_paid,
    'completed', v_completed,
    'inboxItemId', v_item_id
  );
end;
$$;

grant execute on function public.record_installment_payment(uuid) to authenticated;
