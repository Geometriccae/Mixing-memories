import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

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

function cartKey(userId: string) {
  return `royal_oven_cart_v1_${userId}`;
}

function readCart(userId: string): CartLine[] {
  try {
    const raw = localStorage.getItem(cartKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is CartLine =>
          row &&
          typeof row === "object" &&
          typeof (row as CartLine).productId === "string" &&
          typeof (row as CartLine).name === "string" &&
          typeof (row as CartLine).price === "number" &&
          typeof (row as CartLine).quantity === "number",
      )
      .map((row) => ({
        ...row,
        image: typeof row.image === "string" ? row.image : "",
        quantity: Math.max(1, Math.floor(Number(row.quantity))),
      }));
  } catch {
    return [];
  }
}

function saveCart(userId: string, items: CartLine[]) {
  try {
    localStorage.setItem(cartKey(userId), JSON.stringify(items));
  } catch {
    /* quota */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const userId = !isLoading ? (user?.id ?? "guest") : null;

  const [items, setItems] = useState<CartLine[]>([]);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || userId === null) return;

    setItems((current) => {
      const prev = prevUserRef.current;

      if (prev === null) {
        prevUserRef.current = userId;
        return readCart(userId);
      }

      if (prev !== userId) {
        saveCart(prev, current);
        prevUserRef.current = userId;
        return readCart(userId);
      }

      return current;
    });
  }, [isLoading, userId]);

  useEffect(() => {
    if (isLoading || userId === null) return;
    saveCart(userId, items);
  }, [items, userId, isLoading]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    if (product.outOfStock) return;
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
