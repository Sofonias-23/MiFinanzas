create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('me_deben', 'debo')),
  person text not null check (length(trim(person)) > 0),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  due_date date,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists debts_user_status_idx
  on public.debts (user_id, status, created_at desc);

alter table public.debts enable row level security;

drop policy if exists "debts_select_own" on public.debts;
create policy "debts_select_own"
on public.debts for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "debts_insert_own" on public.debts;
create policy "debts_insert_own"
on public.debts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "debts_update_own" on public.debts;
create policy "debts_update_own"
on public.debts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_delete_own"
on public.debts for delete
to authenticated
using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'debts'
  ) then
    alter publication supabase_realtime add table public.debts;
  end if;
end $$;

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

  delete from public.expenses where created_by = v_uid;
  delete from public.incomes where created_by = v_uid;
  delete from public.debts where user_id = v_uid;
  delete from public.expense_categories where user_id = v_uid;
  delete from public.payment_methods where user_id = v_uid;

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
