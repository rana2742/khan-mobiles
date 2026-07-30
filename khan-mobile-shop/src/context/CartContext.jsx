import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const CartContext = createContext(null);

const STORAGE_KEY = 'khan-mobile-cart';
const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_FEE = 150;
const PROMO_CODES = {
  KHAN10: 0.10,
};

const readStoredCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(readStoredCart);
  const [toast, setToast] = useState(null);
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [items]);

  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          bgGradient: product.bgGradient,
          imageUrl: product.imageUrl || null,
          quantity,
        },
      ];
    });
    showToast(`${product.name} added to cart`);
  }, [showToast]);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromo(null);
  }, []);

  const applyPromoCode = useCallback((code) => {
    const normalized = code.trim().toUpperCase();
    if (PROMO_CODES[normalized]) {
      setPromo({ code: normalized, discount: PROMO_CODES[normalized] });
      return { success: true };
    }
    return { success: false };
  }, []);

  const removePromoCode = useCallback(() => setPromo(null), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const discount = useMemo(
    () => (promo ? Math.round(subtotal * promo.discount) : 0),
    [subtotal, promo]
  );

  const deliveryFee = useMemo(
    () => (subtotal - discount >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE),
    [subtotal, discount]
  );

  const total = useMemo(
    () => Math.max(subtotal - discount, 0) + deliveryFee,
    [subtotal, discount, deliveryFee]
  );

  const value = {
    items,
    itemCount,
    subtotal,
    discount,
    deliveryFee,
    total,
    promo,
    toast,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
    showToast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export default CartContext;
