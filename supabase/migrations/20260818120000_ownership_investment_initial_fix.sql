-- Prompt 14E follow-up: the initial-purchase staging holding must satisfy the
-- existing zero-quantity/exited constraint before record_investment_buy adds it.

do $$
declare
  definition text;
begin
  definition := pg_get_functiondef(
    'public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text)'::regprocedure
  );
  definition := replace(
    definition,
    '''active'', ''full'', 0, 0',
    '''exited'', ''full'', 0, 0'
  );
  execute definition;
end $$;

revoke all on function public.record_investment_initial_purchase(
  text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text
) from public, anon;
grant execute on function public.record_investment_initial_purchase(
  text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text
) to authenticated;
