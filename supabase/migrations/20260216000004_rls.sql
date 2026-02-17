alter table public.mimosa_spots enable row level security;

create policy "public read published"
on public.mimosa_spots
for select
to anon, authenticated
using (is_published = true);

create policy "owner read own"
on public.mimosa_spots
for select
to authenticated
using (claimed_by = auth.uid());

create policy "owner update own via rpc only"
on public.mimosa_spots
for update
to authenticated
using (false)
with check (false);

create policy "admin all"
on public.mimosa_spots
for all
to authenticated
using ((auth.jwt() ->> 'app_role') = 'admin')
with check ((auth.jwt() ->> 'app_role') = 'admin');

alter table public.flags enable row level security;

create policy "public insert flags"
on public.flags
for insert
to anon, authenticated
with check (true);

create policy "admin manage flags"
on public.flags
for all
to authenticated
using ((auth.jwt() ->> 'app_role') = 'admin')
with check ((auth.jwt() ->> 'app_role') = 'admin');
