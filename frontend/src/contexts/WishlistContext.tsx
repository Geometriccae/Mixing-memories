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
import { useAuth } from "@/contexts/AuthContext";
import { patchShopStateRequest } from "@/lib/authApi";

const LEGACY_LIKES_KEY = "royal_oven_liked_product_ids";

function likesKey(userId: string) {
  return `royal_oven_likes_v1_${userId}`;
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

function readLikes(userId: string): string[] {
  const k = likesKey(userId);
  let raw = localStorage.getItem(k);
  if (!raw && userId !== "guest") {
    const leg = localStorage.getItem(LEGACY_LIKES_KEY);
    if (leg) {
      localStorage.setItem(k, leg);
      localStorage.removeItem(LEGACY_LIKES_KEY);
      raw = leg;
    }
  }
  return parseIds(raw);
}

function saveLikes(userId: string, ids: string[]) {
  try {
    localStorage.setItem(likesKey(userId), JSON.stringify(ids));
  } catch {
    /* quota */
  }
}

function toLikes(saved: string[] | undefined): string[] {
  if (!Array.isArray(saved)) return [];
  return saved.filter((x): x is string => typeof x === "string" && x.length > 0);
}

type WishlistContextValue = {
  likedIds: readonly string[];
  likeCount: number;
  isLiked: (productId: string) => boolean;
  toggleLike: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, token } = useAuth();
  const userId = !isLoading ? (user?.id ?? "guest") : null;

  const [likedIds, setLikedIds] = useState<string[]>([]);
  const prevUserRef = useRef<string | null>(null);
  const skipNextSaveRef = useRef(true);
  const serverSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const serverLikesSig = useMemo(
    () => (user?.id ? JSON.stringify(user.savedLikes ?? []) : ""),
    [user?.id, user?.savedLikes],
  );

  useEffect(() => {
    if (isLoading || userId === null) return;

    skipNextSaveRef.current = true;
    setLikedIds((current) => {
      const prev = prevUserRef.current;

      if (prev === null) {
        prevUserRef.current = userId;
        if (user && user.id === userId) {
          const serverLikes = toLikes(user.savedLikes);
          if (serverLikes.length > 0) return serverLikes;
          return readLikes(userId);
        }
        return readLikes(userId);
      }

      if (prev !== userId) {
        saveLikes(prev, current);
        prevUserRef.current = userId;

        if (user && user.id === userId) {
          const serverLikes = toLikes(user.savedLikes);
          if (serverLikes.length > 0) return serverLikes;
          if (prev === "guest") {
            const guestLikes = readLikes("guest");
            if (guestLikes.length > 0) return guestLikes;
          }
          return readLikes(userId);
        }
        return readLikes(userId);
      }

      return current;
    });
  }, [isLoading, userId, user?.id]);

  useEffect(() => {
    if (isLoading || userId === null || userId === "guest" || !user || user.id !== userId) return;
    const remote = toLikes(user.savedLikes);
    if (remote.length === 0) return;
    setLikedIds((cur) => (JSON.stringify(cur) === JSON.stringify(remote) ? cur : remote));
    skipNextSaveRef.current = true;
  }, [isLoading, userId, user?.id, serverLikesSig]);

  useEffect(() => {
    if (isLoading || userId === null) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    saveLikes(userId, likedIds);
  }, [likedIds, userId, isLoading]);

  useEffect(() => {
    if (isLoading || userId === null || userId === "guest" || !token) return;
    if (serverSyncRef.current) clearTimeout(serverSyncRef.current);
    serverSyncRef.current = setTimeout(() => {
      void patchShopStateRequest(token, { likes: [...likedIds] }).catch(() => {});
    }, 700);
    return () => {
      if (serverSyncRef.current) clearTimeout(serverSyncRef.current);
    };
  }, [likedIds, token, userId, isLoading]);

  const isLiked = useCallback((productId: string) => likedIds.includes(productId), [likedIds]);

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
