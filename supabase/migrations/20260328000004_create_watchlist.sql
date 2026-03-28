create table public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stock_id uuid references public.stocks(id) on delete cascade not null,
  added_at timestamptz default now() not null,
  unique(user_id, stock_id)
);

alter table public.watchlist enable row level security;

create policy "Users can view their own watchlist"
  on public.watchlist for select using (auth.uid() = user_id);

create policy "Users can insert into their own watchlist"
  on public.watchlist for insert with check (auth.uid() = user_id);

create policy "Users can remove from their own watchlist"
  on public.watchlist for delete using (auth.uid() = user_id);
