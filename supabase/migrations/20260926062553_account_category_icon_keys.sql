-- Persist semantic icon keys only. Existing records remain nullable and use UI fallbacks.
alter table public.accounts add column icon_key text;
alter table public.categories add column icon_key text;

alter table public.accounts add constraint accounts_icon_key_allowed check (icon_key is null or icon_key in ('account', 'bank', 'wallet', 'cash', 'banknote', 'coins', 'credit-card', 'debit-card', 'savings', 'savings-account', 'piggy-bank', 'vault', 'safe', 'investment', 'stock', 'fund', 'bond', 'provider-bank', 'provider-wallet', 'provider-phone'));
alter table public.categories add constraint categories_icon_key_allowed check (icon_key is null or icon_key in ('coffee', 'food', 'restaurant', 'groceries', 'dining-out', 'snacks', 'shopping', 'clothing', 'beauty', 'gift', 'celebration', 'travel', 'flight', 'hotel', 'transport', 'fuel', 'parking', 'public-transit', 'taxi', 'vehicle', 'home', 'rent', 'mortgage', 'utilities', 'electricity', 'water', 'internet', 'phone', 'household-supplies', 'repairs', 'furniture', 'health', 'medicine', 'fitness', 'education', 'books', 'childcare', 'pets', 'entertainment', 'streaming', 'gaming', 'family', 'charity', 'insurance', 'taxes', 'fees', 'salary', 'freelance', 'business-income', 'bonus', 'investment-income', 'subscription', 'wedding', 'funeral', 'religious-giving', 'personal-care', 'electronics', 'office', 'childcare-school', 'vacation', 'hobby', 'refund-category', 'bank-fee', 'other'));

-- Existing category RLS already limits updates to household-owned, non-system rows.
grant update (icon_key) on public.categories to authenticated;

create or replace function public.create_category_with_icon(p_name text, p_kind text, p_jar_id uuid, p_icon_key text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_id uuid;
  v_jar_ok boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_kind not in ('income', 'expense') then
    raise exception 'Invalid category kind';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Category name required';
  end if;

  if p_icon_key is null then
    raise exception 'Category icon required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  if p_jar_id is not null then
    select exists (
      select 1
      from public.jars j
      where j.id = p_jar_id
        and j.household_id = v_household_id
        and j.is_archived = false
        and j.is_paused = false
    ) into v_jar_ok;

    if not v_jar_ok then
      raise exception 'Invalid jar';
    end if;
  end if;

  insert into public.categories (
    household_id, kind, name, is_system, is_active, sort_order, jar_id, icon_key
  )
  values (
    v_household_id,
    p_kind,
    trim(p_name),
    false,
    true,
    100,
    p_jar_id,
    p_icon_key
  )
  returning id into v_id;

  return jsonb_build_object('category_id', v_id);
exception
  when unique_violation then
    raise exception 'Category name already exists';
end;
$function$;

revoke all on function public.create_category_with_icon(text, text, uuid, text) from public;
grant execute on function public.create_category_with_icon(text, text, uuid, text) to authenticated;
