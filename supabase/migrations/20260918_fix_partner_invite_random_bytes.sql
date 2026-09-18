create or replace function public.create_partner_invite()
returns text
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
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

  select count(*)
    into v_members
  from public.household_members hm
  where hm.household_id = v_household_id;

  if v_members >= 2 then
    raise exception 'Este grupo ya tiene dos personas vinculadas.';
  end if;

  delete from private.household_invites
  where household_id = v_household_id
    and used_at is null;

  loop
    v_code := upper(encode(extensions.gen_random_bytes(4), 'hex'));
    exit when not exists (
      select 1
      from private.household_invites i
      where i.code = v_code
    );
  end loop;

  insert into private.household_invites (
    code,
    household_id,
    created_by,
    expires_at
  )
  values (
    v_code,
    v_household_id,
    v_uid,
    now() + interval '7 days'
  );

  return v_code;
end;
$$;

revoke all on function public.create_partner_invite() from public, anon;
grant execute on function public.create_partner_invite() to authenticated;
