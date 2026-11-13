-- ============================================================
-- HEALTH PLUS | Team CASA Vital
-- Nutrition, Indian Food Scanner & Dietary Pattern Intelligence
-- Run in Supabase SQL Editor. Idempotent.
-- Embedding model: BAAI/bge-small-en-v1.5 (384 dims, via fastembed)
-- ============================================================

create extension if not exists vector;
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Shared users table (Exercise module reads/writes the SAME table)
-- ------------------------------------------------------------
create table if not exists public.users (
    id                  uuid primary key default gen_random_uuid(),
    name                text not null,
    age                 int  check (age between 5 and 120),
    gender              text check (gender in ('male','female','other')),
    height_cm           numeric(5,1),
    weight_kg           numeric(5,1),
    dietary_preference  text check (dietary_preference in ('veg','non-veg','vegan','jain')),
    goal                text check (goal in ('lose_weight','maintain','gain_muscle')),
    target_calories     int,
    target_protein_g    int,
    created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RAG nutrition table
-- ------------------------------------------------------------
create table if not exists public.indian_food_nutrition (
    id            bigint generated always as identity primary key,
    food_name     text not null unique,
    serving_unit  text not null,            -- e.g. '1 piece', '1 katori (150g)'
    calories      numeric(7,2) not null,
    protein_g     numeric(6,2) not null,
    carbs_g       numeric(6,2) not null,
    fats_g        numeric(6,2) not null,
    region        text,
    category      text,                     -- bread/dal/rice/sabzi/snack/sweet/dairy/non-veg/breakfast/beverage
    diet_type     text check (diet_type in ('veg','non-veg','vegan','jain')) default 'veg',
    aliases       text[] default '{}',      -- hinglish / alternate names for lookup
    embedding     vector(384)
);

create index if not exists idx_food_embedding
    on public.indian_food_nutrition using hnsw (embedding vector_cosine_ops);
create index if not exists idx_food_category on public.indian_food_nutrition (category);

-- Vector similarity search with optional filters (used by backend/rag_nutrition.py)
create or replace function public.match_indian_foods(
    query_embedding vector(384),
    match_count     int default 5,
    min_similarity  float default 0.0,
    filter_category text default null,
    allowed_diets   text[] default null
)
returns table (
    id bigint, food_name text, serving_unit text, calories numeric,
    protein_g numeric, carbs_g numeric, fats_g numeric,
    region text, category text, diet_type text, similarity float
)
language sql stable as $$
    select f.id, f.food_name, f.serving_unit, f.calories, f.protein_g, f.carbs_g,
           f.fats_g, f.region, f.category, f.diet_type,
           1 - (f.embedding <=> query_embedding) as similarity
    from public.indian_food_nutrition f
    where (filter_category is null or f.category = filter_category)
      and (allowed_diets is null or f.diet_type = any(allowed_diets))
      and 1 - (f.embedding <=> query_embedding) >= min_similarity
    order by f.embedding <=> query_embedding
    limit match_count;
$$;

-- ------------------------------------------------------------
-- Diet plans (one active plan per user)
-- ------------------------------------------------------------
create table if not exists public.diet_plans (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.users(id) on delete cascade,
    plan_json   jsonb not null,
    updated_at  timestamptz not null default now(),
    unique (user_id)
);

-- ------------------------------------------------------------
-- Meal logs
-- ------------------------------------------------------------
create table if not exists public.meal_logs (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references public.users(id) on delete cascade,
    meal_type        text not null check (meal_type in ('breakfast','lunch','snack','dinner')),
    confirmed_items  jsonb not null,
    total_calories   numeric(8,2) not null,
    total_protein    numeric(7,2) not null,
    total_carbs      numeric(7,2) not null,
    total_fats       numeric(7,2) not null,
    is_anomaly       boolean not null default false,
    bot_feedback     text,
    logged_at        timestamptz not null default now()
);

create index if not exists idx_meal_logs_user_time on public.meal_logs (user_id, logged_at desc);

-- keep diet_plans.updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_diet_plans_touch on public.diet_plans;
create trigger trg_diet_plans_touch before update on public.diet_plans
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Row Level Security.
-- The FastAPI backend uses the service-role key (bypasses RLS).
-- These policies protect direct client access via Supabase Auth,
-- assuming users.id == auth.uid() in the unified app.
-- ------------------------------------------------------------
alter table public.users      enable row level security;
alter table public.diet_plans enable row level security;
alter table public.meal_logs  enable row level security;
alter table public.indian_food_nutrition enable row level security;

drop policy if exists users_self on public.users;
create policy users_self on public.users for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists plans_self on public.diet_plans;
create policy plans_self on public.diet_plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists logs_self on public.meal_logs;
create policy logs_self on public.meal_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists food_read on public.indian_food_nutrition;
create policy food_read on public.indian_food_nutrition for select using (true);
