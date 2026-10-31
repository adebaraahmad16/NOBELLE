import { endpoint,caller,service,value } from '../_shared/runtime.ts';
endpoint(async req=>{
 const expected=Deno.env.get('EMAIL_WORKER_SECRET');
 if(!expected||req.headers.get('x-worker-secret')!==expected){
  const {client}=await caller(req);if(!await value(client.rpc('has_permission',{required:'MANAGE_SETTINGS'})))throw new Error('Access denied');
 }
 const apiKey=Deno.env.get('RESEND_API_KEY'),sender=Deno.env.get('EMAIL_FROM');if(!apiKey||!sender)throw new Error('Set RESEND_API_KEY and EMAIL_FROM before enabling business email delivery');
 const admin=service(),jobs=await value(admin.rpc('claim_email_batch'));let sent=0;
 for(const job of jobs){
  try{
   const link=job.linkUrl?.startsWith('/')?`${Deno.env.get('SITE_URL')}${job.linkUrl}`:'';
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`nobelle-${job.id}`},
    body:JSON.stringify({from:sender,to:[job.recipient],subject:`NOBELLE: ${job.subject}`,text:`${job.body}${link?`\n\n${link}`:''}`}),signal:AbortSignal.timeout(25000)});
   const result=await response.json();if(!response.ok||!result.id)throw new Error(result.message||'Email provider rejected the request');
   await value(admin.from('email_outbox').update({status:'SENT',providerId:result.id,lockedUntil:null,lastError:null}).eq('id',job.id));sent++;
  }catch(error){
   await value(admin.from('email_outbox').update({status:job.attempts>=5?'FAILED':'PENDING',lockedUntil:null,notBefore:new Date(Date.now()+60000*2**job.attempts).toISOString(),lastError:error instanceof Error?error.message:'Email delivery failed'}).eq('id',job.id));
  }
 }
 return {processed:jobs.length,sent};
});
