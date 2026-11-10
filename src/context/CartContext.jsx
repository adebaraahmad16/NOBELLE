import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api, token } from '../api/client';
import { affectsTables } from '../lib/supabase-sync.js';
import { isDemoVariant, getDemoVariant } from '../data/demoData';

const Context = createContext();

export function CartProvider({ children }) {
  const [realCart, setRealCart] = useState([]);
  const [realSubtotal, setRealSubtotal] = useState(0);
  const [demoCart, setDemoCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nobelle_demo_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('nobelle_demo_cart', JSON.stringify(demoCart));
    } catch (_) {}
  }, [demoCart]);

  const apply = useCallback(data => {
    setRealCart((data?.items || []).map(item => ({
      ...item,
      id: item.variantId,
      cartItemId: item.id,
      name: item.productName,
      productSlug: item.slug,
      price: Number(item.unitPrice || 0),
    })));
    setRealSubtotal(Number(data?.subtotal || 0));
  }, []);

  const run = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await api(path, { ...options, role: token('customer') ? 'customer' : undefined });
      apply(data);
      return data;
    } catch(e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [apply]);

  const refresh = useCallback(() => run('/cart'), [run]);

  useEffect(() => {
    const reload = event => {
      if (event?.type === 'nobelle-data-changed' && !affectsTables(event, ['products','product_variants','inventory','discounts'])) return;
      refresh().catch(() => {});
    };
    reload();
    window.addEventListener('nobelle-session-changed', reload);
    window.addEventListener('nobelle-data-changed', reload);
    const clear = e => {
      if (e.detail === 'customer') {
        setRealCart([]);
        setRealSubtotal(0);
      }
    };
    window.addEventListener('nobelle-session-expired', clear);
    return () => {
      window.removeEventListener('nobelle-session-changed', reload);
      window.removeEventListener('nobelle-data-changed', reload);
      window.removeEventListener('nobelle-session-expired', clear);
    };
  }, [refresh]);

  const cart = useMemo(() => [...realCart, ...demoCart], [realCart, demoCart]);
  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((n, i) => n + Number(i.quantity), 0), [cart]);

  const findReal = useCallback((id, size) => {
    return realCart.find(item => item.id === id && (!size || item.size === size))?.cartItemId;
  }, [realCart]);

  const addVariant = useCallback(async (variantId, quantity, metadata) => {
    // If user is authenticated customer and not a demo item, save to Supabase cart
    if (token('customer') && !isDemoVariant(variantId)) {
      return run('/cart/items', { method: 'POST', body: { variantId, quantity } });
    }

    // Otherwise (guest user or demo variant), store in browser guest cart
    let product = metadata?.product;
    let variant = metadata?.variant;

    if (isDemoVariant(variantId)) {
      const found = getDemoVariant(variantId);
      if (found) {
        product = found.product;
        variant = found.variant;
      }
    }

    if (!product || !variant) {
      if (token('customer')) {
        return run('/cart/items', { method: 'POST', body: { variantId, quantity } });
      }
      throw new Error('Product information unavailable.');
    }

    const stock = Math.max(1, (variant.inventory?.quantity || 15) - (variant.inventory?.reserved || 0));
    setDemoCart(prev => {
      const existing = prev.find(i => i.id === variant.id);
      if (existing) {
        const nextQty = Math.min(stock, existing.quantity + Number(quantity));
        return prev.map(i => i.id === variant.id ? { ...i, quantity: nextQty } : i);
      }
      return [...prev, {
        id: variant.id,
        variantId: variant.id,
        cartItemId: `guest-cart-${variant.id}`,
        name: product.name,
        productSlug: product.slug,
        size: variant.size,
        color: variant.color,
        quantity: Math.min(stock, Number(quantity)),
        price: Number(product.price) + Number(variant.priceDiff || 0),
        image: product.images?.[0]?.url || product.image || (Array.isArray(product.images) ? product.images[0] : '') || '',
        availableStock: stock,
        isDemo: isDemoVariant(variantId),
      }];
    });
  }, [run]);

  const removeFromCart = useCallback(async (id, size) => {
    const isDemo = demoCart.some(i => i.id === id && (!size || i.size === size));
    if (isDemo) {
      setDemoCart(prev => prev.filter(i => !(i.id === id && (!size || i.size === size))));
      return;
    }
    const cartItemId = findReal(id, size);
    if (cartItemId) {
      return run(`/cart/items/${cartItemId}`, { method: 'DELETE' });
    }
  }, [demoCart, findReal, run]);

  const updateQuantity = useCallback(async (id, size, quantity) => {
    const isDemo = demoCart.some(i => i.id === id && (!size || i.size === size));
    if (isDemo) {
      setDemoCart(prev => prev.map(i => {
        if (i.id === id && (!size || i.size === size)) {
          return { ...i, quantity: Math.max(1, Number(quantity)) };
        }
        return i;
      }));
      return;
    }
    const cartItemId = findReal(id, size);
    if (cartItemId) {
      return run(`/cart/items/${cartItemId}`, { method: 'PATCH', body: { quantity } });
    }
  }, [demoCart, findReal, run]);

  const clearCart = useCallback(async () => {
    setDemoCart([]);
    try {
      localStorage.removeItem('nobelle_demo_cart');
    } catch (_) {}
    if (token('customer') && realCart.length > 0) {
      return run('/cart', { method: 'DELETE' });
    }
  }, [realCart.length, run]);

  return (
    <Context.Provider value={{
      cart,
      cartSubtotal,
      cartShipping: null,
      cartTotal: cartSubtotal,
      loading,
      error,
      cartCount,
      refresh,
      addVariant,
      removeFromCart,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </Context.Provider>
  );
}

export const useCart = () => useContext(Context);
