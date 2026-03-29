-- Add cash_balance to profiles (cross-device persistence)
alter table public.profiles
  add column if not exists cash_balance numeric(18, 4) not null default 0;

-- Drop old portfolio table (used stock_id FK, never wired up in the app)
drop table if exists public.portfolio;

-- New holdings table (matches watchlist pattern: ticker text, not a foreign key)
create table public.holdings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  ticker     text not null,
  shares     numeric(18, 8) not null default 0,
  avg_cost   numeric(12, 4) not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, ticker)
);

alter table public.holdings enable row level security;

create policy "Users manage own holdings"
  on public.holdings for all using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger holdings_updated_at
  before update on public.holdings
  for each row execute procedure public.set_updated_at();
