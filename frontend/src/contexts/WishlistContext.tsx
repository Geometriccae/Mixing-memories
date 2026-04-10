import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "royal_oven_liked_product_ids";

function readStoredIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

type WishlistContextValue = {
  likedIds: readonly string[];
  likeCount: number;
  isLiked: (productId: string) => boolean;
  toggleLike: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [likedIds, setLikedIds] = useState<string[]>(() => readStoredIds());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(likedIds));
    } catch {
      /* ignore quota */
    }
  }, [likedIds]);

  const isLiked = useCallback(
    (productId: string) => likedIds.includes(productId),
    [likedIds],
  );

  const toggleLike = useCallback((productId: string) => {
    const id = String(productId || "").trim();
    if (!id) return;
    setLikedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const likeCount = likedIds.length;

  const value = useMemo(
    () => ({
      likedIds,
      likeCount,
      isLiked,
      toggleLike,
    }),
    [likedIds, likeCount, isLiked, toggleLike],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
