-- MiFinanzas - esquema inicial para Supabase
-- Ejecutar una vez en Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nosotros',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  payer_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('personal', 'compartido')),
  my_share numeric(12,2) not null check (my_share >= 0),
  partner_share numeric(12,2) not null default 0 check (partner_share >= 0),
  created_at timestamptz not null default now(),
  constraint shared_expense_requires_household check (
    (type = 'personal' and household_id is null)
    or
    (type = 'compartido' and household_id is not null)
  )
);

create index if not exists expenses_created_by_idx on public.expenses(created_by);
create index if not exists expenses_household_id_idx on public.expenses(household_id);
create index if not exists expenses_created_at_idx on public.expenses(created_at desc);

-- Crear perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.expenses enable row level security;

-- Profiles: cada usuario ve/edita su propio perfil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Households: visibles solo para sus miembros.
drop policy if exists "households_select_member" on public.households;
create policy "households_select_member"
on public.households for select
using (
  exists (
    select 1 from public.household_members hm
    where hm.household_id = households.id
      and hm.user_id = auth.uid()
  )
);

drop policy if exists "households_insert_owner" on public.households;
create policy "households_insert_owner"
on public.households for insert
with check (created_by = auth.uid());

-- Miembros: un usuario puede ver los miembros de grupos a los que pertenece.
drop policy if exists "members_select_member" on public.household_members;
create policy "members_select_member"
on public.household_members for select
using (
  exists (
    select 1 from public.household_members mine
    where mine.household_id = household_members.household_id
      and mine.user_id = auth.uid()
  )
);

-- Permitir al creador del household agregarse y agregar a su pareja.
drop policy if exists "members_insert_household_owner" on public.household_members;
create policy "members_insert_household_owner"
on public.household_members for insert
with check (
  exists (
    select 1 from public.households h
    where h.id = household_members.household_id
      and h.created_by = auth.uid()
  )
);

-- Gastos: personales solo para su creador; compartidos para miembros del household.
drop policy if exists "expenses_select_allowed" on public.expenses;
create policy "expenses_select_allowed"
on public.expenses for select
using (
  created_by = auth.uid()
  or (
    type = 'compartido'
    and exists (
      select 1 from public.household_members hm
      where hm.household_id = expenses.household_id
        and hm.user_id = auth.uid()
    )
  )
);

drop policy if exists "expenses_insert_allowed" on public.expenses;
create policy "expenses_insert_allowed"
on public.expenses for insert
with check (
  created_by = auth.uid()
  and payer_id = auth.uid()
  and (
    type = 'personal'
    or exists (
      select 1 from public.household_members hm
      where hm.household_id = expenses.household_id
        and hm.user_id = auth.uid()
    )
  )
);

drop policy if exists "expenses_update_creator" on public.expenses;
create policy "expenses_update_creator"
on public.expenses for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "expenses_delete_creator" on public.expenses;
create policy "expenses_delete_creator"
on public.expenses for delete
using (created_by = auth.uid());

-- Realtime para que ambos vean cambios compartidos casi al instante.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'expenses'
  ) then
    alter publication supabase_realtime add table public.expenses;
  end if;
end $$;
