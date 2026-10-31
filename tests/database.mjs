import { PGlite } from '@electric-sql/pglite';
import { readFileSync,readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { storefrontSchema,realtimeTables } from '../src/lib/supabase-schema.js';
const db=new PGlite();
await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',last_sign_in_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users,created_at timestamptz default now(),updated_at timestamptz default now(),user_agent text);
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id',nullif(current_setting('request.jwt.claim.sub',true),''))$$;
 grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 create publication supabase_realtime;
 create table public.external_reference(id integer primary key,note text);
 grant select on public.external_reference to anon;
 create function public.external_health() returns integer language sql as $$select 1$$;
 grant execute on function public.external_health() to anon;
`);
for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()){
 const sql=readFileSync(`supabase/migrations/${file}`,'utf8').replace('create extension if not exists pgcrypto;','');
 try{await db.exec(sql);console.log(`Migration OK: ${file}`);}catch(e){console.error(`Migration FAILED: ${file}`,e.message);throw e;}
}
const diagnostics=await db.exec(readFileSync('supabase/diagnostics.sql','utf8'));
assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.external_reference'::regclass")).rows[0].relrowsecurity,false,'Unrelated tables retain their RLS configuration');
assert.equal((await db.query("select has_table_privilege('anon','public.external_reference','SELECT') allowed")).rows[0].allowed,true,'Unrelated table grants remain unchanged');
assert.equal((await db.query("select has_function_privilege('anon','public.external_health()','EXECUTE') allowed")).rows[0].allowed,true,'Unrelated function grants remain unchanged');
for(const row of diagnostics[0].rows){assert.equal(row.table_exists,true);assert.equal(row.rls_enabled,true);assert.deepEqual(row.missing_columns,[]);assert.equal(row.authenticated_select_grant,true);if(row.table_name in storefrontSchema)assert.equal(row.anon_select_grant,true);if(realtimeTables.includes(row.table_name))assert.equal(row.realtime_enabled,true);}
for(const result of diagnostics)for(const row of result.rows){if('constraint_present' in row)assert.equal(row.constraint_present,true);if('index_present' in row)assert.equal(row.index_present,true);if('type_matches' in row){assert.equal(row.type_matches,true);assert.equal(row.nullability_matches,true);}if('dependency_exists' in row)assert.equal(row.dependency_exists,true);}
const admin='00000000-0000-4000-8000-000000000001',alice='00000000-0000-4000-8000-000000000002',bob='00000000-0000-4000-8000-000000000003';
for(const [id,email] of [[admin,'admin@example.test'],[alice,'alice@example.test'],[bob,'bob@example.test']]){await db.query('insert into auth.users(id,email) values($1,$2)',[id,email]);await db.query('insert into auth.sessions(id,user_id) values($1,$1)',[id]);}
await db.query(`insert into public.admin_roles("userId",role) values($1,'SUPER_ADMIN')`,[admin]);
async function asUser(id,fn){await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);try{return await fn();}finally{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");}}
const rpc=async(name,args)=>{const params=args.map((_,i)=>`$${i+1}`).join(',');return (await db.query(`select public.${name}(${params}) result`,args)).rows[0].result;};
const product=await asUser(admin,()=>rpc('admin_write',['products',null,{name:'Test dress',sku:'TEST-1',price:25000,isActive:true,variants:[{sku:'TEST-S',size:'S',color:'Burgundy',quantity:2,priceDiff:0}]},'POST']));
const variant=(await db.query('select id from public.product_variants where "productId"=$1',[product.id])).rows[0].id;
const zone=await asUser(admin,()=>rpc('admin_write',['delivery-zones',null,{name:'Lagos',country:'Nigeria',states:['Lagos'],fee:2000,estimatedDays:'2 days'},'POST']));
const cartA=(await asUser(alice,()=>db.query('insert into public.carts("customerId") values($1) returning id',[alice]))).rows[0].id;
await asUser(alice,()=>db.query('insert into public.cart_items("cartId","variantId",quantity) values($1,$2,2)',[cartA,variant]));
const payload={idempotencyKey:'10000000-0000-4000-8000-000000000001',deliveryZoneId:zone.id,shippingAddress:{recipient:'Alice',phoneNumber:'08012345678',street:'Test street',city:'Lagos',state:'Lagos',country:'Nigeria'}};
const order=await asUser(alice,()=>rpc('create_checkout',[payload]));
assert.equal(Number(order.totalAmount),52000);assert.equal(order.status,'PENDING');
assert.equal((await asUser(alice,()=>rpc('create_checkout',[payload]))).id,order.id,'Checkout idempotency');
await asUser(bob,async()=>{assert.equal((await db.query('select * from public.orders')).rows.length,0,'Orders isolated by customer');assert.equal((await db.query('select * from public.profiles')).rows.length,1,'Profiles isolated');await assert.rejects(rpc('admin_write',['products',product.id,{price:1},'PATCH']),/Access denied/);await assert.rejects(db.query('update public.orders set "paymentStatus"=\'SUCCESS\''),/permission denied/);await assert.rejects(db.query('insert into public.admin_roles("userId",role) values($1,\'SUPER_ADMIN\')',[bob]),/permission denied/);});
await asUser(alice,async()=>{await assert.rejects(rpc('settle_payment',['x','x',1,'NGN','TEST',true]),/permission denied/);await assert.rejects(db.query('update public.profiles set "isActive"=false where id=$1',[alice]),/permission denied/);});
assert.equal((await db.query('select reserved from public.inventory where "variantId"=$1',[variant])).rows[0].reserved,2);
// A second cart cannot reserve stock already held by the first checkout.
await assert.rejects(asUser(bob,async()=>{const c=(await db.query('insert into public.carts("customerId") values($1) returning id',[bob])).rows[0].id;await db.query('insert into public.cart_items("cartId","variantId",quantity) values($1,$2,1)',[c,variant]);}),/not available/);
await db.query('insert into public.payments("orderId",reference,amount,currency,mode) values($1,\'TEST-REF\',52000,\'NGN\',\'TEST\')',[order.id]);
await assert.rejects(rpc('settle_payment',['TEST-REF','123',1,'NGN','TEST',true]),/mismatch/);
await rpc('settle_payment',['TEST-REF','123',5200000,'NGN','TEST',true]);
await rpc('settle_payment',['TEST-REF','123',5200000,'NGN','TEST',true]);
const inventory=(await db.query('select quantity,reserved from public.inventory where "variantId"=$1',[variant])).rows[0];assert.deepEqual(inventory,{quantity:0,reserved:0},'Payment deducts stock once');
await asUser(admin,async()=>{await rpc('transition_order',[order.id,'CONFIRMED']);await rpc('transition_order',[order.id,'PROCESSING']);await rpc('transition_order',[order.id,'SHIPPED']);await rpc('transition_order',[order.id,'DELIVERED']);await assert.rejects(rpc('transition_order',[order.id,'PROCESSING']),/Invalid order status/);});
const report=await asUser(admin,()=>rpc('admin_report',['-infinity','infinity']));assert.equal(Number(report.revenue),52000);assert.equal(Number(report.productsSold),2);
const oi=(await db.query('select id from public.order_items where "orderId"=$1',[order.id])).rows[0];
const ret=await asUser(alice,()=>rpc('request_return',[{orderId:order.id,reason:'Wrong fit',items:[{orderItemId:oi.id,quantity:1}]}]));
await asUser(admin,async()=>{await rpc('transition_return',[ret.id,'APPROVED']);await rpc('transition_return',[ret.id,'RECEIVED']);});
const refund=await asUser(admin,()=>rpc('prepare_refund',[ret.id]));assert.equal(Number(refund.amount),25000);
await rpc('settle_refund',[refund.id,'R123','SUCCESS']);await rpc('settle_refund',[refund.id,'R123','SUCCESS']);
assert.equal((await db.query('select quantity from public.inventory where "variantId"=$1',[variant])).rows[0].quantity,1,'Refund restocks once');
await asUser(alice,()=>rpc('save_address',[null,{recipient:'Alice',phoneNumber:'08012345678',street:'Street',city:'Lagos',state:'Lagos',isDefault:true}]));
await asUser(bob,async()=>{assert.equal((await db.query('select * from public.customer_addresses')).rows.length,0);});
await asUser(admin,async()=>{const row=(await db.query("select * from public.store_settings where section='general'")).rows[0];await rpc('save_settings',['general',{...row.values,storeName:'NOBELLE tested'},row.version]);await assert.rejects(rpc('save_settings',['general',row.values,row.version]),/changed in another session/);});
// Expired and failed orders release reservations and coupon allocations.
await asUser(admin,async()=>{
 await rpc('admin_write',['discounts',null,{productId:product.id,discountType:'PERCENTAGE',value:10},'POST']);
 await rpc('admin_write',['coupons',null,{code:'TESTSAVE',discountType:'FIXED_AMOUNT',value:1000,usageLimit:1},'POST']);
});
const cartB=(await db.query('select id from public.carts where "customerId"=$1',[bob])).rows[0].id;
await asUser(bob,()=>db.query('insert into public.cart_items("cartId","variantId",quantity) values($1,$2,1)',[cartB,variant]));
const bobOrder=await asUser(bob,()=>rpc('create_checkout',[{...payload,idempotencyKey:'20000000-0000-4000-8000-000000000001',couponCode:'TESTSAVE'}]));
assert.equal(Number(bobOrder.subtotal),22500);assert.equal(Number(bobOrder.totalAmount),23500,'Product and coupon discounts calculated in PostgreSQL');
await db.query('update public.orders set "expiresAt"=now()-interval \'1 minute\' where id=$1',[bobOrder.id]);
assert.equal(await rpc('expire_orders',[]),1);
assert.equal((await db.query('select reserved from public.inventory where "variantId"=$1',[variant])).rows[0].reserved,0);
assert.equal((await db.query('select count(*)::int n from public.coupon_usage')).rows[0].n,0);
await asUser(bob,()=>db.query('insert into public.cart_items("cartId","variantId",quantity) values($1,$2,1)',[cartB,variant]));
const failedOrder=await asUser(bob,()=>rpc('create_checkout',[{...payload,idempotencyKey:'20000000-0000-4000-8000-000000000002',couponCode:'TESTSAVE'}]));
await db.query('insert into public.payments("orderId",reference,amount,currency,mode) values($1,\'FAILED-REF\',23500,\'NGN\',\'TEST\')',[failedOrder.id]);
await rpc('settle_payment',['FAILED-REF','456',2350000,'NGN','TEST',false]);
assert.equal((await db.query('select status from public.orders where id=$1',[failedOrder.id])).rows[0].status,'CANCELLED');
await rpc('settle_payment',['FAILED-REF','456',2350000,'NGN','TEST',true]);
assert.equal((await db.query('select quantity from public.inventory where "variantId"=$1',[variant])).rows[0].quantity,1,'Late verified payment cannot consume released stock');
const netReport=await asUser(admin,()=>rpc('admin_report',['-infinity','infinity']));assert.equal(Number(netReport.productsSold),1);assert.equal(Number(netReport.revenue),27000);
assert.equal(Number((await asUser(admin,()=>rpc('admin_customer',[alice]))).totalSpent),27000,'Customer spending includes verified refunds');
await asUser(admin,async()=>{await rpc('admin_write',['coupons',null,{code:'ZERO',discountType:'FIXED_AMOUNT',value:100000},'POST']);await rpc('admin_write',['delivery-zones',zone.id,{fee:0},'PATCH']);});
await asUser(bob,()=>db.query('insert into public.cart_items("cartId","variantId",quantity) values($1,$2,1)',[cartB,variant]));
await assert.rejects(asUser(bob,()=>rpc('create_checkout',[{...payload,idempotencyKey:'20000000-0000-4000-8000-000000000003',couponCode:'ZERO'}])),/positive total/);
assert.equal((await db.query('select reserved from public.inventory where "variantId"=$1',[variant])).rows[0].reserved,0,'Unsupported zero-total checkout does not reserve stock');
await asUser(admin,()=>rpc('admin_write',['variants',variant,{priceDiff:-30000},'PATCH']));
await assert.rejects(asUser(bob,()=>rpc('create_checkout',[{...payload,idempotencyKey:'20000000-0000-4000-8000-000000000004'}])),/Invalid variant price/);
await asUser(admin,()=>rpc('admin_write',['variants',variant,{priceDiff:0},'PATCH']));
await db.query('update auth.users set last_sign_in_at=now() where id=$1',[admin]);
const security=await asUser(admin,()=>rpc('admin_security_data',[]));assert.equal(security.sessions.length,1);assert.equal(security.sessions[0].current,true);assert.equal(security.history.length,1);
await asUser(admin,()=>rpc('revoke_admin_session',[bob]));assert.equal((await db.query('select count(*)::int n from auth.sessions where id=$1',[bob])).rows[0].n,1,'Staff cannot revoke another user through own-session RPC');
await db.query('delete from auth.sessions where id=$1',[bob]);
await asUser(bob,async()=>{assert.equal((await db.query('select * from public.profiles')).rows.length,0);assert.equal(await rpc('is_customer',[]),false);await assert.rejects(rpc('create_checkout',[payload]),/sign in/);});
await asUser(admin,async()=>{const cfg=(await db.query("select * from public.store_settings where section='notifications'")).rows[0];await rpc('save_settings',['notifications',{...cfg.values,newOrder:{dashboard:false,email:true}},cfg.version]);});
const before=(await db.query("select count(*)::int n from public.admin_notifications where type='newOrder'")).rows[0].n;
await db.query("select private.notify('newOrder','New order','Integration test','VIEW_ORDERS','/admin/orders')");
assert.equal((await db.query("select count(*)::int n from public.admin_notifications where type='newOrder'")).rows[0].n,before,'Dashboard preference respected');
const emailJobs=(await db.query('select * from public.claim_email_batch()')).rows;assert.equal(emailJobs.length,1);assert.equal(emailJobs[0].recipient,'admin@example.test');assert.equal(emailJobs[0].attempts,1);
assert.equal((await db.query('select * from public.claim_email_batch()')).rows.length,0,'Claimed emails cannot be picked by another worker');
await asUser(alice,async()=>{assert.equal((await db.query('select * from public.email_outbox')).rows.length,0);await assert.rejects(rpc('claim_email_batch',[]),/permission denied/);});
await db.exec('set role anon');
assert.equal((await db.query('select * from public.profiles')).rows.length,0);assert.equal((await db.query('select * from public.orders')).rows.length,0);assert.equal((await db.query('select * from public.products')).rows.length,1);
await db.exec('reset role');
console.log('PASS: RLS isolation, privilege escalation prevention, checkout totals/idempotency, stock reservation, payment verification/idempotency, order transitions, returns/refunds, reporting, settings and addresses.');
await db.close();
