-- One-wave MONEY credit-card raw inputs.
-- Keeps billing and financial semantics in the existing TypeScript mapper.
create or replace function public.get_money_credit_card_raw_inputs()
returns table(
  account_id uuid,
  account_name text,
  account_type text,
  financial_scope text,
  owner_membership_id uuid,
  owner_membership_is_active boolean,
  credit_limit numeric,
  statement_day integer,
  due_day integer,
  linked_bank_account_id uuid,
  billing_month_id uuid,
  card_account_id uuid,
  billing_month date,
  statement_amount numeric,
  paid_amount numeric,
  due_date date,
  status text
)
language sql
stable
security invoker
set search_path to 'public'
as $function$
  select
    a.id,
    a.name,
    a.type,
    a.financial_scope,
    a.owner_membership_id,
    a.owner_membership_id is null
      or exists (
        select 1
        from public.household_members owner_membership
        where owner_membership.id = a.owner_membership_id
          and owner_membership.household_id = a.household_id
          and owner_membership.is_active = true
      ),
    s.credit_limit,
    s.statement_day,
    s.due_day,
    s.linked_bank_account_id,
    m.id,
    m.card_account_id,
    m.billing_month,
    m.statement_amount,
    m.paid_amount,
    m.due_date,
    m.status
  from public.accounts a
  left join public.credit_card_settings s
    on s.account_id = a.id
   and s.household_id = a.household_id
  left join public.card_billing_months m
    on m.card_account_id = a.id
   and m.household_id = a.household_id
   and m.status <> 'settled'
  where a.household_id = public.investment_active_household()
    and a.is_archived = false
    and a.type = 'credit_card'
  order by a.created_at asc, m.billing_month asc, m.id asc;
$function$;

revoke all on function public.get_money_credit_card_raw_inputs() from public;
grant execute on function public.get_money_credit_card_raw_inputs() to authenticated;
