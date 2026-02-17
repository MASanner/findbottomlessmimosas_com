-- Owner edit venue (Section 6.4): SECURITY DEFINER, allowed fields only
create or replace function public.owner_update_spot(
  p_spot_id uuid,
  p_mimosa_price integer,
  p_hours jsonb,
  p_description text,
  p_deal_terms text,
  p_special_offer text,
  p_website_url text default null,
  p_reservation_url text default null,
  p_reservation_provider text default null,
  p_call_to_action_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old record;
begin
  if not exists (
    select 1 from public.mimosa_spots
    where id = p_spot_id and claimed_by = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  select mimosa_price, hours, description, deal_terms, special_offer, website_url, reservation_url, reservation_provider, call_to_action_note
  into v_old
  from public.mimosa_spots where id = p_spot_id;

  if v_old.mimosa_price is distinct from p_mimosa_price then
    insert into public.venue_edits_audit (spot_id, user_id, field_name, old_value, new_value)
    values (p_spot_id, auth.uid(), 'mimosa_price', v_old.mimosa_price::text, p_mimosa_price::text);
  end if;
  if v_old.hours is distinct from p_hours then
    insert into public.venue_edits_audit (spot_id, user_id, field_name, old_value, new_value)
    values (p_spot_id, auth.uid(), 'hours', v_old.hours::text, p_hours::text);
  end if;
  if v_old.description is distinct from p_description then
    insert into public.venue_edits_audit (spot_id, user_id, field_name, old_value, new_value)
    values (p_spot_id, auth.uid(), 'description', v_old.description, p_description);
  end if;
  if v_old.deal_terms is distinct from p_deal_terms then
    insert into public.venue_edits_audit (spot_id, user_id, field_name, old_value, new_value)
    values (p_spot_id, auth.uid(), 'deal_terms', v_old.deal_terms, p_deal_terms);
  end if;
  if v_old.special_offer is distinct from p_special_offer then
    insert into public.venue_edits_audit (spot_id, user_id, field_name, old_value, new_value)
    values (p_spot_id, auth.uid(), 'special_offer', v_old.special_offer, p_special_offer);
  end if;

  update public.mimosa_spots
  set
    mimosa_price = p_mimosa_price,
    hours = p_hours,
    description = left(p_description, 150),
    deal_terms = p_deal_terms,
    special_offer = p_special_offer,
    website_url = p_website_url,
    reservation_url = p_reservation_url,
    reservation_provider = p_reservation_provider,
    call_to_action_note = p_call_to_action_note,
    updated_at = now()
  where id = p_spot_id;
end;
$$;

-- Chain blocking trigger (Section 6.6)
create or replace function public.block_chains()
returns trigger as $$
declare
  blocked boolean := false;
begin
  if new.allow_chain = true then
    return new;
  end if;

  if new.name ilike any (array[
    '%Applebee%', '%Chili%', '%Outback%', '%Buffalo Wild Wings%',
    '%IHOP%', '%Denny%', '%Perkins%'
  ]) then
    blocked := true;
  end if;

  if blocked then
    raise exception 'Chains not permitted';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists chains_block on public.mimosa_spots;
create trigger chains_block
before insert on public.mimosa_spots
for each row execute function public.block_chains();
