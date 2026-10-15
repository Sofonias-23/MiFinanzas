create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  subject text not null default 'Consulta general',
  message text not null,
  source text not null default 'web',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Public can submit contact messages" on public.contact_messages;

create policy "Public can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (
  char_length(btrim(email)) between 5 and 254
  and char_length(btrim(subject)) between 2 and 80
  and char_length(btrim(message)) between 10 and 4000
  and (name is null or char_length(btrim(name)) <= 100)
  and source in ('web', 'mobile')
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages(created_at desc);
