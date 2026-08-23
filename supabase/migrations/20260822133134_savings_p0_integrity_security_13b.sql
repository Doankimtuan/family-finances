-- Pin internal calculation helpers to the intended schema.
alter function public.savings_calculate_interest(numeric, numeric, date, date, text, date)
  set search_path = public;

alter function public.savings_tax_for_interest(numeric, text, numeric)
  set search_path = public;
