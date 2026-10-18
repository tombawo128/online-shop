import { createClient } from '@supabase/supabase-js';

let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
if (rawUrl) {
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}
let rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
if (rawKey === 'YOUR_ANON_KEY_HERE' || rawKey.length < 20) {
  rawKey = '';
}

export const isSupabaseConfigured = Boolean(rawUrl && rawKey);
export const supabase = isSupabaseConfigured ? createClient(rawUrl, rawKey) : null;
