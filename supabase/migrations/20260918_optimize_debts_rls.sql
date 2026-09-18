drop policy if exists "debts_select_own" on public.debts;
create policy "debts_select_own"
on public.debts for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "debts_insert_own" on public.debts;
create policy "debts_insert_own"
on public.debts for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "debts_update_own" on public.debts;
create policy "debts_update_own"
on public.debts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_delete_own"
on public.debts for delete
to authenticated
using ((select auth.uid()) = user_id);
