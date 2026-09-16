import { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

const DATA_VERSION = 'nobelle_v3_empty_state';

function loadState(key, defaultValue) {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Failed to parse ${key}:`, e);
    }
  }
  return defaultValue;
}

export function ProductProvider({ children }) {
  // Version check — clears any legacy seeded catalog from localStorage.
  if (localStorage.getItem('nobelle_data_version') !== DATA_VERSION) {
    localStorage.removeItem('nobelle_products');
    localStorage.setItem('nobelle_data_version', DATA_VERSION);
  }

  // The catalog starts EMPTY. Products exist only after the store
  // administrator creates them (or a real API supplies them).
  const [products, setProducts] = useState(() => loadState('nobelle_products', []));

  useEffect(() => {
    localStorage.setItem('nobelle_products', JSON.stringify(products));
  }, [products]);

  const addProduct = (productData) => {
    const newProduct = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      rating: 0,
      reviews: 0,
      dateAdded: new Date().toISOString(),
      ...productData,
      image: productData.images?.[0] || productData.image || '',
      stock: Number(productData.stock) || 0,
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id, updatedData) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updatedData };
        if (updatedData.images) merged.image = updatedData.images[0] || '';
        return merged;
      })
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  /** Stock adjustment used by the Inventory page and checkout flow. */
  const updateStock = (id, stock) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, stock: Math.max(0, Number(stock)) };
        // Auto-flag out-of-stock status when tracking is on.
        if (next.trackStock !== false && next.stock === 0 && next.status === 'Active') {
          next.status = 'Out of Stock';
        }
        if (next.trackStock !== false && next.stock > 0 && next.status === 'Out of Stock') {
          next.status = 'Active';
        }
        return next;
      })
    );
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, updateStock }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
