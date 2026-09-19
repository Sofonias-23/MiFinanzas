create table if not exists public.partner_settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  payer_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'efectivo',
  note text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint partner_settlements_distinct_people check (payer_id <> receiver_id)
);

create index if not exists partner_settlements_household_created_idx
  on public.partner_settlements (household_id, created_at desc);

alter table public.partner_settlements enable row level security;

drop policy if exists "partner_settlements_select_member" on public.partner_settlements;
create policy "partner_settlements_select_member"
on public.partner_settlements
for select
to authenticated
using (
  private.is_household_member(household_id, (select auth.uid()))
);

alter publication supabase_realtime add table public.partner_settlements;

create or replace function public.record_partner_settlement(
  p_amount numeric,
  p_payment_method text default 'efectivo',
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_household_id uuid;
  v_partner_id uuid;
  v_balance numeric(12,2) := 0;
  v_expense_balance numeric(12,2) := 0;
  v_settlement_balance numeric(12,2) := 0;
  v_id uuid;
  v_method text := nullif(trim(coalesce(p_payment_method, '')), '');
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto debe ser mayor a cero.';
  end if;

  select hm.household_id
    into v_household_id
  from public.household_members hm
  where hm.user_id = v_uid
  limit 1;

  if v_household_id is null then
    raise exception 'No tienes una pareja vinculada.';
  end if;

  select hm.user_id
    into v_partner_id
  from public.household_members hm
  where hm.household_id = v_household_id
    and hm.user_id <> v_uid
  limit 1;

  if v_partner_id is null then
    raise exception 'No tienes una pareja vinculada.';
  end if;

  select coalesce(sum(
    case
      when e.created_by = v_uid and e.payer_id = v_uid
        then e.amount - e.my_share
      when e.created_by = v_uid and e.payer_id <> v_uid
        then -e.my_share
      when e.created_by <> v_uid and e.payer_id = v_uid
        then e.amount - e.partner_share
      else -e.partner_share
    end
  ), 0)
  into v_expense_balance
  from public.expenses e
  where e.household_id = v_household_id
    and e.type = 'compartido';

  select coalesce(sum(
    case
      when s.payer_id = v_uid then s.amount
      when s.receiver_id = v_uid then -s.amount
      else 0
    end
  ), 0)
  into v_settlement_balance
  from public.partner_settlements s
  where s.household_id = v_household_id;

  v_balance := round((v_expense_balance + v_settlement_balance)::numeric, 2);

  if abs(v_balance) < 0.01 then
    raise exception 'No hay saldo pendiente entre ustedes.';
  end if;

  if round(p_amount::numeric, 2) > abs(v_balance) then
    raise exception 'El pago no puede superar el saldo pendiente de S/ %.', to_char(abs(v_balance), 'FM999999990.00');
  end if;

  if v_method is null then
    v_method := 'efectivo';
  end if;

  if v_balance < 0 then
    insert into public.partner_settlements (
      household_id,
      payer_id,
      receiver_id,
      amount,
      payment_method,
      note,
      created_by
    )
    values (
      v_household_id,
      v_uid,
      v_partner_id,
      round(p_amount::numeric, 2),
      v_method,
      nullif(trim(coalesce(p_note, '')), ''),
      v_uid
    )
    returning id into v_id;
  else
    insert into public.partner_settlements (
      household_id,
      payer_id,
      receiver_id,
      amount,
      payment_method,
      note,
      created_by
    )
    values (
      v_household_id,
      v_partner_id,
      v_uid,
      round(p_amount::numeric, 2),
      v_method,
      nullif(trim(coalesce(p_note, '')), ''),
      v_uid
    )
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.record_partner_settlement(numeric, text, text) from public, anon;
grant execute on function public.record_partner_settlement(numeric, text, text) to authenticated;
