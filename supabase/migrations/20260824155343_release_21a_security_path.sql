-- Release 21A.1: make the existing empty search_path pin explicit again.
-- All non-built-in objects in these SECURITY DEFINER functions are schema-qualified.
alter function public.change_goal_lifecycle(uuid, text)
  set search_path = '';

alter function public.change_household_member_role(uuid, text)
  set search_path = '';

alter function public.reassign_goal_funding_source(uuid, uuid, uuid)
  set search_path = '';
