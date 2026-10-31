import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createSupabaseSync } from '../lib/supabase-sync.js';
import { publicReads } from '../api/read-cache.js';
const statusListeners = new Set();
let lastStatus = '';
const sync = createSupabaseSync(supabase, {
 changed(tables) {
  publicReads.invalidate();
  window.dispatchEvent(new CustomEvent('nobelle-data-changed', {detail:{tables}}));
  if(tables.includes('store_settings')) window.dispatchEvent(new Event('nobelle-settings-updated'));
 },
 status(state,error) {
  const message=['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(state)?'Live updates are unavailable. Refresh the page to load saved changes; check the Supabase connection and Realtime publication.':'';
  if(message!==lastStatus){lastStatus=message;if(message)console.error('Supabase Realtime:',state,error?.message||'Connection unavailable');}
  for(const listener of statusListeners)listener(message);
 },
});
export function useSupabaseSync(enabled=true){
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!supabase||!enabled)return;
  statusListeners.add(setError);
  const release=sync.acquire();
  return ()=>{statusListeners.delete(setError);release();};
 },[enabled]);
 return enabled?error:'';
}
