create type public.swipe_direction as enum ('left', 'right');

create table public.swipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stock_id uuid references public.stocks(id) on delete cascade not null,
  direction public.swipe_direction not null,
  swiped_at timestamptz default now() not null,
  unique(user_id, stock_id)
);

alter table public.swipes enable row level security;

create policy "Users can view their own swipes"
  on public.swipes for select using (auth.uid() = user_id);

create policy "Users can insert their own swipes"
  on public.swipes for insert with check (auth.uid() = user_id);

create policy "Users can delete their own swipes"
  on public.swipes for delete using (auth.uid() = user_id);
