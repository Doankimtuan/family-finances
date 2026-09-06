-- Corrected expense legs are valid card installment sources. The original
-- transaction remains excluded by the application query when it has a child
-- reversal/correction, while a reversal leg is still rejected here.
CREATE OR REPLACE FUNCTION public.validate_credit_card_installment_source()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_source public.transactions%rowtype;
  v_card public.accounts%rowtype;
begin
  select * into v_source from public.transactions where id = new.source_transaction_id;
  if not found then
    raise exception 'Invalid credit card installment source transaction';
  end if;
  select * into v_card from public.accounts where id = new.card_account_id;
  if not found then
    raise exception 'Invalid credit card installment card account';
  end if;
  if v_source.household_id <> new.household_id
    or v_source.account_id <> new.card_account_id
    or v_source.type <> 'expense'
    or v_source.amount <= 0
    or v_source.reverses_transaction_id is not null
    or exists (
      select 1
      from public.transactions v_related
      where v_related.household_id = new.household_id
        and (
          v_related.reverses_transaction_id = v_source.id
          or v_related.corrects_transaction_id = v_source.id
        )
    )
    or v_card.household_id <> new.household_id
    or v_card.type <> 'credit_card'
    or v_card.is_archived then
    raise exception 'Invalid credit card installment source transaction';
  end if;
  return new;
end;
$function$;
