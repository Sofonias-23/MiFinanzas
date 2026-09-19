drop policy if exists "expenses_update_creator" on public.expenses;

create policy "expenses_update_creator"
on public.expenses
for update
to authenticated
using (
  created_by = (select auth.uid())
)
with check (
  created_by = (select auth.uid())
  and amount > 0
  and my_share >= 0
  and partner_share >= 0
  and abs((my_share + partner_share) - amount) <= 0.01
  and (
    (
      type = 'personal'
      and payer_id = (select auth.uid())
      and household_id is null
      and partner_share = 0
      and abs(my_share - amount) <= 0.01
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
