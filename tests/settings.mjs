import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createDatabase,applyMigrations } from './supabase-fixture.mjs';
const db=await createDatabase();
try{
 await applyMigrations(db);
 const admin='40000000-0000-4000-8000-000000000001',staff='40000000-0000-4000-8000-000000000002';
 for(const [id,email] of [[admin,'settings-admin@example.test'],[staff,'settings-staff@example.test']]){await db.query('insert into auth.users(id,email) values($1,$2)',[id,email]);await db.query('insert into auth.sessions(id,user_id) values($1,$1)',[id]);}
 await db.query(`insert into public.admin_roles("userId",role) values($1,'SUPER_ADMIN'),($2,'SUPPORT')`,[admin,staff]);
 async function asUser(id,fn){await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);try{return await fn();}finally{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");}}
 const rpc=async(name,args)=>(await db.query(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) result`,args)).rows[0].result;
 const edits={general:{storeName:'Persisted NOBELLE'},store:{supportEmail:'help@example.test'},payments:{checkoutLabel:'Secure checkout'},shipping:{freeDeliveryThreshold:50000},orders:{returnPeriodDays:21},products:{lowStockThreshold:3},notifications:{newOrder:{dashboard:false,email:false}},website:{announcementEnabled:true,announcementText:'New collection available'}};
 for(const [section,edit] of Object.entries(edits)){
  const before=(await db.query('select * from public.store_settings where section=$1',[section])).rows[0];
  const values={...before.values,...edit};
  await asUser(admin,()=>rpc('save_settings',[section,values,before.version]));
  const saved=await asUser(admin,async()=>(await db.query('select values,version from public.store_settings where section=$1',[section])).rows[0]);
  assert.deepEqual(saved.values,values,`${section} persists after a separate session-scoped read`);assert.equal(saved.version,before.version+1);
  await assert.rejects(asUser(staff,()=>rpc('save_settings',[section,values,saved.version])),/Access denied/);
  await assert.rejects(asUser(admin,()=>rpc('save_settings',[section,before.values,before.version])),/changed in another session/);
 }
 await asUser(admin,()=>db.query('update public.profiles set name=$1,phone=$2 where id=$3',['Saved admin name','08012345678',admin]));
 assert.equal((await asUser(admin,()=>db.query('select name from public.profiles where id=$1',[admin]))).rows[0].name,'Saved admin name');
 const stamp=(await db.query(`select "updatedAt"::text stamp from public.policies where id='privacy'`)).rows[0].stamp;
 await asUser(admin,()=>rpc('save_policy',['privacy',{title:'Privacy',content:'<p>Published terms</p>',status:'PUBLISHED',version:stamp}]));
 const nextStamp=(await db.query(`select "updatedAt"::text stamp from public.policies where id='privacy'`)).rows[0].stamp;
 await asUser(admin,()=>rpc('save_policy',['privacy',{title:'Draft privacy',content:'<p>Private draft</p>',status:'DRAFT',version:nextStamp}]));
 await db.exec('set role anon');const published=await rpc('published_policy',['privacy']);assert.equal(published.content,'<p>Published terms</p>');assert.equal((await db.query('select * from public.policies')).rows.length,0);await db.exec('reset role');
 await asUser(admin,()=>rpc('save_settings',['permissions',{roles:{SUPPORT:['VIEW_ORDERS','VIEW_CUSTOMERS']}},null]));
 assert.equal(await asUser(staff,()=>rpc('has_permission',['VIEW_ORDERS'])),true);assert.equal(await asUser(staff,()=>rpc('has_permission',['MANAGE_SETTINGS'])),false);
 await assert.rejects(asUser(staff,()=>rpc('save_settings',['permissions',{roles:{SUPPORT:['MANAGE_STAFF']}},null])),/Super Admin required/);
 const recovery=readFileSync('supabase/SETTINGS_RECOVERY.sql','utf8');
 const savedRows=(await db.query('select section,values,version from public.store_settings order by section')).rows;
 await db.exec(recovery);await db.exec(recovery);
 assert.deepEqual((await db.query('select section,values,version from public.store_settings order by section')).rows,savedRows,'Recovery is repeatable and never overwrites saved configuration');
 const profileCount=(await db.query('select count(*)::int n from public.profiles')).rows[0].n;
 // Simulate the reported missing table only inside the isolated test database.
 await db.exec('drop table public.store_settings');await db.exec(recovery);
 assert.equal((await db.query('select count(*)::int n from public.store_settings')).rows[0].n,8);
 assert.equal((await db.query('select count(*)::int n from public.profiles')).rows[0].n,profileCount,'Recovering settings leaves customer profiles intact');
 const row=(await db.query("select * from public.store_settings where section='general'")).rows[0];
 await asUser(admin,()=>rpc('save_settings',['general',{...row.values,storeName:'Recovered store'},row.version]));
 assert.equal((await db.query("select values->>'storeName' name from public.store_settings where section='general'")).rows[0].name,'Recovered store');
 console.log('PASS: All eight stored Settings sections persist; profile, policies and staff permissions remain protected; repeated/missing-table recovery preserves saved rows and customer profiles.');
}finally{await db.close();}
