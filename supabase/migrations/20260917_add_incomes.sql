create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists incomes_created_by_idx on public.incomes(created_by);
create index if not exists incomes_created_at_idx on public.incomes(created_at desc);

alter table public.incomes enable row level security;

drop policy if exists "incomes_select_own" on public.incomes;
create policy "incomes_select_own"
on public.incomes for select
using (created_by = (select auth.uid()));

drop policy if exists "incomes_insert_own" on public.incomes;
create policy "incomes_insert_own"
on public.incomes for insert
with check (created_by = (select auth.uid()));

drop policy if exists "incomes_update_own" on public.incomes;
create policy "incomes_update_own"
on public.incomes for update
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

drop policy if exists "incomes_delete_own" on public.incomes;
create policy "incomes_delete_own"
on public.incomes for delete
using (created_by = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'incomes'
  ) then
    alter publication supabase_realtime add table public.incomes;
  end if;
end $$;
