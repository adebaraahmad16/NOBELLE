import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDatabase,applyMigrations} from './supabase-fixture.mjs';
const db=await createDatabase();
try{
 await applyMigrations(db);
 const admin='50000000-0000-4000-8000-000000000001',customer='50000000-0000-4000-8000-000000000002';
 for(const [id,email] of [[admin,'category-admin@example.test'],[customer,'category-customer@example.test']]){await db.query('insert into auth.users(id,email) values($1,$2)',[id,email]);await db.query('insert into auth.sessions(id,user_id) values($1,$1)',[id]);}
 await db.query(`insert into public.admin_roles("userId",role) values($1,'SUPER_ADMIN')`,[admin]);
 async function asUser(id,fn){await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);try{return await fn();}finally{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");}}
 const manage=async(id,payload,operation)=>(await db.query('select public.manage_category($1,$2,$3) result',[id,payload,operation])).rows[0].result;
 const category=await asUser(admin,()=>manage(null,{name:'Ankara Dresses',description:'Original description',imageUrl:'https://example.test/category.webp',isActive:false},'POST'));
 assert.equal(category.slug,'ankara-dresses');assert.ok(category.createdAt);assert.ok(category.updatedAt);
 await db.exec('set role anon');assert.equal((await db.query('select * from public.product_categories')).rows.length,0);await assert.rejects(manage(null,{name:'Unauthorized'},'POST'),/permission denied/);await db.exec('reset role');
 await asUser(customer,async()=>{await assert.rejects(manage(category.id,{isActive:true},'PATCH'),/Access denied/);await assert.rejects(db.query(`update public.product_categories set "isActive"=true`),/permission denied/);});
 const renamed=await asUser(admin,()=>manage(category.id,{name:'Ankara Occasion Dresses'},'PATCH'));
 assert.equal(renamed.slug,category.slug,'Renaming preserves existing category links');assert.equal(renamed.imageUrl,category.imageUrl);assert.equal(renamed.description,category.description);
 await asUser(admin,()=>manage(category.id,{isActive:true},'PATCH'));
 await db.exec('set role anon');assert.equal((await db.query('select * from public.product_categories')).rows.length,1);await db.exec('reset role');
 await assert.rejects(asUser(admin,()=>manage(null,{name:'Duplicate',slug:category.slug},'POST')),/duplicate key/);
 const product=(await db.query(`insert into public.products(name,slug,sku,price,"categoryId") values('Test product','category-test-product','CATEGORY-TEST',10000,$1) returning id`,[category.id])).rows[0];
 await assert.rejects(asUser(admin,()=>manage(category.id,{},'DELETE')),/used by products/);
 await asUser(admin,()=>manage(category.id,{isActive:false},'PATCH'));
 assert.equal((await db.query('select "categoryId" from public.products where id=$1',[product.id])).rows[0].categoryId,category.id);
 const unused=await asUser(admin,()=>manage(null,{name:'Unused Category'},'POST'));
 assert.equal((await asUser(admin,()=>manage(unused.id,{},'DELETE'))).deleted,true);
 assert.equal((await db.query('select count(*)::int n from public.product_categories where id=$1',[unused.id])).rows[0].n,0);
 const recovery=readFileSync('supabase/CATEGORY_SETTINGS_RECOVERY.sql','utf8');
 const before=(await db.query('select to_jsonb(c) record from public.product_categories c order by id')).rows;
 await db.exec(recovery);await db.exec(recovery);
 assert.deepEqual((await db.query('select to_jsonb(c) record from public.product_categories c order by id')).rows,before,'Repeated migration preserves every existing category field');
 const settings=(await db.query("select * from public.store_settings where section='general'")).rows[0];assert.ok(settings.version>=1);
 assert.equal((await db.query("select count(*)::int n from pg_publication_tables where pubname='supabase_realtime' and tablename='product_categories'")).rows[0].n,1);
 await db.exec(`alter table public.product_categories rename column "imageUrl" to image_url;
 alter table public.product_categories rename column "isActive" to is_active;
 alter table public.product_categories rename column "createdAt" to created_at;
 alter table public.product_categories rename column "updatedAt" to updated_at;`);
 await db.exec(recovery);
 const repaired=(await db.query('select * from public.product_categories where id=$1',[category.id])).rows[0];
 assert.equal(repaired.imageUrl,repaired.image_url);
 assert.equal(repaired.isActive,repaired.is_active);
 assert.equal(new Date(repaired.createdAt).toISOString(),new Date(repaired.created_at).toISOString());
 assert.equal(new Date(repaired.updatedAt).toISOString(),new Date(repaired.updated_at).toISOString());
 assert.equal(repaired.name,'Ankara Occasion Dresses');
 console.log('PASS: Authorized category create/read/edit/activate/deactivate/delete, stable slugs, duplicate rejection, protected product references, RLS and idempotent recovery.');
}finally{await db.close();}
