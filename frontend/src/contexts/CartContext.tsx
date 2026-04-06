import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/mockData";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  addToCart: (product: Product, qty?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    const n = Math.max(1, Math.floor(qty));
    setItems((prev) => {
      const i = prev.findIndex((l) => l.productId === product.id);
      if (i === -1) {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: n,
          },
        ];
      }
      const next = [...prev];
      next[i] = { ...next[i], quantity: next[i].quantity + n };
      return next;
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const q = Math.floor(quantity);
    if (q < 1) {
      setItems((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setItems((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: q } : l)));
  }, []);

  const removeLine = useCallback((productId: string) => {
    setItems((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((s, l) => s + l.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, l) => s + l.price * l.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      addToCart,
      setQuantity,
      removeLine,
      clearCart,
      itemCount,
      subtotal,
    }),
    [items, addToCart, setQuantity, removeLine, clearCart, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
