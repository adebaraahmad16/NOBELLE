import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'nobelle_cart';

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function cartReducer(state, action) {
  let newState;
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingIndex = state.findIndex(
        item => item.id === action.payload.id && item.size === action.payload.size
      );
      if (existingIndex >= 0) {
        newState = state.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newState = [...state, { ...action.payload }];
      }
      break;
    }
    case 'REMOVE_FROM_CART': {
      newState = state.filter(
        item => !(item.id === action.payload.id && item.size === action.payload.size)
      );
      break;
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        newState = state.filter(
          item => !(item.id === action.payload.id && item.size === action.payload.size)
        );
      } else {
        newState = state.map(item =>
          item.id === action.payload.id && item.size === action.payload.size
            ? { ...item, quantity: action.payload.quantity }
            : item
        );
      }
      break;
    }
    case 'CLEAR_CART':
      newState = [];
      break;
    default:
      return state;
  }
  saveCartToStorage(newState);
  return newState;
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, [], loadCartFromStorage);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const addToCart = (product, size, quantity = 1) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        quantity,
      },
    });
  };

  const removeFromCart = (id, size) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id, size } });
  };

  const updateQuantity = (id, size, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, size, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 200000; // ₦200,000 — configurable in Delivery settings later
  const cartShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 3500;
  const cartTotal = cartSubtotal + cartShipping;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartShipping,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
