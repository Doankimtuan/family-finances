-- The runtime-fixes migration replaces this signature without legacy defaults.
drop function if exists public.create_saving_with_transfer(
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text
);
