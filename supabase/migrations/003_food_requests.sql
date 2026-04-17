create table if not exists public.food_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  food_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.food_requests
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.food_requests
  add column if not exists status text not null default 'pending';

alter table public.food_requests
  add column if not exists created_at timestamptz not null default now();

alter table public.food_requests
  alter column user_id drop not null;

alter table public.food_requests
  alter column status set default 'pending';

alter table public.food_requests
  alter column created_at set default now();

create index if not exists idx_food_requests_user_id
  on public.food_requests(user_id);

create index if not exists idx_food_requests_status
  on public.food_requests(status);

alter table public.food_requests enable row level security;

drop policy if exists "Anyone can insert food requests" on public.food_requests;
create policy "Anyone can insert food requests"
  on public.food_requests for insert
  to anon, authenticated
  with check (
    char_length(trim(food_name)) >= 2
    and (user_id is null or auth.uid() = user_id)
  );

drop policy if exists "Users can read own food requests" on public.food_requests;
create policy "Users can read own food requests"
  on public.food_requests for select
  to authenticated
  using (user_id = auth.uid());
