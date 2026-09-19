alter table public.profiles
  add column if not exists currency text not null default 'PEN',
  add column if not exists budget_alerts_enabled boolean not null default true,
  add column if not exists partner_activity_enabled boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_currency_check;

alter table public.profiles
  add constraint profiles_currency_check
  check (currency in ('PEN'));

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_profile_updated_at();
