import type { ApiProductDoc } from "@/lib/catalogApi";

const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const store = new Map<string, { at: number; doc: ApiProductDoc }>();
const TTL_MS = 60_000;

export function cacheProductDoc(id: string, doc: ApiProductDoc | null | undefined): void {
  const trimmed = id.trim();
  if (!trimmed || !doc || typeof doc !== "object") return;
  store.set(trimmed, { at: Date.now(), doc });
}

export function takeCachedProductDoc(id: string): ApiProductDoc | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const row = store.get(trimmed);
  if (!row || Date.now() - row.at > TTL_MS) {
    store.delete(trimmed);
    return null;
  }
  return row.doc;
}

/** Warm cache + browser HTTP cache when the user hovers a product card. */
export function prefetchProductDetail(id: string): void {
  const trimmed = id.trim();
  if (!trimmed || takeCachedProductDoc(trimmed)) return;
  void fetch(`${apiBaseUrl()}/api/products/${encodeURIComponent(trimmed)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json: unknown) => {
      if (!json || typeof json !== "object" || !("data" in json)) return;
      const data = (json as { data: unknown }).data;
      if (data && typeof data === "object") cacheProductDoc(trimmed, data as ApiProductDoc);
    })
    .catch(() => {});
}
