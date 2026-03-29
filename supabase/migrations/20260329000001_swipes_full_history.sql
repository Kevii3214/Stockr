-- Allow multiple swipe records per user/stock (full history instead of last-only)
alter table public.swipes drop constraint if exists swipes_user_id_stock_id_key;

-- Efficient index for loading a user's swipe history ordered by recency
create index if not exists swipes_user_swiped_at_idx
  on public.swipes (user_id, swiped_at desc);
