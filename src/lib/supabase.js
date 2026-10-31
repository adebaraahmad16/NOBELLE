import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl, validatePublicKey } from './supabase-config.js';

let configurationError;
let url = '';
let key = '';
try {
  url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
  key = validatePublicKey(import.meta.env.VITE_SUPABASE_ANON_KEY);
} catch (error) { configurationError = error; }
export const supabaseUrl = url;
export const supabase = !configurationError && url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
}) : null;
export function requireSupabase() {
  if (configurationError) throw configurationError;
  if (!supabase) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, then restart or rebuild NOBELLE.');
  return supabase;
}
