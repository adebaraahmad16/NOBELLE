import { endpoint,caller,value } from '../_shared/runtime.ts';
endpoint(async req=>{
 const {client,admin}=await caller(req);const {payload}=await req.json();
 await value(admin.rpc('expire_orders'));
 return value(client.rpc('create_checkout',{payload}));
});
