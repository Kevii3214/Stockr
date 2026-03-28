create table public.stock_fundamentals (
  ticker          text primary key,
  week_high_52    numeric(12, 4),
  week_low_52     numeric(12, 4),
  pe_ratio        numeric(10, 4),
  market_cap      numeric(18, 4),   -- in millions (Finnhub units)
  eps             numeric(10, 4),
  beta            numeric(8, 4),
  dividend_yield  numeric(8, 4),    -- in % (Finnhub units)
  avg_volume_10d  numeric(18, 4),   -- in millions (Finnhub units)
  updated_at      timestamptz default now() not null
);

alter table public.stock_fundamentals enable row level security;

create policy "Fundamentals are publicly readable"
  on public.stock_fundamentals for select using (true);

create policy "Service role can write fundamentals"
  on public.stock_fundamentals for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
