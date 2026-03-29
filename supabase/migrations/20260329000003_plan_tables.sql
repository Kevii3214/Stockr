-- ─── user_plans ───────────────────────────────────────────────────────────────
create table public.user_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  experience   text not null,
  style        text not null,
  horizon      text not null,
  risk         text not null,
  goal         text not null,
  budget       text not null,
  sectors      text[] not null default '{}',
  plan_title   text not null default '',
  plan_summary text not null default '',
  xp_total     integer not null default 0,
  level        integer not null default 1,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(user_id)
);

alter table public.user_plans enable row level security;

create policy "Users manage own plans"
  on public.user_plans for all using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_plans_updated_at
  before update on public.user_plans
  for each row execute procedure public.set_updated_at();

-- ─── plan_tasks ───────────────────────────────────────────────────────────────
create table public.plan_tasks (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid references public.user_plans(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  task_key     text not null,
  category     text not null,
  title        text not null,
  description  text not null,
  xp_reward    integer not null default 0,
  completed    boolean not null default false,
  completed_at timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.plan_tasks enable row level security;

create policy "Users manage own tasks"
  on public.plan_tasks for all using (auth.uid() = user_id);

create index plan_tasks_user_plan on public.plan_tasks (user_id, plan_id);

-- ─── plan_messages ────────────────────────────────────────────────────────────
create table public.plan_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.plan_messages enable row level security;

create policy "Users manage own messages"
  on public.plan_messages for all using (auth.uid() = user_id);

create index plan_messages_user_time on public.plan_messages (user_id, created_at desc);
