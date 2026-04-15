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
import { patchShopStateRequest, type SavedCartLine } from "@/lib/authApi";

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
  replaceCart: (lines: CartLine[]) => void;
  mergeLine: (line: CartLine) => void;
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

function toCartLines(saved: SavedCartLine[] | undefined): CartLine[] {
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((l) => l && typeof l.productId === "string" && typeof l.name === "string" && typeof l.price === "number")
    .map((l) => ({
      productId: l.productId,
      name: l.name,
      price: l.price,
      image: typeof l.image === "string" ? l.image : "",
      quantity: Math.max(1, Math.floor(Number(l.quantity))),
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, token } = useAuth();
  const userId = !isLoading ? (user?.id ?? "guest") : null;

  const [items, setItems] = useState<CartLine[]>([]);
  const prevUserRef = useRef<string | null>(null);
  const skipNextSaveRef = useRef(true);
  const serverSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const serverCartSig = useMemo(
    () => (user?.id ? JSON.stringify(user.savedCart ?? []) : ""),
    [user?.id, user?.savedCart],
  );

  /** Hydrate when account switches (guest ↔ user or login). */
  useEffect(() => {
    if (isLoading || userId === null) return;

    skipNextSaveRef.current = true;
    setItems((current) => {
      const prev = prevUserRef.current;

      if (prev === null) {
        prevUserRef.current = userId;
        if (user && user.id === userId) {
          const serverLines = toCartLines(user.savedCart);
          if (serverLines.length > 0) return serverLines;
          return readCart(userId);
        }
        return readCart(userId);
      }

      if (prev !== userId) {
        saveCart(prev, current);
        prevUserRef.current = userId;

        if (user && user.id === userId) {
          const serverLines = toCartLines(user.savedCart);
          if (serverLines.length > 0) return serverLines;
          if (prev === "guest") {
            const guestLines = readCart("guest");
            if (guestLines.length > 0) return guestLines;
          }
          return readCart(userId);
        }
        return readCart(userId);
      }

      return current;
    });
  }, [isLoading, userId, user?.id]);

  /** When /me returns server cart for the same account (e.g. other browser), apply if non-empty. */
  useEffect(() => {
    if (isLoading || userId === null || userId === "guest" || !user || user.id !== userId) return;
    const remote = toCartLines(user.savedCart);
    if (remote.length === 0) return;
    setItems((cur) => (JSON.stringify(cur) === JSON.stringify(remote) ? cur : remote));
    skipNextSaveRef.current = true;
  }, [isLoading, userId, user?.id, serverCartSig]);

  useEffect(() => {
    if (isLoading || userId === null) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    saveCart(userId, items);
  }, [items, userId, isLoading]);

  /** Persist cart on the user account (cross-browser), plus localStorage above. */
  useEffect(() => {
    if (isLoading || userId === null || userId === "guest" || !token) return;
    if (serverSyncRef.current) clearTimeout(serverSyncRef.current);
    serverSyncRef.current = setTimeout(() => {
      void patchShopStateRequest(token, { cart: items }).catch(() => {});
    }, 700);
    return () => {
      if (serverSyncRef.current) clearTimeout(serverSyncRef.current);
    };
  }, [items, token, userId, isLoading]);

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

  const replaceCart = useCallback((lines: CartLine[]) => {
    setItems(
      lines
        .filter((l) => l.productId)
        .map((l) => ({
          ...l,
          quantity: Math.max(1, Math.floor(Number(l.quantity))),
        })),
    );
  }, []);

  const mergeLine = useCallback((line: CartLine) => {
    if (!line.productId) return;
    const q = Math.max(1, Math.floor(Number(line.quantity)));
    setItems((prev) => {
      const i = prev.findIndex((l) => l.productId === line.productId);
      if (i === -1) return [...prev, { ...line, quantity: q }];
      const next = [...prev];
      next[i] = { ...next[i], quantity: next[i].quantity + q };
      return next;
    });
  }, []);

  const itemCount = useMemo(() => items.reduce((s, l) => s + l.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, l) => s + l.price * l.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      addToCart,
      setQuantity,
      removeLine,
      clearCart,
      replaceCart,
      mergeLine,
      itemCount,
      subtotal,
    }),
    [items, addToCart, setQuantity, removeLine, clearCart, replaceCart, mergeLine, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
