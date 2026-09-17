create schema if not exists private;

create or replace function private.is_household_member(target_household_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = target_user_id
  );
$$;

create or replace function private.is_household_owner(target_household_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.households h
    where h.id = target_household_id
      and h.created_by = target_user_id
  );
$$;

revoke all on function private.is_household_member(uuid, uuid) from public;
revoke all on function private.is_household_owner(uuid, uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_household_member(uuid, uuid) to authenticated;
grant execute on function private.is_household_owner(uuid, uuid) to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "households_select_member" on public.households;
create policy "households_select_member"
on public.households for select
using (
  created_by = (select auth.uid())
  or private.is_household_member(id, (select auth.uid()))
);

drop policy if exists "households_insert_owner" on public.households;
create policy "households_insert_owner"
on public.households for insert
with check (created_by = (select auth.uid()));

drop policy if exists "members_select_member" on public.household_members;
create policy "members_select_member"
on public.household_members for select
using (
  user_id = (select auth.uid())
  or private.is_household_member(household_id, (select auth.uid()))
);

drop policy if exists "members_insert_household_owner" on public.household_members;
create policy "members_insert_household_owner"
on public.household_members for insert
with check (
  private.is_household_owner(household_id, (select auth.uid()))
);

drop policy if exists "expenses_select_allowed" on public.expenses;
create policy "expenses_select_allowed"
on public.expenses for select
using (
  created_by = (select auth.uid())
  or (
    type = 'compartido'
    and household_id is not null
    and private.is_household_member(household_id, (select auth.uid()))
  )
);

drop policy if exists "expenses_insert_allowed" on public.expenses;
create policy "expenses_insert_allowed"
on public.expenses for insert
with check (
  created_by = (select auth.uid())
  and payer_id = (select auth.uid())
  and (
    type = 'personal'
    or (
      household_id is not null
      and private.is_household_member(household_id, (select auth.uid()))
    )
  )
);

drop policy if exists "expenses_update_creator" on public.expenses;
create policy "expenses_update_creator"
on public.expenses for update
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

drop policy if exists "expenses_delete_creator" on public.expenses;
create policy "expenses_delete_creator"
on public.expenses for delete
using (created_by = (select auth.uid()));

create index if not exists expenses_payer_id_idx on public.expenses(payer_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists households_created_by_idx on public.households(created_by);

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
