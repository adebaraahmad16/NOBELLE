// Supabase expects the project origin; its SDK appends every service path.
export function normalizeSupabaseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let url;
  try { url = new URL(raw); } catch { throw new Error('VITE_SUPABASE_URL must be a valid Supabase project URL.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('VITE_SUPABASE_URL must use HTTPS (HTTP is supported only for local Supabase).');
  }
  if (url.username || url.password) throw new Error('VITE_SUPABASE_URL must not contain credentials.');
  if (url.pathname !== '/' && !/^\/(rest|auth|storage|realtime|functions)\/v1(?:\/|$)/.test(url.pathname)) {
    throw new Error('VITE_SUPABASE_URL must contain only the base project URL, without an API or website path.');
  }
  // Recover from a copied REST/Auth/Storage/Realtime URL, including repeated paths.
  return url.origin;
}

export function validatePublicKey(value) {
  const key = String(value || '').trim();
  if (key.startsWith('sb_secret_')) throw new Error('VITE_SUPABASE_ANON_KEY must be a public publishable/anon key, never a secret key.');
  try {
    const claims = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (claims.role === 'service_role') throw new Error('Privileged Supabase service-role keys cannot be used in the frontend.');
  } catch (error) {
    if (error.message.startsWith('Privileged Supabase')) throw error;
  }
  return key;
}
