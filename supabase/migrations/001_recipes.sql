-- Create recipes table
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create recipe_ingredients table
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  preparation text not null,
  sort_order integer not null default 0
);

-- Create recipe_analyses table
create table if not exists public.recipe_analyses (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  result jsonb,
  model_used text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_recipes_owner on public.recipes(owner_id);
create index idx_recipe_ingredients_recipe on public.recipe_ingredients(recipe_id);
create index idx_recipe_analyses_recipe on public.recipe_analyses(recipe_id);

-- RLS for recipes
alter table public.recipes enable row level security;

create policy "Users can read own recipes"
  on public.recipes for select
  using (auth.uid() = owner_id);

create policy "Users can insert own recipes"
  on public.recipes for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own recipes"
  on public.recipes for update
  using (auth.uid() = owner_id);

create policy "Users can delete own recipes"
  on public.recipes for delete
  using (auth.uid() = owner_id);

-- RLS for recipe_ingredients (via recipe ownership)
alter table public.recipe_ingredients enable row level security;

create policy "Users can read own recipe ingredients"
  on public.recipe_ingredients for select
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can insert own recipe ingredients"
  on public.recipe_ingredients for insert
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can update own recipe ingredients"
  on public.recipe_ingredients for update
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can delete own recipe ingredients"
  on public.recipe_ingredients for delete
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

-- RLS for recipe_analyses (via recipe ownership)
alter table public.recipe_analyses enable row level security;

create policy "Users can read own recipe analyses"
  on public.recipe_analyses for select
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_analyses.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can insert own recipe analyses"
  on public.recipe_analyses for insert
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_analyses.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can update own recipe analyses"
  on public.recipe_analyses for update
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_analyses.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

-- Updated_at trigger for recipes
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.update_updated_at();
