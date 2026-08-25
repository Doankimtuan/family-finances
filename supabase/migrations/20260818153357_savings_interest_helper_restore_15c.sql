create or replace function public.savings_simple_interest(
  p_principal numeric,
  p_annual_rate numeric,
  p_days integer
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0,
    floor(
      coalesce(p_principal, 0)
        * coalesce(p_annual_rate, 0)
        / 100
        * greatest(coalesce(p_days, 0), 0)
        / 365
    )
  );
$$;

revoke all on function public.savings_simple_interest(numeric, numeric, integer) from public;;
