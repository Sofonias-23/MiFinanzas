alter table public.expenses
  add column if not exists category text not null default 'otros';

update public.expenses
set category = 'otros'
where category is null or btrim(category) = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_category_check'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_category_check
      check (category in ('comida','transporte','hogar','ocio','salud','compras','servicios','educacion','otros'));
  end if;
end $$;

create index if not exists expenses_category_idx on public.expenses(category);
