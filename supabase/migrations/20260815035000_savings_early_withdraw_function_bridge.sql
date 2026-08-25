-- The follow-on migration replaces this function without its legacy default.
drop function if exists public.early_withdraw_saving(
  uuid, numeric, numeric, numeric, numeric, numeric, text, uuid
);
