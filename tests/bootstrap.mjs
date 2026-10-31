import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { buildBootstrap } from '../scripts/build-supabase-bootstrap.mjs';
const sql=buildBootstrap().replace('create extension if not exists pgcrypto;','');
async function database(){
 const db=new PGlite();
 await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',last_sign_in_at timestamptz);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users,created_at timestamptz default now(),updated_at timestamptz default now(),user_agent text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
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
for(const type of ['uuid','integer']){
 const db=await database();
 await db.exec(`create table public.store_settings(id ${type==='uuid'?'uuid primary key default gen_random_uuid()':'bigserial primary key'},section text,values jsonb);`);
 const row=(await db.query(`insert into public.store_settings(section,values) values('general','{"storeName":"Existing NOBELLE","currency":"NGN"}') returning id`)).rows[0];
 if(type==='integer')await db.exec('alter table public.store_settings add column version integer;update public.store_settings set version=3;');
 const authId='30000000-0000-4000-8000-000000000001';
 await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,'existing@example.test','{"firstName":"Existing","role":"SUPER_ADMIN"}')`,[authId]);
 await db.exec(sql);
 const settings=(await db.query(`select * from public.store_settings where section='general'`)).rows[0];
 assert.equal(settings.id,row.id);assert.deepEqual(settings.values,{storeName:'Existing NOBELLE',currency:'NGN'});assert.equal(settings.version,type==='integer'?3:1);
 assert.equal((await db.query('select count(*)::int n from public.store_settings where version is null')).rows[0].n,0,'All configuration rows have a usable version');
 assert.equal((await db.query('select count(*)::int n from public.products')).rows[0].n,0,'No fake products');
 assert.equal((await db.query('select count(*)::int n from public.orders')).rows[0].n,0,'No fake orders');
 assert.equal((await db.query('select count(*)::int n from public.admin_roles')).rows[0].n,0,'User metadata cannot grant administrator access');
 assert.equal((await db.query('select count(*)::int n from public.profiles where id=$1',[authId])).rows[0].n,1,'Existing real Auth users get profiles');
 await db.exec('set role anon');const publicSettings=(await db.query('select section from public.store_settings')).rows;assert.equal(publicSettings.length,7);assert.ok(!publicSettings.some(r=>r.section==='notifications'));await db.exec('reset role');
 await assert.rejects(db.exec(sql),/Existing public tables/);await db.exec('rollback');
 assert.equal((await db.query("select values->>'storeName' name from public.store_settings where section='general'")).rows[0].name,'Existing NOBELLE');
 await db.close();console.log(`PASS: Partial settings (${type} ID) preserved, missing schema installed, RLS enforced, Auth backfilled without role escalation, repeat installation refused.`);
}
{
 const db=await database();
 await db.exec(`create table public.store_settings(id uuid primary key default gen_random_uuid(),section text,values jsonb);alter table public.store_settings enable row level security;create policy legacy_read on public.store_settings for select using(true);`);
 await assert.rejects(db.exec(sql),/RLS policies require review/);await db.exec('rollback');
 assert.equal((await db.query("select count(*)::int n from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name='version'")).rows[0].n,0,'Failed adoption rolls back schema additions');
 assert.equal((await db.query("select count(*)::int n from pg_policies where tablename='store_settings' and policyname='legacy_read'")).rows[0].n,1,'Existing policies preserved');
 await db.exec('drop policy legacy_read on public.store_settings');
 await db.exec(`insert into public.store_settings(section,values) values('payments','{"secretKey":"test-only-fixture"}')`);
 await assert.rejects(db.exec(sql),/requires review before exposing/);await db.exec('rollback');
 assert.equal((await db.query("select values->>'secretKey' saved from public.store_settings")).rows[0].saved,'test-only-fixture');
 await db.close();console.log('PASS: Existing policies and unknown sensitive settings abort installation and remain untouched.');
}
