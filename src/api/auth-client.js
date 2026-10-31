// Existing pages use this facade; all persistence now goes through Supabase.
import { supabase, requireSupabase } from '../lib/supabase';
import { request, checked, currentUser, adminIdentity } from './supabase-service';
import { publicReads } from './read-cache.js';
let accessToken=null;
let activeRole='customer';
let lastUserId;
export const token=()=>accessToken;
export function setToken(_role,value){accessToken=value;}
export class ApiError extends Error {constructor(message,status,errors=[]){super(message);this.status=status;this.errors=errors;}}
if(supabase){
  const {data}=supabase.auth.onAuthStateChange((event,session)=>{
    accessToken=session?.access_token||null;
    const userId=session?.user?.id;
    if(event==='INITIAL_SESSION'){lastUserId=userId;return;}
    if(event==='SIGNED_IN'&&lastUserId===userId)return;
    lastUserId=userId;
    publicReads.invalidate();
    if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED','PASSWORD_RECOVERY'].includes(event))return;
    // Auth listeners must return before another Auth request is made.
    setTimeout(()=>{
      if(event==='SIGNED_OUT')for(const role of ['customer','admin'])window.dispatchEvent(new CustomEvent('nobelle-session-expired',{detail:role}));
      else window.dispatchEvent(new CustomEvent('nobelle-session-changed',{detail:activeRole}));
    },0);
  });
  if(import.meta.hot)import.meta.hot.dispose(()=>data.subscription.unsubscribe());
}
if(typeof window!=='undefined'){
  const invalidate=()=>publicReads.invalidate();
  for(const event of ['focus','nobelle-data-changed','nobelle-settings-updated'])window.addEventListener(event,invalidate);
  if(import.meta.hot)import.meta.hot.dispose(()=>{for(const event of ['focus','nobelle-data-changed','nobelle-settings-updated'])window.removeEventListener(event,invalidate);});
}
export async function api(path,options={}){
  const {method='GET',body={},role}=options;
  const p=path.replace(/^\/admin/,'');
  let result;
  if(p.startsWith('/auth/')){
    const sb=requireSupabase(),admin=path.startsWith('/admin');
    if(p==='/auth/me')return admin?adminIdentity():currentUser();
    if(p==='/auth/refresh'){
      const session=await checked(sb.auth.refreshSession());accessToken=session.session?.access_token;return {accessToken,admin:admin?await adminIdentity():undefined};
    }
    if(p==='/auth/register'){
      if(body.password!==body.confirmPassword)throw new Error('Passwords must match.');
      if((body.password||'').length<12)throw new Error('Use at least 12 characters.');
      result=await checked(sb.auth.signUp({email:body.email,password:body.password,options:{data:{firstName:body.firstName,lastName:body.lastName,phone:body.phone},emailRedirectTo:`${window.location.origin}/account`}}));
      if(!result.session)return {requiresConfirmation:true};
      return {accessToken:result.session.access_token};
    }
    if(p==='/auth/forgot-password')return checked(sb.auth.resetPasswordForEmail(body.email,{redirectTo:`${window.location.origin}${admin?'/admin/reset-password':'/account?reset=true'}`}));
    if(p==='/auth/reset-password'){
      if((body.newPassword||'').length<12)throw new Error('Use at least 12 characters.');
      const {data}=await sb.auth.getSession();if(!data.session)throw new Error('Open the password recovery link from your email in this browser.');
      await checked(sb.auth.updateUser({password:body.newPassword}));return signOut(admin?'admin':'customer');
    }
    if(p==='/auth/verify-email')return checked(sb.auth.verifyOtp({token_hash:body.token,type:'email'}));
  }
  const publicRead=method==='GET'&&/^\/(products(?:\/|\?|$)|categories(?:\?|$)|collections(?:\?|$)|content\/|store\/settings$)/.test(path);
  if(publicRead){const url=new URL(path,'https://nobelle.invalid');if(url.pathname==='/products'&&!url.searchParams.has('limit'))url.searchParams.set('limit','20');url.searchParams.sort();result=await publicReads.run(`${url.pathname}?${url.searchParams}:${!!options.full}`,()=>request(path,options));}
  else {if(method!=='GET')publicReads.invalidate();result=await request(path,options);}
  if(method!=='GET')publicReads.invalidate();
  if(role==='admin'&&!['GET','HEAD'].includes(method))window.dispatchEvent(new Event('nobelle-data-changed'));
  return result;
}
export async function signIn(role,email,password){
  activeRole=role;
  const data=await checked(requireSupabase().auth.signInWithPassword({email,password}));
  accessToken=data.session.access_token;
  let admin;
  try{if(role==='admin')admin=await adminIdentity();else await currentUser();}catch(e){await requireSupabase().auth.signOut();throw e;}
  return {accessToken,admin,user:data.user};
}
export async function signOut(role){
  await checked(requireSupabase().auth.signOut());accessToken=null;
}
