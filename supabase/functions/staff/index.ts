import { endpoint,caller,value,paymentConfig } from '../_shared/runtime.ts';
endpoint(async req=>{
 const {user,client,admin}=await caller(req),body=await req.json();
 const ownRole=await value(admin.from('admin_roles').select('*').eq('userId',user.id).eq('isActive',true).single());
 if(body.action==='security'){
  // Never fabricate device/session records. Supabase manages sessions centrally.
  const logs=await value(admin.from('activity_logs').select('*').eq('adminId',user.id).eq('action','LOGIN').order('createdAt',{ascending:false}).limit(30));
  return {sessions:[],history:logs.map((r:any)=>({id:r.id,date:r.createdAt,device:r.metadata.device||'Browser',browser:r.metadata.browser||'',status:'SUCCESS'})),managedBySupabase:true};
 }
 if(body.action==='payment-configuration'){
  if(!await value(client.rpc('has_permission',{required:'MANAGE_SETTINGS'})))throw new Error('Access denied');
  return {modes:['TEST','LIVE'].map(mode=>({mode,configured:!!Deno.env.get(mode==='LIVE'?'PAYSTACK_SECRET_KEY_LIVE':'PAYSTACK_SECRET_KEY_TEST'),publicKey:Deno.env.get(mode==='LIVE'?'PAYSTACK_PUBLIC_KEY_LIVE':'PAYSTACK_PUBLIC_KEY_TEST')||''}))};
 }
 if(ownRole.role!=='SUPER_ADMIN')throw new Error('Only a Super Admin can manage staff');
 if(body.method==='GET')return value(admin.from('admin_roles').select('*,profile:profiles(*)').order('createdAt',{ascending:false})).then(rows=>rows.map((r:any)=>({...r.profile,role:r.role,isActive:r.isActive})));
 if(!['POST','PATCH','DELETE'].includes(body.method))throw new Error('Invalid staff operation');
 if(body.id===user.id&&(body.method==='DELETE'||!body.isActive||body.role!==ownRole.role))throw new Error('You cannot disable or change your own role');
 if(body.method==='DELETE'){await value(admin.from('admin_roles').delete().eq('userId',body.id));return {removed:true};}
 if(!['SUPER_ADMIN','MANAGER','ORDER_MANAGER','INVENTORY_MANAGER','MARKETING_MANAGER','SUPPORT'].includes(body.role))throw new Error('Invalid role');
 if(!body.name||!body.email||(!body.id&&!body.password)||body.password&&body.password.length<12)throw new Error('Name, email and a strong password are required');
 let id=body.id;
 if(id){
  const update:any={};if(body.password)update.password=body.password;
  const p=await value(admin.from('profiles').select('email').eq('id',id).single());if(body.email!==p.email)update.email=body.email;
  if(Object.keys(update).length){const {error}=await admin.auth.admin.updateUserById(id,update);if(error)throw error;}
 }else{
  // Existing customers can be promoted by UUID via SQL; do not hijack email accounts.
  const {data,error}=await admin.auth.admin.createUser({email:body.email,password:body.password,email_confirm:true,user_metadata:{name:body.name}});if(error)throw error;id=data.user.id;
 }
 await value(admin.from('admin_roles').upsert({userId:id,role:body.role,isActive:body.isActive},{onConflict:'userId'}));
 await value(admin.from('profiles').update({name:body.name}).eq('id',id));
 await value(admin.from('activity_logs').insert({adminId:user.id,action:body.method,entity:'admin_roles',entityId:id}));return {saved:true};
});
