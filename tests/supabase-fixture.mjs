import { PGlite } from '@electric-sql/pglite';
import { readFileSync,readdirSync } from 'node:fs';

// Supabase-owned objects are test substitutes; application SQL runs unmodified
// apart from pgcrypto (gen_random_uuid is built into this PostgreSQL engine).
export async function createDatabase(){
 const db=new PGlite();
 await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',last_sign_in_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users,created_at timestamptz default now(),updated_at timestamptz default now(),user_agent text);
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id',nullif(current_setting('request.jwt.claim.sub',true),''))$$;
 grant usage on schema auth to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 create publication supabase_realtime;
 `);
 return db;
}
export async function applyMigrations(db){
 for(const name of readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort())await db.exec(readFileSync(`supabase/migrations/${name}`,'utf8').replace('create extension if not exists pgcrypto;',''));
}
export async function readContract(db){
 const tables=(await db.query(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name`)).rows;
 const result={};
 for(const {table_name:name} of tables){
  const columns=(await db.query(`select a.attname as name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull as required,pg_get_expr(d.adbin,d.adrelid) as default_value from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where n.nspname='public' and c.relname=$1 and a.attnum>0 and not a.attisdropped order by a.attnum`,[name])).rows;
  const constraints=(await db.query(`select conname as name,contype as type,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid=to_regclass('public.'||$1) and contype in ('p','u','f','c','x') order by conname`,[name])).rows;
  const indexes=(await db.query(`select indexname as name,indexdef as definition from pg_indexes where schemaname='public' and tablename=$1 order by indexname`,[name])).rows;
  result[name]={columns,constraints,indexes};
 }
 return result;
}
