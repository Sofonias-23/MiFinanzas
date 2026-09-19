create table if not exists public.expense_comments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists expense_comments_expense_created_idx
  on public.expense_comments (expense_id, created_at);

create index if not exists expense_comments_author_idx
  on public.expense_comments (author_id);

alter table public.expense_comments enable row level security;

drop policy if exists "expense_comments_select_shared" on public.expense_comments;
create policy "expense_comments_select_shared"
on public.expense_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.expenses e
    where e.id = expense_comments.expense_id
      and e.type = 'compartido'
      and e.household_id is not null
      and private.is_household_member(e.household_id, (select auth.uid()))
  )
);

drop policy if exists "expense_comments_insert_shared" on public.expense_comments;
create policy "expense_comments_insert_shared"
on public.expense_comments
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.expenses e
    where e.id = expense_comments.expense_id
      and e.type = 'compartido'
      and e.household_id is not null
      and private.is_household_member(e.household_id, (select auth.uid()))
  )
);

drop policy if exists "expense_comments_delete_own" on public.expense_comments;
create policy "expense_comments_delete_own"
on public.expense_comments
for delete
to authenticated
using (author_id = (select auth.uid()));

create table if not exists public.expense_reactions (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('👍','❤️','😂','🎉','👀')),
  created_at timestamptz not null default now(),
  unique (expense_id, user_id)
);

create index if not exists expense_reactions_expense_idx
  on public.expense_reactions (expense_id);

create index if not exists expense_reactions_user_idx
  on public.expense_reactions (user_id);

alter table public.expense_reactions enable row level security;

drop policy if exists "expense_reactions_select_shared" on public.expense_reactions;
create policy "expense_reactions_select_shared"
on public.expense_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.expenses e
    where e.id = expense_reactions.expense_id
      and e.type = 'compartido'
      and e.household_id is not null
      and private.is_household_member(e.household_id, (select auth.uid()))
  )
);

drop policy if exists "expense_reactions_insert_own" on public.expense_reactions;
create policy "expense_reactions_insert_own"
on public.expense_reactions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.expenses e
    where e.id = expense_reactions.expense_id
      and e.type = 'compartido'
      and e.household_id is not null
      and private.is_household_member(e.household_id, (select auth.uid()))
  )
);

drop policy if exists "expense_reactions_update_own" on public.expense_reactions;
create policy "expense_reactions_update_own"
on public.expense_reactions
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "expense_reactions_delete_own" on public.expense_reactions;
create policy "expense_reactions_delete_own"
on public.expense_reactions
for delete
to authenticated
using (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.expense_comments;
alter publication supabase_realtime add table public.expense_reactions;
