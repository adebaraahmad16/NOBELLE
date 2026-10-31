import { service,verifyPayment,verifyRefund } from '../_shared/runtime.ts';
async function valid(raw:string,signature:string,key:string){
 const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-512'},false,['sign']);
 const result=new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(raw)));
 const expected=Array.from(result,b=>b.toString(16).padStart(2,'0')).join('');
 if(expected.length!==signature.length)return false;
 let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^signature.charCodeAt(i);return diff===0;
}
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const raw=await req.text();if(raw.length>1048576)return new Response('Payload too large',{status:413});
 const sig=req.headers.get('x-paystack-signature')||'';
 const keys=[Deno.env.get('PAYSTACK_SECRET_KEY_TEST'),Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')].filter(Boolean) as string[];
 let key='';for(const candidate of keys)if(await valid(raw,sig,candidate))key=candidate;
 if(!key)return new Response('Invalid signature',{status:401});
 try{
  const event=JSON.parse(raw),admin=service();
  if(event.event==='charge.success')await verifyPayment(admin,event.data.reference);
  if(['refund.processed','refund.failed'].includes(event.event)){
   const gatewayId=String(event.data.id);
   const {data:r,error}=await admin.from('refunds').select('*,payment:payments(*)').eq('gatewayId',gatewayId).maybeSingle();if(error)throw error;
   if(!r)return new Response('Refund mapping not yet available',{status:503});
   await verifyRefund(admin,r);
  }
  return new Response('ok');
 }catch(error){console.error('Webhook processing failed',error instanceof Error?error.message:'Unknown error');return new Response('Retry later',{status:503});}
});
