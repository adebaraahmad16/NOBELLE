import { loadEnv } from 'vite';
import { normalizeSupabaseUrl, validatePublicKey } from '../src/lib/supabase-config.js';
import { storefrontSchema,publicReadSchema } from '../src/lib/supabase-schema.js';
import { createClient } from '@supabase/supabase-js';
import { readFileSync,writeFileSync } from 'node:fs';
const mode = process.argv.includes('--production') ? 'production' : 'development';
const env = loadEnv(mode, process.cwd(), 'VITE_SUPABASE_');
const base = normalizeSupabaseUrl(env.VITE_SUPABASE_URL);
const key = validatePublicKey(env.VITE_SUPABASE_ANON_KEY);
if (!base || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before checking the connection.');
const headers = { apikey: key, Accept: 'application/openapi+json' };
if (!key.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${key}`;
const all=process.argv.includes('--all');
const schemaToCheck=all?Object.fromEntries(Object.entries(JSON.parse(readFileSync('supabase/database-contract.json','utf8'))).map(([name,table])=>[name,table.columns.map(c=>c.name)])):storefrontSchema;
const report = { checkedAt:new Date().toISOString(),mode,scope:all?'all application tables':'storefront',projectUrl: base, connection: '', missingTables: [], missingTableDetails: [], unavailableProtectedTables:[],incorrectColumns: [], missingPermissions: [], otherErrors: [], verifiedTables: [], realtime: {status:'Not checked'}, notes: [] };
try {
  // API metadata lets us identify missing tables/columns before querying records.
  const response = await fetch(`${base}/rest/v1/`, { headers, signal: AbortSignal.timeout(15000) });
  let schema;
  try { schema = await response.json(); } catch { /* A proxy can return HTML. */ }
  if (!response.ok && response.status !== 401 && response.status !== 403) throw new Error(`Supabase REST metadata returned ${response.status}: ${schema?.message || schema?.error || response.statusText}`);
  if (!response.ok || !schema?.definitions) report.notes.push('Public API schema introspection is restricted. Verifying table/column access with zero-row SDK requests instead; no privileged key is needed.');
  const client=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  for (const [table, columns] of Object.entries(schemaToCheck)) {
    const definition = schema?.definitions?.[table];
    if (schema?.definitions && !definition) { if(!(table in publicReadSchema))report.unavailableProtectedTables.push({table,message:'Not visible in the public API metadata; confirm existence and grants using diagnostics.sql.'});else report.missingTables.push(table);continue; }
    const absent = definition?columns.filter(column => !(column in (definition.properties || {}))):[];
    if (absent.length) { report.incorrectColumns.push({ table, columns: absent }); continue; }
    const result = await client.from(table).select(columns.join(',')).limit(0).abortSignal(AbortSignal.timeout(15000));
    if (!result.error) report.verifiedTables.push(table);
    else {
      const error = result.error;
      const issue = { table, status: result.status, code: error.code, message: error.message };
      if (['42P01','PGRST205'].includes(error.code)) {if(!(table in publicReadSchema))report.unavailableProtectedTables.push(issue);else{report.missingTables.push(table);report.missingTableDetails.push(issue);}}
      else if (['42703','PGRST204'].includes(error.code)) report.incorrectColumns.push(issue);
      else if ([401, 403].includes(result.status) || error.code === '42501') report.missingPermissions.push(issue);
      else report.otherErrors.push(issue);
      if(result.status===401){report.notes.push('API key was rejected. Verify that the public key belongs to this project; skipping repeated unauthorized probes.');break;}
    }
  }
  report.connection=report.verifiedTables.length?'Connected to the correct REST endpoint':'REST endpoint reached; schema/access issues require attention';
  if(process.argv.includes('--realtime')&&!report.missingPermissions.some(issue=>issue.status===401)){
    const endpoint=new URL(client.realtime.endpointURL());report.realtime.endpoint=endpoint.origin+endpoint.pathname;
    const channel=client.channel('nobelle-connection-diagnostic');
    report.realtime.status=await new Promise(resolve=>{let done=false;const finish=state=>{if(done)return;done=true;clearTimeout(timer);resolve(state);};const timer=setTimeout(()=>finish('TIMED_OUT'),12000);channel.subscribe(state=>{if(['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT'].includes(state))finish(state);});});
    await client.removeChannel(channel);
    if(report.realtime.status!=='SUBSCRIBED')report.otherErrors.push({message:'Realtime connection failed: '+report.realtime.status});
  }
  await client.realtime.disconnect();
  await client.auth.dispose();
  report.notes.push('Missing metadata tables can also mean the API role lacks grants or the schema cache is stale; confirm using supabase/diagnostics.sql.');
  report.notes.push('Zero-row probes verify table/column access, not ownership policies or the visibility of published records. No customer or business records were downloaded.');
  if(all)report.notes.push('Unavailable protected tables may be absent or intentionally hidden from the public role. Run the SQL-editor audit to distinguish these cases; no secret key is requested or used.');
} catch (error) {
  report.connection = 'Connection or metadata check failed';
  report.otherErrors.push({ message: error.message, cause: error.cause?.message });
}
console.log(JSON.stringify(report, null, 2));
const outputIndex=process.argv.indexOf('--output');if(outputIndex!==-1){const output=process.argv[outputIndex+1];if(!output?.startsWith('.tmp/')||output.includes('..'))throw new Error('Diagnostic output must be a file under .tmp/');writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
if (report.missingTables.length || report.unavailableProtectedTables.length || report.incorrectColumns.length || report.missingPermissions.length || report.otherErrors.length) process.exitCode = 1;
