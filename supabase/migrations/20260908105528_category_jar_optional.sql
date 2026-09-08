alter table public.categories
  drop constraint if exists categories_jar_mapping_check;

alter table public.categories
  add constraint categories_jar_mapping_check
  check (
    (is_system = true and jar_id is null)
    or is_system = false
  );

create or replace function public.create_category(p_name text, p_kind text, p_jar_id uuid)
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
    household_id, kind, name, is_system, is_active, sort_order, jar_id
  )
  values (
    v_household_id,
    p_kind,
    trim(p_name),
    false,
    true,
    100,
    p_jar_id
  )
  returning id into v_id;

  return jsonb_build_object('category_id', v_id);
exception
  when unique_violation then
    raise exception 'Category name already exists';
end;
$function$;
