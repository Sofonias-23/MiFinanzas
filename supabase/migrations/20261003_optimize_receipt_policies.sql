create index if not exists receipts_payer_id_idx
  on public.receipts (payer_id);

create index if not exists receipt_items_expense_id_idx
  on public.receipt_items (expense_id)
  where expense_id is not null;

drop policy if exists receipts_select_accessible on public.receipts;
create policy receipts_select_accessible
on public.receipts
for select
to authenticated
using (
  created_by = (select auth.uid())
  or (
    scope = 'pareja'
    and private.can_view_profile(created_by)
  )
);

drop policy if exists receipts_insert_own on public.receipts;
create policy receipts_insert_own
on public.receipts
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (
      scope = 'personal'
      and household_id is null
      and payer_id = (select auth.uid())
    )
    or
    (
      scope = 'pareja'
      and household_id is not null
      and exists (
        select 1
        from public.household_members hm
        where hm.household_id = receipts.household_id
          and hm.user_id = (select auth.uid())
      )
      and exists (
        select 1
        from public.household_members hp
        where hp.household_id = receipts.household_id
          and hp.user_id = receipts.payer_id
      )
    )
  )
);

drop policy if exists receipts_update_own on public.receipts;
create policy receipts_update_own
on public.receipts
for update
to authenticated
using (created_by = (select auth.uid()))
with check (
  created_by = (select auth.uid())
  and (
    (
      scope = 'personal'
      and household_id is null
      and payer_id = (select auth.uid())
    )
    or
    (
      scope = 'pareja'
      and household_id is not null
      and exists (
        select 1
        from public.household_members hm
        where hm.household_id = receipts.household_id
          and hm.user_id = (select auth.uid())
      )
      and exists (
        select 1
        from public.household_members hp
        where hp.household_id = receipts.household_id
          and hp.user_id = receipts.payer_id
      )
    )
  )
);

drop policy if exists receipts_delete_own on public.receipts;
create policy receipts_delete_own
on public.receipts
for delete
to authenticated
using (created_by = (select auth.uid()));

drop policy if exists receipt_items_insert_owner on public.receipt_items;
create policy receipt_items_insert_owner
on public.receipt_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_items.receipt_id
      and r.created_by = (select auth.uid())
  )
);

drop policy if exists receipt_items_update_owner on public.receipt_items;
create policy receipt_items_update_owner
on public.receipt_items
for update
to authenticated
using (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_items.receipt_id
      and r.created_by = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_items.receipt_id
      and r.created_by = (select auth.uid())
  )
);

drop policy if exists receipt_items_delete_owner on public.receipt_items;
create policy receipt_items_delete_owner
on public.receipt_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_items.receipt_id
      and r.created_by = (select auth.uid())
  )
);

drop policy if exists receipts_storage_insert_own on storage.objects;
create policy receipts_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

drop policy if exists receipts_storage_update_own on storage.objects;
create policy receipts_storage_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = (select auth.uid())::text
)
with check (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

drop policy if exists receipts_storage_delete_own on storage.objects;
create policy receipts_storage_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = (select auth.uid())::text
);
