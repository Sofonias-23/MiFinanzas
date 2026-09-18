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

  -- Solo elimina gastos personales creados por el usuario.
  -- Los gastos compartidos se conservan para no afectar el historial de Pareja.
  delete from public.expenses
  where created_by = v_uid
    and type = 'personal';

  delete from public.incomes
  where created_by = v_uid;

  delete from public.debts
  where user_id = v_uid;

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
