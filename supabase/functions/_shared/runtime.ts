import { createClient } from 'npm:@supabase/supabase-js@2';
export const service=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
export function cors(req:Request){
 const origin=req.headers.get('origin')||'';
 const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'http://localhost:5173').split(',').map(v=>v.trim());
 if(origin&&!allowed.includes(origin))throw new Error('Origin not allowed');
 return {'Access-Control-Allow-Origin':origin||allowed[0],'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type, x-worker-secret','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
}
export async function value(query:PromiseLike<any>){const {data,error}=await query;if(error)throw new Error(error.message);return data;}
export async function caller(req:Request){
 const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
 if(!token)throw new Error('Authentication required');
 const admin=service();const {data,error}=await admin.auth.getUser(token);
 if(error||!data.user)throw new Error('Authentication required');
 const profile=await value(admin.from('profiles').select('isActive').eq('id',data.user.id).single());
 if(!profile.isActive)throw new Error('Account inactive');
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 if(!await value(client.rpc('is_customer')))throw new Error('Session expired. Please sign in again.');
 return {user:data.user,client,admin,token};
}
export function endpoint(handler:(req:Request)=>Promise<unknown>){Deno.serve(async req=>{
 let headers:Record<string,string>={};
 try{headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405,headers});const data=await handler(req);return Response.json(data,{headers});}
 catch(error){return Response.json({error:error instanceof Error?error.message:'Operation failed'},{status:400,headers});}
});}
export async function paystack(path:string,key:string,body?:unknown){
 const r=await fetch(`https://api.paystack.co${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
 const result=await r.json();if(!r.ok||!result.status)throw new Error(result.message||'Payment gateway unavailable');return result.data;
}
export async function paymentConfig(admin:any){
 const row=await value(admin.from('store_settings').select('values').eq('section','payments').single());
 const mode=row.values.mode;const key=Deno.env.get(mode==='LIVE'?'PAYSTACK_SECRET_KEY_LIVE':'PAYSTACK_SECRET_KEY_TEST')||'';
 if(key&&!(mode==='LIVE'?key.startsWith('sk_live_'):key.startsWith('sk_test_')))throw new Error('Payment key does not match configured mode');
 return {...row.values,key};
}
export async function verifyPayment(admin:any,reference:string){
 const p=await value(admin.from('payments').select('*').eq('reference',reference).single());
 const key=Deno.env.get(p.mode==='LIVE'?'PAYSTACK_SECRET_KEY_LIVE':'PAYSTACK_SECRET_KEY_TEST');if(!key)throw new Error('Payment credentials not configured');
 const tx=await paystack(`/transaction/verify/${encodeURIComponent(reference)}`,key);
 if(tx.reference!==p.reference||Number(tx.amount)!==Math.round(Number(p.amount)*100)||tx.currency!==p.currency||tx.domain!==(p.mode==='LIVE'?'live':'test'))throw new Error('Payment verification mismatch');
 if(!['success','failed','abandoned','reversed'].includes(tx.status))return p;
 return value(admin.rpc('settle_payment',{payment_reference:reference,gateway_id:String(tx.id),amount_minor:tx.amount,payment_currency:tx.currency,gateway_mode:p.mode,successful:tx.status==='success'}));
}
export async function verifyRefund(admin:any,refund:any){
 const key=Deno.env.get(refund.payment.mode==='LIVE'?'PAYSTACK_SECRET_KEY_LIVE':'PAYSTACK_SECRET_KEY_TEST');if(!key)throw new Error('Payment credentials not configured');
 const tx=await paystack(`/refund/${encodeURIComponent(refund.gatewayId)}`,key);
 const transactionId=typeof tx.transaction==='object'?tx.transaction.id:tx.transaction;
 if(String(tx.id)!==refund.gatewayId||String(transactionId)!==refund.payment.gatewayId||Number(tx.amount)!==Math.round(Number(refund.amount)*100)||tx.currency!==refund.payment.currency||tx.domain!==(refund.payment.mode==='LIVE'?'live':'test'))throw new Error('Refund verification mismatch');
 await value(admin.rpc('settle_refund',{refund_id:refund.id,gateway_id:refund.gatewayId,refund_status:tx.status==='processed'?'SUCCESS':tx.status==='failed'?'FAILED':'PENDING'}));
 return tx;
}
