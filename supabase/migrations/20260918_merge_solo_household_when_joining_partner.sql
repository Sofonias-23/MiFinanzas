create or replace function public.join_household_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_household_id uuid;
  v_created_by uuid;
  v_expires_at timestamptz;
  v_used_at timestamptz;
  v_existing_household uuid;
  v_existing_members integer;
  v_target_members integer;
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

  select hm.household_id
    into v_existing_household
  from public.household_members hm
  where hm.user_id = v_uid
  limit 1;

  if v_existing_household = v_household_id then
    update private.household_invites
    set used_by = v_uid,
        used_at = now()
    where code = v_code;

    return v_household_id;
  end if;

  select count(*)::integer
    into v_target_members
  from public.household_members hm
  where hm.household_id = v_household_id;

  if v_target_members >= 2 then
    raise exception 'Este grupo ya tiene dos personas vinculadas.';
  end if;

  if v_existing_household is not null then
    select count(*)::integer
      into v_existing_members
    from public.household_members hm
    where hm.household_id = v_existing_household;

    if v_existing_members > 1 then
      raise exception 'Tu cuenta ya pertenece a otro grupo con otra persona.';
    end if;

    update public.expenses
    set household_id = v_household_id
    where household_id = v_existing_household
      and type = 'compartido';

    delete from private.household_invites
    where household_id = v_existing_household;

    delete from public.household_members
    where household_id = v_existing_household
      and user_id = v_uid;

    delete from public.households
    where id = v_existing_household;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'member')
  on conflict (household_id, user_id) do nothing;

  update private.household_invites
  set used_by = v_uid,
      used_at = now()
  where code = v_code;

  return v_household_id;
end;
$$;

revoke all on function public.join_household_by_code(text) from public, anon;
grant execute on function public.join_household_by_code(text) to authenticated;
