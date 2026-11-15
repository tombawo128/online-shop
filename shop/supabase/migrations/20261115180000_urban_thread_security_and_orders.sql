-- Urban Thread production hardening
-- Apply this migration to the Urban Thread Supabase project after reviewing the target schema.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
drop policy if exists "users can read own role" on public.user_roles;
create policy "users can read own role"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = 'admin'
  );
$$;
revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to authenticated;

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists customer_email text,
  add column if not exists notes text,
  add column if not exists subtotal numeric(12,2),
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists discount_code text,
  add column if not exists shipping numeric(12,2) not null default 0;

alter table public.products
  add column if not exists is_active boolean not null default true,
  add column if not exists inventory_tracking boolean not null default false;

create table if not exists public.product_inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color)
);
alter table public.product_inventory enable row level security;

drop policy if exists "public read products" on public.products;
drop policy if exists "admin write products" on public.products;
drop policy if exists "products are publicly readable" on public.products;
drop policy if exists "store admins manage products" on public.products;
create policy "products are publicly readable"
  on public.products for select
  using (is_active = true or (select public.is_store_admin()));
create policy "store admins manage products"
  on public.products for all to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "anyone can place orders" on public.orders;
drop policy if exists "admin read orders" on public.orders;
drop policy if exists "admin update orders" on public.orders;
drop policy if exists "admin delete orders" on public.orders;
drop policy if exists "customers read own orders" on public.orders;
drop policy if exists "store admins manage orders" on public.orders;
create policy "customers read own orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_store_admin()));
create policy "store admins manage orders"
  on public.orders for all to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "public read images" on storage.objects;
drop policy if exists "admin upload images" on storage.objects;
drop policy if exists "admin delete images" on storage.objects;
drop policy if exists "store admins upload product images" on storage.objects;
drop policy if exists "store admins update product images" on storage.objects;
drop policy if exists "store admins delete product images" on storage.objects;
create policy "public read images"
  on storage.objects for select
  using (bucket_id = 'products');
create policy "store admins upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (select public.is_store_admin()));
create policy "store admins update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'products' and (select public.is_store_admin()))
  with check (bucket_id = 'products' and (select public.is_store_admin()));
create policy "store admins delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (select public.is_store_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.place_store_order(
  p_customer_name text,
  p_customer_email text,
  p_phone text,
  p_state text,
  p_location text,
  p_notes text,
  p_items jsonb,
  p_discount_code text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_qty integer;
  v_size text;
  v_color text;
  v_code text := upper(trim(coalesce(p_discount_code, '')));
  v_order public.orders%rowtype;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'A valid customer name is required';
  end if;
  if length(trim(coalesce(p_phone, ''))) < 7 or length(trim(p_phone)) > 24 then
    raise exception 'A valid phone number is required';
  end if;
  if length(trim(coalesce(p_state, ''))) = 0 or length(trim(coalesce(p_location, ''))) < 5 then
    raise exception 'A complete delivery address is required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'The order must contain between 1 and 30 items';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item->>'id', '') = '' then
      raise exception 'An order item is missing its product identifier';
    end if;
    begin
      v_qty := (v_item->>'qty')::integer;
      select * into strict v_product
      from public.products
      where id = (v_item->>'id')::uuid and is_active = true
      for update;
    exception
      when no_data_found then raise exception 'A product in your bag is no longer available';
      when invalid_text_representation then raise exception 'An order item has an invalid product identifier';
      when invalid_parameter_value then raise exception 'An order item has an invalid quantity';
    end;

    if v_qty < 1 or v_qty > 20 then
      raise exception 'Each product quantity must be between 1 and 20';
    end if;
    v_size := trim(coalesce(v_item->>'size', ''));
    v_color := trim(coalesce(v_item->>'color', ''));
    if v_size = '' or not (v_size = any(coalesce(v_product.sizes, '{}'::text[]))) then
      raise exception 'A selected size is no longer available for %', v_product.name;
    end if;
    if v_size = any(coalesce(v_product.soldout, '{}'::text[])) then
      raise exception 'The selected size is sold out for %', v_product.name;
    end if;
    if v_color = '' or not (v_color = any(coalesce(v_product.colors, '{}'::text[]))) then
      raise exception 'A selected colour is no longer available for %', v_product.name;
    end if;

    if v_product.inventory_tracking then
      update public.product_inventory
      set quantity = quantity - v_qty, updated_at = now()
      where product_id = v_product.id and size = v_size and color = v_color and quantity >= v_qty;
      if not found then
        raise exception 'Insufficient stock for % (% / %)', v_product.name, v_size, v_color;
      end if;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'size', v_size,
      'color', v_color,
      'qty', v_qty,
      'price', v_product.price,
      'image', coalesce(v_product.images[1], '')
    ));
  end loop;

  if v_code in ('URBAN15', 'WELCOME15') then
    v_discount := round(v_subtotal * 0.15, 2);
  elsif v_code = 'VIP20' then
    v_discount := round(v_subtotal * 0.20, 2);
  elsif v_code <> '' then
    raise exception 'The discount code is invalid or expired';
  end if;

  if v_subtotal < 75 then
    v_shipping := 8.50;
  end if;
  v_total := greatest(0, v_subtotal - v_discount + v_shipping);

  insert into public.orders (
    customer_name, customer_email, user_id, phone, state, location, notes,
    items, subtotal, discount, discount_code, shipping, total, status
  ) values (
    trim(p_customer_name), nullif(trim(coalesce(p_customer_email, '')), ''),
    auth.uid(), trim(p_phone), trim(p_state), trim(p_location),
    nullif(trim(coalesce(p_notes, '')), ''), v_items, v_subtotal,
    v_discount, nullif(v_code, ''), v_shipping, v_total, 'pending'
  )
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.place_store_order(text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.place_store_order(text,text,text,text,text,text,jsonb,text) to anon, authenticated;

-- Inventory is private; public stock visibility is intentionally exposed only through active product variants.
drop policy if exists "store admins manage inventory" on public.product_inventory;
create policy "store admins manage inventory"
  on public.product_inventory for all to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
revoke insert, update, delete on public.orders from anon, authenticated;
grant select, update, delete on public.orders to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_inventory to authenticated;
