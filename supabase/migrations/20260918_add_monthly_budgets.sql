create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('personal','pareja')),
  user_id uuid references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  month date not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_scope_owner_check check (
    (scope = 'personal' and user_id is not null and household_id is null)
    or
    (scope = 'pareja' and household_id is not null and user_id is null)
  ),
  constraint budgets_month_first_day_check check (
    month = date_trunc('month', month)::date
  )
);

create unique index if not exists budgets_personal_unique_idx
  on public.budgets (user_id, month, category)
  where scope = 'personal';

create unique index if not exists budgets_partner_unique_idx
  on public.budgets (household_id, month, category)
  where scope = 'pareja';

create index if not exists budgets_household_idx
  on public.budgets (household_id);

create index if not exists budgets_created_by_idx
  on public.budgets (created_by);

alter table public.budgets enable row level security;

drop policy if exists "budgets_select_allowed" on public.budgets;
create policy "budgets_select_allowed"
on public.budgets
for select
to authenticated
using (
  (scope = 'personal' and user_id = (select auth.uid()))
  or
  (scope = 'pareja' and household_id is not null
   and private.is_household_member(household_id, (select auth.uid())))
);

drop policy if exists "budgets_insert_allowed" on public.budgets;
create policy "budgets_insert_allowed"
on public.budgets
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (scope = 'personal' and user_id = (select auth.uid()) and household_id is null)
    or
    (scope = 'pareja' and user_id is null and household_id is not null
     and private.is_household_member(household_id, (select auth.uid())))
  )
);

drop policy if exists "budgets_update_allowed" on public.budgets;
create policy "budgets_update_allowed"
on public.budgets
for update
to authenticated
using (
  (scope = 'personal' and user_id = (select auth.uid()))
  or
  (scope = 'pareja' and household_id is not null
   and private.is_household_member(household_id, (select auth.uid())))
)
with check (
  (scope = 'personal' and user_id = (select auth.uid()) and household_id is null)
  or
  (scope = 'pareja' and user_id is null and household_id is not null
   and private.is_household_member(household_id, (select auth.uid())))
);

drop policy if exists "budgets_delete_allowed" on public.budgets;
create policy "budgets_delete_allowed"
on public.budgets
for delete
to authenticated
using (
  (scope = 'personal' and user_id = (select auth.uid()))
  or
  (scope = 'pareja' and household_id is not null
   and private.is_household_member(household_id, (select auth.uid())))
);

alter publication supabase_realtime add table public.budgets;

create or replace function public.reset_my_finance_data()
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  delete from public.expenses
  where created_by = v_uid
    and type = 'personal';

  delete from public.incomes
  where created_by = v_uid;

  delete from public.debts
  where user_id = v_uid;

  delete from public.budgets
  where scope = 'personal'
    and user_id = v_uid;

  delete from public.expense_categories
  where user_id = v_uid;

  delete from public.payment_methods
  where user_id = v_uid;

  insert into public.expense_categories (user_id, slug, name, icon)
  values
    (v_uid, 'comida', 'Comida', '🍽️'),
    (v_uid, 'transporte', 'Transporte', '🚕'),
    (v_uid, 'hogar', 'Hogar', '🏠'),
    (v_uid, 'ocio', 'Ocio', '🎬'),
    (v_uid, 'salud', 'Salud', '❤️'),
    (v_uid, 'compras', 'Compras', '🛍️'),
    (v_uid, 'servicios', 'Servicios', '💡'),
    (v_uid, 'educacion', 'Educación', '📚'),
    (v_uid, 'otros', 'Otros', '📦')
  on conflict (user_id, slug) do nothing;

  insert into public.payment_methods (user_id, slug, name, icon)
  values
    (v_uid, 'efectivo', 'Efectivo', '💵'),
    (v_uid, 'yape', 'Yape', '📱'),
    (v_uid, 'plin', 'Plin', '📲'),
    (v_uid, 'debito', 'Débito', '💳'),
    (v_uid, 'credito', 'Crédito', '💳'),
    (v_uid, 'transferencia', 'Transferencia', '🏦'),
    (v_uid, 'sin-especificar', 'Sin especificar', '❔')
  on conflict (user_id, slug) do nothing;
end;
$$;

revoke all on function public.reset_my_finance_data() from public, anon;
grant execute on function public.reset_my_finance_data() to authenticated;
