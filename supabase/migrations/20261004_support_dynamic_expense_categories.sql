alter table public.expenses
  drop constraint if exists expenses_category_check;

create or replace function private.validate_expense_category()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.category is null or btrim(new.category) = '' then
    raise exception using
      errcode = '23514',
      message = 'Selecciona una categoría válida.';
  end if;

  if not exists (
    select 1
    from public.expense_categories c
    where c.user_id = new.created_by
      and c.slug = new.category
  ) then
    raise exception using
      errcode = '23514',
      message = format('La categoría "%s" no existe para este usuario.', new.category);
  end if;

  return new;
end;
$$;

drop trigger if exists validate_expense_category_trigger on public.expenses;

create trigger validate_expense_category_trigger
before insert or update of category, created_by
on public.expenses
for each row
execute function private.validate_expense_category();
