import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20261115180000_urban_thread_security_and_orders.sql', import.meta.url), 'utf8');

test('migration uses balanced PostgreSQL function delimiters', () => {
  const tags = migration.match(/\$fn\$/g) || [];
  assert.equal(tags.length % 2, 0);
  assert.ok(tags.length >= 10);
  assert.equal(migration.includes('\\n'), false);
});

test('order inserts are only available through the validated database function', () => {
  assert.match(migration, /revoke insert, update, delete on public\.orders from anon, authenticated/i);
  assert.match(migration, /create or replace function public\.place_store_order/i);
  assert.match(migration, /v_subtotal := v_subtotal \+ \(v_product\.price \* v_qty\)/i);
  assert.match(migration, /grant execute on function public\.place_store_order/i);
});

test('administrator access is based on protected database roles', () => {
  assert.match(migration, /create table if not exists public\.user_roles/i);
  assert.match(migration, /create or replace function public\.is_store_admin/i);
  assert.match(migration, /create policy "store admins manage products"/i);
  assert.doesNotMatch(migration, /with check\s*\(\s*true\s*\)/i);
});

test('customer reviews require a completed order and remain moderated', () => {
  assert.match(migration, /o\.status in \('paid', 'delivered'\)/i);
  assert.match(migration, /status text not null default 'pending'/i);
  assert.match(migration, /create policy "store admins moderate reviews"/i);
});

test('tracked stock is decremented on order and restored on cancellation', () => {
  assert.match(migration, /update public\.product_inventory\s+set quantity = quantity - v_qty/i);
  assert.match(migration, /create trigger restore_cancelled_order_inventory/i);
  assert.match(migration, /set quantity = quantity \+ \(v_item->>'qty'\)::integer/i);
});
