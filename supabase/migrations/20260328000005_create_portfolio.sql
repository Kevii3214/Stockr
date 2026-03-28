create table public.portfolio (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stock_id uuid references public.stocks(id) on delete cascade not null,
  shares numeric(18, 8) not null default 0,
  avg_cost numeric(12, 4) not null default 0,
  added_at timestamptz default now() not null,
  unique(user_id, stock_id)
);

alter table public.portfolio enable row level security;

create policy "Users can view their own portfolio"
  on public.portfolio for select using (auth.uid() = user_id);

create policy "Users can insert into their own portfolio"
  on public.portfolio for insert with check (auth.uid() = user_id);

create policy "Users can update their own portfolio"
  on public.portfolio for update using (auth.uid() = user_id);

create policy "Users can remove from their own portfolio"
  on public.portfolio for delete using (auth.uid() = user_id);
