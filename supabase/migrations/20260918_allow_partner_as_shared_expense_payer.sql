drop policy if exists "expenses_insert_allowed" on public.expenses;

create policy "expenses_insert_allowed"
on public.expenses for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (
      type = 'personal'
      and payer_id = (select auth.uid())
      and household_id is null
    )
    or
    (
      type = 'compartido'
      and household_id is not null
      and private.is_household_member(household_id, (select auth.uid()))
      and private.is_household_member(household_id, payer_id)
    )
  )
);
