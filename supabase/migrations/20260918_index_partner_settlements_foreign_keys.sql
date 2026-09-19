create index if not exists partner_settlements_payer_idx
  on public.partner_settlements (payer_id);

create index if not exists partner_settlements_receiver_idx
  on public.partner_settlements (receiver_id);

create index if not exists partner_settlements_created_by_idx
  on public.partner_settlements (created_by);
