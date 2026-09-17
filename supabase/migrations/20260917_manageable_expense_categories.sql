create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  icon text not null default '📦',
  created_at timestamptz not null default now(),
  constraint expense_categories_name_not_blank check (length(trim(name)) > 0),
  constraint expense_categories_slug_not_blank check (length(trim(slug)) > 0),
  unique (user_id, slug)
);

create index if not exists expense_categories_user_id_idx
  on public.expense_categories(user_id);

alter table public.expense_categories enable row level security;

drop policy if exists "categories_select_own" on public.expense_categories;
create policy "categories_select_own"
on public.expense_categories for select
using (user_id = (select auth.uid()));

drop policy if exists "categories_insert_own" on public.expense_categories;
create policy "categories_insert_own"
on public.expense_categories for insert
with check (user_id = (select auth.uid()));

drop policy if exists "categories_update_own" on public.expense_categories;
create policy "categories_update_own"
on public.expense_categories for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "categories_delete_own" on public.expense_categories;
create policy "categories_delete_own"
on public.expense_categories for delete
using (user_id = (select auth.uid()));

insert into public.expense_categories (user_id, slug, name, icon)
select u.id, defaults.slug, defaults.name, defaults.icon
from auth.users u
cross join (values
  ('comida', 'Comida', '🍽️'),
  ('transporte', 'Transporte', '🚕'),
  ('hogar', 'Hogar', '🏠'),
  ('ocio', 'Ocio', '🎬'),
  ('salud', 'Salud', '❤️'),
  ('compras', 'Compras', '🛍️'),
  ('servicios', 'Servicios', '💡'),
  ('educacion', 'Educación', '📚'),
  ('otros', 'Otros', '📦')
) as defaults(slug, name, icon)
on conflict (user_id, slug) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.expense_categories (user_id, slug, name, icon)
  values
    (new.id, 'comida', 'Comida', '🍽️'),
    (new.id, 'transporte', 'Transporte', '🚕'),
    (new.id, 'hogar', 'Hogar', '🏠'),
    (new.id, 'ocio', 'Ocio', '🎬'),
    (new.id, 'salud', 'Salud', '❤️'),
    (new.id, 'compras', 'Compras', '🛍️'),
    (new.id, 'servicios', 'Servicios', '💡'),
    (new.id, 'educacion', 'Educación', '📚'),
    (new.id, 'otros', 'Otros', '📦')
  on conflict (user_id, slug) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
