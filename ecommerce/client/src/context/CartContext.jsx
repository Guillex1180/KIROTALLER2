import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCart, addToCart, updateCartItem, removeCartItem, clearCart, checkout } from '../api.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, tax: 0, total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCart = useCallback(async () => {
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = async (productId, quantity = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await addToCart(productId, quantity);
      setCart(data);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (cartItemId, quantity) => {
    setLoading(true);
    try {
      const data = await updateCartItem(cartItemId, quantity);
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId) => {
    setLoading(true);
    try {
      const data = await removeCartItem(cartItemId);
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const emptyCart = async () => {
    setLoading(true);
    try {
      const data = await clearCart();
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkout();
      setCart({ items: [], subtotal: 0, tax: 0, total: 0, item_count: 0 });
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, error, addItem, updateItem, removeItem, emptyCart, placeOrder, loadCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
