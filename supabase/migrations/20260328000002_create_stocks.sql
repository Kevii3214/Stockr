create table public.stocks (
  id uuid default gen_random_uuid() primary key,
  ticker text not null unique,
  company_name text not null,
  sector text,
  price numeric(12, 4),
  market_cap bigint,
  description text,
  created_at timestamptz default now() not null
);

alter table public.stocks enable row level security;

create policy "Stocks are publicly readable"
  on public.stocks for select using (true);
