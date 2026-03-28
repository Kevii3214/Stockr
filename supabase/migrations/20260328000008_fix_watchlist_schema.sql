-- Drop and recreate watchlist with correct schema
-- (previous table existed with wrong columns)
drop table if exists watchlist;

create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  ticker text not null,
  added_at timestamptz default now(),
  unique(user_id, ticker)
);

alter table watchlist enable row level security;

drop policy if exists "Users manage own watchlist" on watchlist;

create policy "Users manage own watchlist" on watchlist
  for all using (auth.uid() = user_id);
