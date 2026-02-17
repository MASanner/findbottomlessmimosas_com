create or replace function public.increment_calls(p_spot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mimosa_spots
  set calls = calls + 1, updated_at = now()
  where id = p_spot_id;
end;
$$;

create or replace function public.increment_outbound(p_spot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mimosa_spots
  set outbound_clicks = outbound_clicks + 1, updated_at = now()
  where id = p_spot_id;
end;
$$;

create or replace function public.increment_views(p_spot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mimosa_spots
  set views = views + 1, updated_at = now()
  where id = p_spot_id;
end;
$$;
