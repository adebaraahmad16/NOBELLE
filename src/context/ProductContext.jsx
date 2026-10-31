import { useStoreSettings } from './StoreSettingsContext';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, normalizeProduct } from '../api/client';
import { affectsTables } from '../lib/supabase-sync.js';
const Context = createContext();
export function ProductProvider({ children }) {
  const {settings}=useStoreSettings();
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const reload = useCallback(async () => { setLoading(true); setError(''); try { setProducts((await api('/products?limit=20')).map(normalizeProduct)); } catch(e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { const changed=e=>{if(affectsTables(e,['products','product_images','product_categories','product_collections','product_collection_links','product_variants','inventory','discounts','product_reviews']))reload();};reload(); window.addEventListener('nobelle-data-changed',changed); window.addEventListener('focus',reload); return () => { window.removeEventListener('nobelle-data-changed',changed); window.removeEventListener('focus',reload); }; }, [reload,settings?.products.outOfStockVisibility]);
  return <Context.Provider value={{ products, loading, error, reload }}>{children}</Context.Provider>;
}
export const useProducts = () => useContext(Context);
