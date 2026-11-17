import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const store = readFileSync(new URL('../src/context/store.jsx', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/admin/admin.jsx', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20261115193000_one_time_store_admin.sql', import.meta.url), 'utf8');
const bootstrap = readFileSync(new URL('../supabase.sql', import.meta.url), 'utf8');

test('storefront never falls back to a browser-only sample catalogue', () => {
  assert.doesNotMatch(store, /from ['"]\.\.\/lib\/seed\.js['"]/);
  assert.doesNotMatch(store, /setProducts\(seed\)/);
  assert.match(store, /setProducts\(\[\]\)/);
});

test('administrator setup is a single database-enforced owner claim', () => {
  assert.match(store, /claim_first_store_admin/);
  assert.match(migration, /store_admin_claim/);
  assert.match(migration, /store_admin_setup/);
  assert.match(migration, /auth\.jwt\(\)->>'email'/);
  assert.match(migration, /email_confirmed_at/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /one-time administrator setup has already been claimed/);
  assert.match(admin, /Create the one administrator account/);
});

test('fresh production databases do not insert demo products', () => {
  assert.doesNotMatch(bootstrap, /Optional sample catalogue|placehold\.co/);
});
