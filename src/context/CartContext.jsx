import { createContext, useContext, useEffect, useState } from 'react';
import { api, token } from '../api/client';
const Context = createContext();
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); const [cartSubtotal, setSubtotal] = useState(0); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const apply = data => { setCart(data.items.map(item => ({ ...item, id: item.productId, cartItemId: item.id, name: item.productName, price: Number(item.unitPrice) }))); setSubtotal(Number(data.subtotal)); };
  const run = async (path, options = {}) => { setLoading(true); setError(''); try { const data = await api(path, { ...options, role: token('customer') ? 'customer' : undefined }); apply(data); return data; } catch(e) { setError(e.message); throw e; } finally { setLoading(false); } };
  useEffect(() => { const refresh = () => { run('/cart').catch(() => {}); }; api('/auth/me', { role: 'customer' }).catch(() => {}).finally(refresh); window.addEventListener('nobelle-session-changed', refresh); const clear = e => { if(e.detail === 'customer') { setCart([]); setSubtotal(0); } }; window.addEventListener('nobelle-session-expired', clear); return () => { window.removeEventListener('nobelle-session-changed', refresh); window.removeEventListener('nobelle-session-expired', clear); }; }, []);
  const find = (id, size) => cart.find(item => item.id === id && item.size === size)?.cartItemId;
  return <Context.Provider value={{ cart, cartSubtotal, cartShipping: null, cartTotal: cartSubtotal, loading, error,
    cartCount: cart.reduce((n, i) => n + i.quantity, 0), refresh: () => run('/cart'),
    addVariant: (variantId, quantity) => run('/cart/items', { method: 'POST', body: { variantId, quantity } }),
    removeFromCart: (id, size) => run(`/cart/items/${find(id, size)}`, { method: 'DELETE' }),
    updateQuantity: (id, size, quantity) => run(`/cart/items/${find(id, size)}`, { method: 'PATCH', body: { quantity } }),
    clearCart: () => run('/cart', { method: 'DELETE' }) }}>{children}</Context.Provider>;
}
export const useCart = () => useContext(Context);
