-- no-op: table already exists with wrong schema; fixed in migration 20260328000008
create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  ticker text not null,
  added_at timestamptz default now(),
  unique(user_id, ticker)
);

alter table watchlist enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'watchlist' and policyname = 'Users manage own watchlist'
  ) then
    execute 'create policy "Users manage own watchlist" on watchlist for all using (auth.uid() = user_id)';
  end if;
end $$;
