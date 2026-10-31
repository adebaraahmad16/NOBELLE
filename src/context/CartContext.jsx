import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, token } from '../api/client';
import { affectsTables } from '../lib/supabase-sync.js';
const Context = createContext();
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); const [cartSubtotal, setSubtotal] = useState(0); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const apply = useCallback(data => { setCart(data.items.map(item => ({ ...item, id: item.variantId, cartItemId: item.id, name: item.productName, productSlug:item.slug, price: Number(item.unitPrice) }))); setSubtotal(Number(data.subtotal)); },[]);
  const run = useCallback(async (path, options = {}) => { setLoading(true); setError(''); try { const data = await api(path, { ...options, role: token('customer') ? 'customer' : undefined }); apply(data); return data; } catch(e) { setError(e.message); throw e; } finally { setLoading(false); } },[apply]);
  const refresh = useCallback(()=>run('/cart'),[run]);
  useEffect(() => { const reload = event => { if(event?.type==='nobelle-data-changed'&&!affectsTables(event,['products','product_variants','inventory','discounts']))return;refresh().catch(() => {}); }; reload(); window.addEventListener('nobelle-session-changed', reload);window.addEventListener('nobelle-data-changed',reload); const clear = e => { if(e.detail === 'customer') { setCart([]); setSubtotal(0); } }; window.addEventListener('nobelle-session-expired', clear); return () => { window.removeEventListener('nobelle-session-changed', reload);window.removeEventListener('nobelle-data-changed',reload); window.removeEventListener('nobelle-session-expired', clear); }; }, [refresh]);
  const find = (id, size) => cart.find(item => item.id === id && item.size === size)?.cartItemId;
  return <Context.Provider value={{ cart, cartSubtotal, cartShipping: null, cartTotal: cartSubtotal, loading, error,
    cartCount: cart.reduce((n, i) => n + i.quantity, 0), refresh,
    addVariant: (variantId, quantity) => run('/cart/items', { method: 'POST', body: { variantId, quantity } }),
    removeFromCart: (id, size) => run(`/cart/items/${find(id, size)}`, { method: 'DELETE' }),
    updateQuantity: (id, size, quantity) => run(`/cart/items/${find(id, size)}`, { method: 'PATCH', body: { quantity } }),
    clearCart: () => run('/cart', { method: 'DELETE' }) }}>{children}</Context.Provider>;
}
export const useCart = () => useContext(Context);
