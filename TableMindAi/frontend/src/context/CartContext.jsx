import { createContext, useMemo, useState } from "react";

import { STORAGE_KEYS } from "../utils/constants";
import { getStorageValue, setStorageValue } from "../utils/storage";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(getStorageValue(STORAGE_KEYS.cartItems, []));

  const syncItems = (nextItems) => {
    setItems(nextItems);
    setStorageValue(STORAGE_KEYS.cartItems, nextItems);
  };

  const addItem = (item, quantity = 1) => {
    const normalizedQuantity = Math.max(1, Number(quantity) || 1);
    const existingItem = items.find((cartItem) => cartItem._id === item._id);

    if (existingItem) {
      syncItems(
        items.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + normalizedQuantity }
            : cartItem
        )
      );
      return;
    }

    syncItems([...items, { ...item, quantity: normalizedQuantity, note: "" }]);
  };

  const removeItem = (itemId) => {
    syncItems(items.filter((item) => item._id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    syncItems(items.map((item) => (item._id === itemId ? { ...item, quantity } : item)));
  };

  const updateNote = (itemId, note) => {
    syncItems(items.map((item) => (item._id === itemId ? { ...item, note } : item)));
  };

  const clearCart = () => {
    syncItems([]);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNote,
        clearCart,
        subtotal,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
