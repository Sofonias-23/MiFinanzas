alter table public.profiles
  add column if not exists avatar_path text;

create or replace function private.can_view_profile(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select
    p_target = auth.uid()
    or exists (
      select 1
      from public.household_members me
      join public.household_members other
        on other.household_id = me.household_id
      where me.user_id = auth.uid()
        and other.user_id = p_target
    );
$$;

revoke all on function private.can_view_profile(uuid) from public;
grant execute on function private.can_view_profile(uuid) to authenticated;

drop policy if exists profiles_select_household_peers on public.profiles;
create policy profiles_select_household_peers
on public.profiles
for select
to authenticated
using (private.can_view_profile(id));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select_household on storage.objects;
create policy avatars_select_household
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and private.can_view_profile(split_part(name, '/', 1)::uuid)
);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
