create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  icon text not null default '💳',
  created_at timestamptz not null default now(),
  constraint payment_methods_name_not_blank check (length(trim(name)) > 0),
  constraint payment_methods_slug_not_blank check (length(trim(slug)) > 0),
  unique (user_id, slug)
);

create index if not exists payment_methods_user_id_idx
  on public.payment_methods(user_id);

alter table public.payment_methods enable row level security;

drop policy if exists "payment_methods_select_own" on public.payment_methods;
create policy "payment_methods_select_own"
on public.payment_methods for select
using (user_id = (select auth.uid()));

drop policy if exists "payment_methods_insert_own" on public.payment_methods;
create policy "payment_methods_insert_own"
on public.payment_methods for insert
with check (user_id = (select auth.uid()));

drop policy if exists "payment_methods_update_own" on public.payment_methods;
create policy "payment_methods_update_own"
on public.payment_methods for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "payment_methods_delete_own" on public.payment_methods;
create policy "payment_methods_delete_own"
on public.payment_methods for delete
using (user_id = (select auth.uid()));

alter table public.expenses
  add column if not exists payment_method text;

update public.expenses
set payment_method = 'sin-especificar'
where payment_method is null or btrim(payment_method) = '';

alter table public.expenses alter column payment_method set default 'sin-especificar';
alter table public.expenses alter column payment_method set not null;

create index if not exists expenses_payment_method_idx
  on public.expenses(payment_method);

insert into public.payment_methods (user_id, slug, name, icon)
select u.id, defaults.slug, defaults.name, defaults.icon
from auth.users u
cross join (values
  ('efectivo', 'Efectivo', '💵'),
  ('yape', 'Yape', '📱'),
  ('plin', 'Plin', '📲'),
  ('debito', 'Débito', '💳'),
  ('credito', 'Crédito', '💳'),
  ('transferencia', 'Transferencia', '🏦'),
  ('sin-especificar', 'Sin especificar', '❔')
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

  insert into public.payment_methods (user_id, slug, name, icon)
  values
    (new.id, 'efectivo', 'Efectivo', '💵'),
    (new.id, 'yape', 'Yape', '📱'),
    (new.id, 'plin', 'Plin', '📲'),
    (new.id, 'debito', 'Débito', '💳'),
    (new.id, 'credito', 'Crédito', '💳'),
    (new.id, 'transferencia', 'Transferencia', '🏦'),
    (new.id, 'sin-especificar', 'Sin especificar', '❔')
  on conflict (user_id, slug) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'payment_methods'
  ) then
    alter publication supabase_realtime add table public.payment_methods;
  end if;
end $$;
