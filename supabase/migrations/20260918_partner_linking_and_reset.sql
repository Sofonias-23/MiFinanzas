create unique index if not exists household_members_one_household_per_user_uidx
  on public.household_members(user_id);

create table if not exists private.household_invites (
  code text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists household_invites_household_id_idx
  on private.household_invites(household_id);

create index if not exists household_invites_created_by_idx
  on private.household_invites(created_by);

create or replace function public.ensure_my_household()
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_household_id uuid;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_uid
  limit 1;

  if v_household_id is not null then
    return v_household_id;
  end if;

  insert into public.households (name, created_by)
  values ('Nosotros', v_uid)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'owner');

  return v_household_id;
end;
$$;

create or replace function public.create_partner_invite()
returns text
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_household_id uuid;
  v_code text;
  v_members integer;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  v_household_id := public.ensure_my_household();

  select count(*) into v_members
  from public.household_members hm
  where hm.household_id = v_household_id;

  if v_members >= 2 then
    raise exception 'Este grupo ya tiene dos personas vinculadas.';
  end if;

  delete from private.household_invites
  where household_id = v_household_id and used_at is null;

  loop
    v_code := upper(encode(gen_random_bytes(4), 'hex'));
    exit when not exists (
      select 1 from private.household_invites i where i.code = v_code
    );
  end loop;

  insert into private.household_invites (code, household_id, created_by, expires_at)
  values (v_code, v_household_id, v_uid, now() + interval '7 days');

  return v_code;
end;
$$;

create or replace function public.join_household_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_household_id uuid;
  v_created_by uuid;
  v_expires_at timestamptz;
  v_used_at timestamptz;
  v_existing_household uuid;
  v_members integer;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  if v_code is null or length(v_code) <> 8 then
    raise exception 'El código de invitación no es válido.';
  end if;

  select i.household_id, i.created_by, i.expires_at, i.used_at
    into v_household_id, v_created_by, v_expires_at, v_used_at
  from private.household_invites i
  where i.code = v_code
  for update;

  if not found then
    raise exception 'No encontramos ese código de invitación.';
  end if;

  if v_used_at is not null then
    raise exception 'Este código ya fue utilizado.';
  end if;

  if v_expires_at <= now() then
    raise exception 'Este código ya venció. Genera uno nuevo.';
  end if;

  if v_created_by = v_uid then
    raise exception 'No puedes usar tu propio código de invitación.';
  end if;

  select hm.household_id into v_existing_household
  from public.household_members hm
  where hm.user_id = v_uid
  limit 1;

  if v_existing_household is not null then
    if v_existing_household = v_household_id then
      return v_household_id;
    end if;
    raise exception 'Tu cuenta ya pertenece a otro grupo.';
  end if;

  select count(*) into v_members
  from public.household_members hm
  where hm.household_id = v_household_id;

  if v_members >= 2 then
    raise exception 'Este grupo ya tiene dos personas vinculadas.';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'member');

  update private.household_invites
  set used_by = v_uid, used_at = now()
  where code = v_code;

  return v_household_id;
end;
$$;

create or replace function public.get_partner_status()
returns table (
  household_id uuid,
  my_role text,
  partner_name text,
  member_count integer,
  invite_code text
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_household_id uuid;
  v_role text;
  v_partner_name text;
  v_member_count integer;
  v_invite_code text;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select hm.household_id, hm.role
    into v_household_id, v_role
  from public.household_members hm
  where hm.user_id = v_uid
  limit 1;

  if v_household_id is null then
    return query
    select null::uuid, null::text, null::text, 0::integer, null::text;
    return;
  end if;

  select count(*)::integer into v_member_count
  from public.household_members hm
  where hm.household_id = v_household_id;

  select coalesce(p.display_name, 'Pareja') into v_partner_name
  from public.household_members hm
  left join public.profiles p on p.id = hm.user_id
  where hm.household_id = v_household_id and hm.user_id <> v_uid
  limit 1;

  select i.code into v_invite_code
  from private.household_invites i
  where i.household_id = v_household_id
    and i.created_by = v_uid
    and i.used_at is null
    and i.expires_at > now()
  order by i.created_at desc
  limit 1;

  return query
  select v_household_id, v_role, v_partner_name, v_member_count, v_invite_code;
end;
$$;

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

revoke all on function public.ensure_my_household() from public;
revoke all on function public.ensure_my_household() from anon;
grant execute on function public.ensure_my_household() to authenticated;

revoke all on function public.create_partner_invite() from public;
revoke all on function public.create_partner_invite() from anon;
grant execute on function public.create_partner_invite() to authenticated;

revoke all on function public.join_household_by_code(text) from public;
revoke all on function public.join_household_by_code(text) from anon;
grant execute on function public.join_household_by_code(text) to authenticated;

revoke all on function public.get_partner_status() from public;
revoke all on function public.get_partner_status() from anon;
grant execute on function public.get_partner_status() to authenticated;

revoke all on function public.reset_my_finance_data() from public;
revoke all on function public.reset_my_finance_data() from anon;
grant execute on function public.reset_my_finance_data() to authenticated;
