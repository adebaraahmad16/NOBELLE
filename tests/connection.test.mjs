import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl, validatePublicKey } from '../src/lib/supabase-config.js';
import { supabaseError } from '../src/lib/supabase-errors.js';
import { createReadCache } from '../src/api/read-cache.js';
import { createSupabaseSync, affectsTables } from '../src/lib/supabase-sync.js';

test('copied API paths never contaminate Supabase service URLs', async () => {
  for (const suffix of ['', '/', '/rest/v1/', '/rest/v1/rest/v1/products', '/auth/v1', '/storage/v1/object/public/images', '/realtime/v1/websocket']) {
    assert.equal(normalizeSupabaseUrl(` https://example.supabase.co${suffix} `), 'https://example.supabase.co');
  }
  assert.equal(normalizeSupabaseUrl('http://127.0.0.1:54321/rest/v1'), 'http://127.0.0.1:54321');
  for (const invalid of ['not a url', 'ftp://example.com', 'http://example.com', 'https://user:password@example.com', 'https://example.com/dashboard']) assert.throws(() => normalizeSupabaseUrl(invalid));
  const requests = [];
  const client = createClient(normalizeSupabaseUrl('https://example.supabase.co/rest/v1/rest/v1/'), 'sb_publishable_test', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
      requests.push(url.pathname);
      const data = url.pathname === '/auth/v1/user' ? { id: 'test-user', app_metadata: {}, user_metadata: {} } : url.pathname.startsWith('/functions/') ? { ok: true } : [];
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } },
  });
  for (const table of ['products', 'product_categories', 'product_collections', 'website_settings', 'store_settings']) {
    const { error } = await client.from(table).select('*'); assert.equal(error, null);
  }
  await client.auth.getUser('test-access-token');
  await client.storage.from('product-images').list();
  await client.functions.invoke('checkout', { body: {} });
  assert.deepEqual(requests, ['/rest/v1/products', '/rest/v1/product_categories', '/rest/v1/product_collections', '/rest/v1/website_settings', '/rest/v1/store_settings', '/auth/v1/user', '/storage/v1/object/list/product-images', '/functions/v1/checkout']);
  assert.equal(new URL(client.realtime.endpointURL()).pathname, '/realtime/v1/websocket');
  assert.equal(new URL(client.realtime.endpointURL()).protocol, 'wss:');
  await client.realtime.disconnect();
  await client.auth.dispose();
});

test('privileged keys are rejected without logging credentials', () => {
  assert.equal(validatePublicKey(' sb_publishable_test '), 'sb_publishable_test');
  assert.throws(() => validatePublicKey('sb_secret_test'), /never a secret/);
  const token = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.throws(() => validatePublicKey(token), /service-role/);
});

test('missing tables, incorrect columns, denied permissions and network failures are distinct', () => {
  assert.equal(supabaseError({ code: 'PGRST205', message: 'public.products not found' }, 404).kind, 'table');
  assert.equal(supabaseError({ code: '42703', message: 'version missing' }, 400).kind, 'column');
  assert.equal(supabaseError({ code: '42501', message: 'permission denied' }, 403).kind, 'permission');
  assert.equal(supabaseError({ code: 'PGRST200', message: 'foreign key missing' }, 400).kind, 'relationship');
  const network = supabaseError({ message: 'TypeError: Failed to fetch' }, 0);
  assert.equal(network.kind, 'connection'); assert.equal(network.status, 0);
});

test('public reads share concurrent requests, expire and never conceal failures', async () => {
  let time = 0, calls = 0;
  const cache = createReadCache({ ttl: 50, now: () => time });
  const load = () => { calls++; return ['actual query result']; };
  const first = cache.run('categories', load), second = cache.run('categories', load);
  assert.equal(first, second); await first; assert.equal(calls, 1);
  await cache.run('categories', load); assert.equal(calls, 1);
  time = 51; await cache.run('categories', load); assert.equal(calls, 2);
  cache.invalidate(); await cache.run('categories', load); assert.equal(calls, 3);
  await assert.rejects(cache.run('broken', () => { throw new Error('Missing table'); }), /Missing table/);
  assert.deepEqual(await cache.run('broken', load), ['actual query result']);
  let finish;
  const old = cache.run('settings', () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve(); cache.invalidate();
  const fresh = cache.run('settings', () => 'fresh'); finish('old'); await old;
  assert.equal(await fresh, 'fresh'); assert.equal(await cache.run('settings', () => 'unexpected'), 'fresh');
});

const tick = () => new Promise(resolve => setTimeout(resolve, 12));
function fakeRealtime() {
  const channels = [], removed = [];
  return { channels, removed, channel() {
    const handlers = new Map();
    const channel = { handlers, on(_event, filter, fn) { handlers.set(filter.table, fn); return this; }, subscribe(callback) { this.status = callback; callback('SUBSCRIBED'); return this; } };
    channels.push(channel); return channel;
  }, async removeChannel(channel) { removed.push(channel); } };
}
test('StrictMode remounts and multiple consumers share one cleaned-up Realtime channel', async () => {
  const client = fakeRealtime(), changes = [];
  const sync = createSupabaseSync(client, { delay: 1, changed: tables => changes.push(tables) });
  const releaseInitial = sync.acquire(); releaseInitial();
  const releaseA = sync.acquire(), releaseB = sync.acquire(); await tick();
  assert.equal(client.channels.length, 1);
  const channel = client.channels[0];
  channel.handlers.get('product_categories')(); channel.handlers.get('product_collections')(); await tick();
  assert.deepEqual(changes, [['product_categories', 'product_collections']]);
  releaseA(); releaseA(); await tick(); assert.equal(client.removed.length, 0);
  releaseB(); await tick(); assert.equal(client.removed.length, 1);
  channel.handlers.get('products')(); await tick(); assert.equal(changes.length, 1);
  assert.equal(affectsTables({ detail: { tables: ['orders'] } }, ['products']), false);
  assert.equal(affectsTables({ detail: { tables: ['products'] } }, ['products']), true);
});

test('a new mount waits for asynchronous channel removal', async () => {
  const client = fakeRealtime(); let finishRemoval;
  client.removeChannel = channel => { client.removed.push(channel); return new Promise(resolve => { finishRemoval = resolve; }); };
  const sync = createSupabaseSync(client), release = sync.acquire(); await tick(); release(); await tick();
  const releaseNext = sync.acquire(); await tick(); assert.equal(client.channels.length, 1);
  finishRemoval(); await tick(); assert.equal(client.channels.length, 2);
  releaseNext(); await tick(); finishRemoval(); await tick();
});
