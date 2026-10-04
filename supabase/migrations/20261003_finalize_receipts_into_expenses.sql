create or replace function public.finalize_receipt(p_receipt_id uuid)
returns table(expense_count integer, registered_total numeric)
language plpgsql
security invoker
set search_path = public
as $$
declare
  r public.receipts%rowtype;
  item record;
  v_item_sum numeric := 0;
  v_target_total numeric := 0;
  v_running_total numeric := 0;
  v_amount numeric := 0;
  v_expense_id uuid;
  v_count integer := 0;
  v_type text;
  v_category text;
  v_my_share numeric;
  v_partner_share numeric;
  v_description text;
  v_created_at timestamptz;
  v_usable_count integer := 0;
  v_index integer := 0;
begin
  select *
    into r
    from public.receipts
   where id = p_receipt_id
     and created_by = auth.uid()
   for update;

  if not found then
    raise exception 'Comprobante no encontrado o sin permiso';
  end if;

  if r.status = 'procesado' then
    return query select 0, coalesce(r.total_amount, 0::numeric);
    return;
  end if;

  select
    coalesce(sum(
      case
        when line_total is not null and line_total > 0 then line_total
        when unit_price is not null and unit_price > 0 and quantity is not null and quantity > 0
          then unit_price * quantity
        when unit_price is not null and unit_price > 0 then unit_price
        else 0
      end
    ), 0),
    count(*) filter (
      where
        (line_total is not null and line_total > 0)
        or (unit_price is not null and unit_price > 0)
    )
  into v_item_sum, v_usable_count
  from public.receipt_items
  where receipt_id = r.id;

  v_target_total := case
    when r.total_amount is not null and r.total_amount > 0 then round(r.total_amount, 2)
    when v_item_sum > 0 then round(v_item_sum, 2)
    else 0
  end;

  if v_target_total <= 0 then
    raise exception 'El comprobante no tiene un total válido para registrar';
  end if;

  v_type := case when r.scope = 'pareja' then 'compartido' else 'personal' end;
  v_created_at := coalesce(r.issued_at, now());

  if v_usable_count > 0 and v_item_sum > 0 then
    for item in
      select
        id,
        description,
        quantity,
        unit_price,
        line_total,
        category,
        case
          when line_total is not null and line_total > 0 then line_total
          when unit_price is not null and unit_price > 0 and quantity is not null and quantity > 0
            then unit_price * quantity
          when unit_price is not null and unit_price > 0 then unit_price
          else 0
        end as base_amount
      from public.receipt_items
      where receipt_id = r.id
        and (
          (line_total is not null and line_total > 0)
          or (unit_price is not null and unit_price > 0)
        )
      order by line_number
    loop
      v_index := v_index + 1;

      if v_index = v_usable_count then
        v_amount := round(v_target_total - v_running_total, 2);
      else
        v_amount := round(v_target_total * item.base_amount / v_item_sum, 2);
      end if;

      if v_amount <= 0 then
        continue;
      end if;

      select c.slug
        into v_category
        from public.expense_categories c
       where c.user_id = auth.uid()
         and c.slug = item.category
       limit 1;

      v_category := coalesce(v_category, 'otros');

      v_description := trim(
        both ' ' from
        concat_ws(' · ', nullif(trim(r.merchant_name), ''), nullif(trim(item.description), ''))
      );
      if v_description = '' then
        v_description := coalesce(nullif(trim(r.merchant_name), ''), 'Comprobante');
      end if;

      if v_type = 'compartido' then
        v_my_share := round(v_amount / 2, 2);
        v_partner_share := round(v_amount - v_my_share, 2);
      else
        v_my_share := v_amount;
        v_partner_share := 0;
      end if;

      insert into public.expenses (
        created_by,
        payer_id,
        household_id,
        description,
        amount,
        type,
        category,
        payment_method,
        my_share,
        partner_share,
        created_at
      )
      values (
        auth.uid(),
        case when v_type = 'personal' then auth.uid() else r.payer_id end,
        case when v_type = 'personal' then null else r.household_id end,
        v_description,
        v_amount,
        v_type,
        v_category,
        coalesce(nullif(r.payment_method, ''), 'sin-especificar'),
        v_my_share,
        v_partner_share,
        v_created_at
      )
      returning id into v_expense_id;

      update public.receipt_items
         set expense_id = v_expense_id
       where id = item.id;

      v_running_total := v_running_total + v_amount;
      v_count := v_count + 1;
    end loop;
  else
    v_description := coalesce(nullif(trim(r.merchant_name), ''), 'Comprobante');

    if v_type = 'compartido' then
      v_my_share := round(v_target_total / 2, 2);
      v_partner_share := round(v_target_total - v_my_share, 2);
    else
      v_my_share := v_target_total;
      v_partner_share := 0;
    end if;

    insert into public.expenses (
      created_by,
      payer_id,
      household_id,
      description,
      amount,
      type,
      category,
      payment_method,
      my_share,
      partner_share,
      created_at
    )
    values (
      auth.uid(),
      case when v_type = 'personal' then auth.uid() else r.payer_id end,
      case when v_type = 'personal' then null else r.household_id end,
      v_description,
      v_target_total,
      v_type,
      'otros',
      coalesce(nullif(r.payment_method, ''), 'sin-especificar'),
      v_my_share,
      v_partner_share,
      v_created_at
    );

    v_count := 1;
    v_running_total := v_target_total;
  end if;

  update public.receipts
     set status = 'procesado',
         updated_at = now()
   where id = r.id;

  return query select v_count, round(v_running_total, 2);
end;
$$;

revoke all on function public.finalize_receipt(uuid) from public;
grant execute on function public.finalize_receipt(uuid) to authenticated;
