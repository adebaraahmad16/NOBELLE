import { useStoreSettings } from './StoreSettingsContext';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, normalizeProduct } from '../api/client';
const Context = createContext();
export function ProductProvider({ children }) {
  const {settings}=useStoreSettings();
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const reload = useCallback(async () => { setLoading(true); setError(''); try { setProducts((await api('/products?limit=20')).map(normalizeProduct)); } catch(e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { reload(); window.addEventListener('nobelle-data-changed',reload); window.addEventListener('focus',reload); return () => { window.removeEventListener('nobelle-data-changed',reload); window.removeEventListener('focus',reload); }; }, [reload,settings?.products.outOfStockVisibility]);
  return <Context.Provider value={{ products, loading, error, reload }}>{children}</Context.Provider>;
}
export const useProducts = () => useContext(Context);
