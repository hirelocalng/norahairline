import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

// Matches MAX_QUANTITY in backend/routes/orders.js
export const MAX_QUANTITY = 20;

// Drops anything malformed left in localStorage by older versions or edits.
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('nora_cart') || '[]');
    if (!Array.isArray(saved)) return [];
    return saved
      .filter(i => i && Number.isInteger(i.id) && typeof i.name === 'string' && Number.isFinite(Number(i.price)))
      .map(i => ({ ...i, price: Number(i.price), quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.floor(Number(i.quantity)) || 1)) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  // Bumped on every add so the navbar badge can bounce and a toast can show.
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    try { localStorage.setItem('nora_cart', JSON.stringify(items)); } catch { /* private mode / quota */ }
  }, [items]);

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + 1) } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), category: product.category, primary_image: product.primary_image || null, quantity: 1 }];
    });
    setLastAdded({ name: product.name, key: Date.now() });
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(MAX_QUANTITY, qty) } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, lastAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
