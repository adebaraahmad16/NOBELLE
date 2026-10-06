import { setDatePreferences } from '../utils/date';
import { setDisplayCurrency } from '../utils/currency';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
const Context=createContext(null);
export function StoreSettingsProvider({children}) {
 const [settings,setSettings]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let live=true;const reload=()=>api('/store/settings').then(value=>{if(live){setDisplayCurrency(value.general.currency);setDatePreferences(value.general);setSettings(value);setError('');}}).catch(e=>{if(live)setError(e.message);});reload();const timer=setInterval(reload,60000);const storage=e=>{if(e.key==='nobelle-settings-updated')reload();};window.addEventListener('focus',reload);window.addEventListener('storage',storage);window.addEventListener('nobelle-settings-updated',reload);return()=>{live=false;clearInterval(timer);window.removeEventListener('focus',reload);window.removeEventListener('storage',storage);window.removeEventListener('nobelle-settings-updated',reload);};},[]);
 useEffect(()=>{if(!settings)return;setDisplayCurrency(settings.general.currency);document.documentElement.lang=settings.general.language;document.title=settings.website.seoTitle||settings.general.storeName;const meta=(key,value,property=false)=>{let node=document.querySelector(`meta[${property?'property':'name'}="${key}"]`);if(!node){node=document.createElement('meta');node.setAttribute(property?'property':'name',key);document.head.append(node);}node.content=value;};meta('description',settings.website.seoDescription);meta('og:title',settings.website.seoTitle,true);meta('og:description',settings.website.seoDescription,true);meta('og:image',settings.website.socialImage,true);if(settings.website.faviconUrl){let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.append(favicon);}favicon.href=settings.website.faviconUrl;}},[settings]);
 return <Context.Provider value={{settings,error}}>{children}</Context.Provider>;
}
export const useStoreSettings=()=>useContext(Context)||{settings:null,error:''};
