-- Urban Thread database bootstrap (run once on a fresh Supabase project).
-- After this file, apply every SQL migration in shop/supabase/migrations/.
-- RLS is enabled immediately; the migration installs the narrowly scoped policies.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  gender text not null check (gender in ('women','men')),
  category text,
  price numeric(12,2) not null check (price >= 0),
  original_price numeric(12,2),
  rating numeric(2,1),
  review_count integer not null default 0 check (review_count >= 0),
  is_new boolean not null default false,
  is_active boolean not null default true,
  inventory_tracking boolean not null default false,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  soldout text[] not null default '{}',
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text,
  user_id uuid references auth.users(id) on delete set null,
  phone text not null,
  state text not null,
  location text not null,
  notes text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(12,2),
  discount numeric(12,2) not null default 0,
  discount_code text,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Storage bucket is public for product image delivery; writes are restricted by migration policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Do not add permissive "authenticated can write" or "anyone can read orders" policies here.
-- Database access remains denied by RLS until the security migration is applied.

-- The production catalogue starts empty. Add real products through the administrator dashboard.
