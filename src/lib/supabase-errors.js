export function supabaseError(error, status) {
  const code = error.code || '';
  let kind = 'request';
  let message = error.message || 'Supabase request failed.';
  if (['42P01', 'PGRST205'].includes(code)) {
    kind = 'table'; message = `Supabase table missing or unavailable in the API schema cache. ${message} Apply the database migrations and check exposed tables.`;
  } else if (['42703', 'PGRST204'].includes(code)) {
    kind = 'column'; message = `Supabase column mismatch. ${message} Check the database migrations and exact column names.`;
  } else if (code === 'PGRST200') {
    kind = 'relationship'; message = `Supabase relationship missing from the API schema cache. ${message} Check foreign keys and applied migrations.`;
  } else if (code === '42501' || [401, 403].includes(status)) {
    kind = 'permission'; message = `Supabase access denied. ${message} Check the signed-in role, table grants and RLS policies.`;
  } else if (status === 0 || /fetch failed|failed to fetch|networkerror/i.test(message)) {
    kind = 'connection'; message = 'Unable to connect to Supabase. Check the project URL, network connection and project availability.';
  }
  const result = new Error(message);
  Object.assign(result, { code, kind, status: status ?? (kind === 'connection' ? 0 : kind === 'permission' ? 403 : code === 'PGRST116' ? 404 : 400), details: error.details, hint: error.hint });
  return result;
}
