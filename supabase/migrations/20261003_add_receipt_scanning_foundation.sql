create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  payer_id uuid not null references auth.users(id) on delete restrict,
  scope text not null default 'personal'
    check (scope = any (array['personal'::text, 'pareja'::text])),
  image_path text not null unique,
  original_filename text,
  mime_type text,
  merchant_name text,
  merchant_tax_id text,
  document_type text
    check (
      document_type is null
      or document_type = any (
        array['boleta'::text, 'factura'::text, 'ticket'::text, 'recibo'::text, 'otro'::text]
      )
    ),
  document_number text,
  issued_at timestamptz,
  subtotal numeric check (subtotal is null or subtotal >= 0),
  tax_amount numeric check (tax_amount is null or tax_amount >= 0),
  discount_amount numeric check (discount_amount is null or discount_amount >= 0),
  total_amount numeric check (total_amount is null or total_amount >= 0),
  currency text not null default 'PEN' check (char_length(currency) = 3),
  payment_method text,
  status text not null default 'pendiente_revision'
    check (
      status = any (
        array[
          'pendiente_revision'::text,
          'revisado'::text,
          'procesado'::text,
          'error'::text
        ]
      )
    ),
  extracted_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists receipts_created_by_created_at_idx
  on public.receipts (created_by, created_at desc);

create index if not exists receipts_household_created_at_idx
  on public.receipts (household_id, created_at desc)
  where household_id is not null;

alter table public.receipts enable row level security;

drop policy if exists receipts_select_accessible on public.receipts;
create policy receipts_select_accessible
on public.receipts
for select
to authenticated
using (
  created_by = auth.uid()
  or (scope = 'pareja' and private.can_view_profile(created_by))
);

drop policy if exists receipts_insert_own on public.receipts;
create policy receipts_insert_own
on public.receipts
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    (scope = 'personal' and household_id is null and payer_id = auth.uid())
    or
    (
      scope = 'pareja'
      and household_id is not null
      and exists (
        select 1
        from public.household_members hm
        where hm.household_id = receipts.household_id
          and hm.user_id = auth.uid()
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
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and (
    (scope = 'personal' and household_id is null and payer_id = auth.uid())
    or
    (
      scope = 'pareja'
      and household_id is not null
      and exists (
        select 1
        from public.household_members hm
        where hm.household_id = receipts.household_id
          and hm.user_id = auth.uid()
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
using (created_by = auth.uid());

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  line_number integer not null check (line_number > 0),
  description text not null,
  quantity numeric check (quantity is null or quantity > 0),
  unit_price numeric check (unit_price is null or unit_price >= 0),
  line_total numeric check (line_total is null or line_total >= 0),
  category text,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  expense_id uuid references public.expenses(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (receipt_id, line_number)
);

create index if not exists receipt_items_receipt_id_idx
  on public.receipt_items (receipt_id, line_number);

alter table public.receipt_items enable row level security;

drop policy if exists receipt_items_select_accessible on public.receipt_items;
create policy receipt_items_select_accessible
on public.receipt_items
for select
to authenticated
using (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_items.receipt_id
  )
);

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
      and r.created_by = auth.uid()
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
      and r.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_items.receipt_id
      and r.created_by = auth.uid()
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
      and r.created_by = auth.uid()
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'receipts',
  'receipts',
  false,
  15728640,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists receipts_storage_select_accessible on storage.objects;
create policy receipts_storage_select_accessible
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and exists (
    select 1
    from public.receipts r
    where r.image_path = storage.objects.name
  )
);

drop policy if exists receipts_storage_insert_own on storage.objects;
create policy receipts_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists receipts_storage_update_own on storage.objects;
create policy receipts_storage_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists receipts_storage_delete_own on storage.objects;
create policy receipts_storage_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);
