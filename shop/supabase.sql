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

-- Optional sample catalogue. Remove this block if you are importing your own products.
insert into public.products (name,description,gender,category,price,sizes,colors,soldout,images,is_new)
select v.name, v.description, v.gender, v.category, v.price, v.sizes, v.colors, v.soldout, v.images, true
from (values
  ('Linen Summer Dress','Lightweight linen dress for everyday wear.','women','dresses',45::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','beige','black']::text[],ARRAY['XS']::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Linen%20Summer%20Dress']::text[]),
  ('Classic White Blouse','A versatile blouse for everyday styling.','women','tops',28::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Classic%20White%20Blouse']::text[]),
  ('High-Waist Jeans','Classic high-waist denim.','women','trousers',49::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['blue','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=High-Waist%20Jeans']::text[]),
  ('Knit Cardigan','Soft knit cardigan for layering.','women','tops',39::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['gray','beige']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Knit%20Cardigan']::text[]),
  ('Pleated Midi Skirt','A versatile pleated midi skirt.','women','skirts',35::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['black','beige']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Pleated%20Midi%20Skirt']::text[]),
  ('Leather Ankle Boots','Classic ankle boots.','women','shoes',79::numeric,ARRAY['38','39','40','41','42','43']::text[],ARRAY['black','brown']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Leather%20Ankle%20Boots']::text[]),
  ('Oxford Shirt','A smart-casual Oxford shirt.','men','tops',34::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','blue']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Oxford%20Shirt']::text[]),
  ('Slim Fit Chinos','Modern slim-fit chinos.','men','trousers',42::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['beige','black','gray']::text[],ARRAY['XL']::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Slim-Fit%20Chinos']::text[]),
  ('Cotton Crew T-Shirt','A comfortable cotton crew T-shirt.','men','tops',18::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','black','gray']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Cotton%20Crew%20T-Shirt']::text[]),
  ('Denim Jacket','A classic denim jacket.','men','jackets',65::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['blue','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Denim%20Jacket']::text[]),
  ('Wool Overcoat','A timeless wool overcoat.','men','jackets',120::numeric,ARRAY['XS','S','M','L','XL']::text[],ARRAY['gray','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Wool%20Overcoat']::text[]),
  ('White Sneakers','Everyday white sneakers.','men','shoes',70::numeric,ARRAY['38','39','40','41','42','43']::text[],ARRAY['white','gray']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=White%20Sneakers']::text[])
) as v(name,description,gender,category,price,sizes,colors,soldout,images)
where not exists (select 1 from public.products p where lower(p.name)=lower(v.name) and p.gender=v.gender);
