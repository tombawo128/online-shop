-- Run this whole file in the Supabase SQL editor.
create extension if not exists pgcrypto;
create table if not exists products(id uuid primary key default gen_random_uuid(),name text not null,description text,gender text not null check (gender in ('women','men')),category text,price numeric not null,sizes text[] default '{}',colors text[] default '{}',soldout text[] default '{}',images text[] default '{}',created_at timestamptz default now());
create table if not exists orders(id uuid primary key default gen_random_uuid(),customer_name text not null,phone text not null,state text not null,location text not null,items jsonb not null,total numeric not null,status text not null default 'pending',created_at timestamptz default now());
alter table products enable row level security;alter table orders enable row level security;
create policy "public read products" on products for select using (true);
create policy "admin write products" on products for all to authenticated using (true) with check (true);
create policy "anyone can place orders" on orders for insert to anon, authenticated with check (status = 'pending');
create policy "admin read orders" on orders for select to authenticated using (true);
create policy "admin update orders" on orders for update to authenticated using (true);
create policy "admin delete orders" on orders for delete to authenticated using (true);
insert into storage.buckets (id,name,public) values ('products','products',true) on conflict do nothing;
create policy "public read images" on storage.objects for select using (bucket_id = 'products');
create policy "admin upload images" on storage.objects for insert to authenticated with check (bucket_id = 'products');
create policy "admin delete images" on storage.objects for delete to authenticated using (bucket_id = 'products');
-- Sample products
insert into products (name,description,gender,category,price,sizes,colors,soldout,images) values
('Linen Summer Dress','Linen Summer Dress. Soft, comfortable and made to last. Easy to style for everyday wear.','women','dresses',45,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','beige','black']::text[],ARRAY['XS']::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Linen%20Summer%20Dress']::text[]),
('Classic White Blouse','Classic White Blouse. Soft, comfortable and made to last. Easy to style for everyday wear.','women','tops',28,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Classic%20White%20Blouse']::text[]),
('High-Waist Jeans','High-Waist Jeans. Soft, comfortable and made to last. Easy to style for everyday wear.','women','trousers',49,ARRAY['XS','S','M','L','XL']::text[],ARRAY['blue','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=High-Waist%20Jeans']::text[]),
('Knit Cardigan','Knit Cardigan. Soft, comfortable and made to last. Easy to style for everyday wear.','women','tops',39,ARRAY['XS','S','M','L','XL']::text[],ARRAY['gray','beige']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Knit%20Cardigan']::text[]),
('Pleated Midi Skirt','Pleated Midi Skirt. Soft, comfortable and made to last. Easy to style for everyday wear.','women','skirts',35,ARRAY['XS','S','M','L','XL']::text[],ARRAY['black','beige']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Pleated%20Midi%20Skirt']::text[]),
('Leather Ankle Boots','Leather Ankle Boots. Soft, comfortable and made to last. Easy to style for everyday wear.','women','shoes',79,ARRAY['38','39','40','41','42','43']::text[],ARRAY['black','brown']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Leather%20Ankle%20Boots']::text[]),
('Oxford Shirt','Oxford Shirt. Soft, comfortable and made to last. Easy to style for everyday wear.','men','tops',34,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','blue']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Oxford%20Shirt']::text[]),
('Slim Fit Chinos','Slim Fit Chinos. Soft, comfortable and made to last. Easy to style for everyday wear.','men','trousers',42,ARRAY['XS','S','M','L','XL']::text[],ARRAY['beige','black','gray']::text[],ARRAY['XL']::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Slim%20Fit%20Chinos']::text[]),
('Cotton Crew T-Shirt','Cotton Crew T-Shirt. Soft, comfortable and made to last. Easy to style for everyday wear.','men','tops',18,ARRAY['XS','S','M','L','XL']::text[],ARRAY['white','black','gray']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Cotton%20Crew%20T-Shirt']::text[]),
('Denim Jacket','Denim Jacket. Soft, comfortable and made to last. Easy to style for everyday wear.','men','jackets',65,ARRAY['XS','S','M','L','XL']::text[],ARRAY['blue','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Denim%20Jacket']::text[]),
('Wool Overcoat','Wool Overcoat. Soft, comfortable and made to last. Easy to style for everyday wear.','men','jackets',120,ARRAY['XS','S','M','L','XL']::text[],ARRAY['gray','black']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=Wool%20Overcoat']::text[]),
('White Sneakers','White Sneakers. Soft, comfortable and made to last. Easy to style for everyday wear.','men','shoes',70,ARRAY['38','39','40','41','42','43']::text[],ARRAY['white','gray']::text[],ARRAY[]::text[],ARRAY['https://placehold.co/600x750/ececec/222222?text=White%20Sneakers']::text[]);
