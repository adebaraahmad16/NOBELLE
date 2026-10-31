import { endpoint,service,value } from '../_shared/runtime.ts';
endpoint(async req=>{
 const body=await req.json(),admin=service();
 if(body.website)throw new Error('Unable to submit this form');
 const email=String(body.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error('Enter a valid email');
 if(!['contact','newsletter'].includes(body.kind))throw new Error('Invalid form');
 const salt=Deno.env.get('RATE_LIMIT_SALT');if(!salt)throw new Error('Contact form rate limiting is not configured');
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('cf-connecting-ip')||'unknown';
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${salt}:${ip}:${body.kind}`));
 const limitKey=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
 if(!await value(admin.rpc('consume_rate_limit',{limit_key:limitKey,maximum:5,seconds:3600})))throw new Error('Too many submissions. Please try again later.');
 // Optional Turnstile secret makes captcha mandatory when enabled.
 const captcha=Deno.env.get('TURNSTILE_SECRET_KEY');
 if(captcha){const check=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:captcha,response:body.captchaToken||'',remoteip:ip})});if(!(await check.json()).success)throw new Error('Please complete the spam protection challenge');}
 if(body.kind==='newsletter'){await value(admin.from('newsletter_subscribers').upsert({email},{onConflict:'email'}));return {saved:true};}
 const clean:Record<string,string>={email};for(const [key,max] of [['name',120],['subject',200],['message',5000]] as const){const input=String(body[key]||'').trim();if(!input||input.length>max)throw new Error(`Enter a valid ${key} (maximum ${max} characters)`);clean[key]=input;}
 await value(admin.from('contact_messages').insert(clean));return {saved:true};
});
