import type { Product } from "@/data/mockData";
import { cacheProductDoc } from "@/lib/productDetailPrefetch";

const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export type ApiProductDoc = {
  _id?: string;
  name?: string;
  description?: string;
  specification?: string;
  price?: number | string;
  actualPrice?: number | string | null;
  /** Admin-only when listing with Bearer token */
  stock?: number;
  minStock?: number;
  inStock?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  hasImage?: boolean;
  hasVideo?: boolean;
  image?: string;
  updatedAt?: string;
  variantImageUrls?: (string | null)[];
};

export type ProductAvailability = {
  maxOrderable: number;
  lowStock: boolean;
  outOfStock: boolean;
};

function parseJsonData<T>(json: unknown): T[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Default list size for storefront (avoid huge payloads + slow Atlas round-trips). */
const DEFAULT_PRODUCT_LIST_LIMIT = 200;

export async function fetchPublicProducts(limit: number = DEFAULT_PRODUCT_LIST_LIMIT): Promise<ApiProductDoc[]> {
  const n = Math.min(500, Math.max(1, Math.floor(limit)));
  const res = await fetch(`${apiBaseUrl()}/api/products?page=1&limit=${n}`);
  if (!res.ok) throw new Error("Failed to load products");
  const json: unknown = await res.json();
  return parseJsonData<ApiProductDoc>(json);
}

/** Name search (same `search` query as admin listing). */
export async function fetchPublicProductsSearch(search: string, limit: number = 20): Promise<ApiProductDoc[]> {
  const q = search.trim();
  if (!q) return fetchPublicProducts(limit);
  const n = Math.min(100, Math.max(1, Math.floor(limit)));
  const params = new URLSearchParams({ page: "1", limit: String(n), search: q });
  const res = await fetch(`${apiBaseUrl()}/api/products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to search products");
  const json: unknown = await res.json();
  return parseJsonData<ApiProductDoc>(json);
}

export async function fetchPublicProductById(id: string): Promise<ApiProductDoc | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const res = await fetch(`${apiBaseUrl()}/api/products/${encodeURIComponent(trimmed)}`);
  if (!res.ok) return null;
  const json: unknown = await res.json();
  if (!json || typeof json !== "object" || !("data" in json)) return null;
  const data = (json as { data: unknown }).data;
  if (data && typeof data === "object") {
    const doc = data as ApiProductDoc;
    cacheProductDoc(trimmed, doc);
    return doc;
  }
  return null;
}

function normalizeBarcodeClientInput(raw: string): string {
  let s = String(raw || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\u2212|\u2013|\u2014/g, "-")
    .trim()
    .replace(/\s+/g, " ");
  s = s.replace(/^RO\s*-\s*/i, "RO-");
  return s.toUpperCase();
}

/** Resolve retail barcode (e.g. from a scanner) to Mongo product id for routing to product detail. */
export async function lookupProductByBarcode(barcode: string): Promise<string | null> {
  const q = normalizeBarcodeClientInput(barcode);
  if (!q) return null;
  const res = await fetch(`${apiBaseUrl()}/api/products/lookup/barcode?q=${encodeURIComponent(q)}`);
  if (res.status === 404) return null;
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Barcode lookup failed.");
  }
  if (!json || typeof json !== "object" || !("data" in json)) return null;
  const data = (json as { data: unknown }).data;
  if (!data || typeof data !== "object" || !("_id" in data)) return null;
  const id = (data as { _id?: unknown })._id;
  return id != null ? String(id) : null;
}

/** Use on cart/checkout only — returns how many units can be ordered (current stock). */
export async function fetchProductsAvailability(productIds: string[]): Promise<Record<string, ProductAvailability>> {
  const unique = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))].slice(0, 50);
  if (unique.length === 0) return {};
  const res = await fetch(`${apiBaseUrl()}/api/products/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds: unique }),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to load availability.");
  }
  const data = json && typeof json === "object" && "data" in json ? (json as { data: unknown }).data : null;
  if (!data || typeof data !== "object") return {};
  return data as Record<string, ProductAvailability>;
}

function resolveProductImageUrl(p: ApiProductDoc): string {
  if (p.imageUrl && p.imageUrl.startsWith("/")) {
    return `${apiBaseUrl()}${p.imageUrl}`;
  }
  if (p.hasImage === false) return "";
  const id = p._id ? String(p._id) : "";
  if (p.image && p.image.startsWith("/uploads/")) {
    return `${apiBaseUrl()}${p.image}`;
  }
  if (id && p.hasImage !== false) {
    const ts = p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now();
    return `${apiBaseUrl()}/api/products/${id}/image?v=${ts}`;
  }
  return "";
}

function resolveProductVideoUrl(p: ApiProductDoc): string {
  if (p.hasVideo !== true) return "";
  const id = p._id ? String(p._id) : "";
  if (p.videoUrl && p.videoUrl.startsWith("/")) {
    return `${apiBaseUrl()}${p.videoUrl}`;
  }
  if (id) {
    const ts = p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now();
    return `${apiBaseUrl()}/api/products/${id}/video?v=${ts}`;
  }
  return "";
}

function resolveVariantUrls(p: ApiProductDoc): string[] {
  const raw = Array.isArray(p.variantImageUrls) ? p.variantImageUrls : [];
  const out: string[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const u = raw[i];
    if (u && typeof u === "string" && u.startsWith("/")) {
      out.push(`${apiBaseUrl()}${u}`);
    }
  }
  return out;
}

export function mapApiProductToProduct(p: ApiProductDoc, fallbackImage: string): Product | null {
  if (!p._id || !p.name) return null;
  const price = Number(p.price);
  if (!Number.isFinite(price)) return null;
  const img = resolveProductImageUrl(p);
  const vid = resolveProductVideoUrl(p);
  const actual =
    p.actualPrice !== undefined && p.actualPrice !== null && String(p.actualPrice).trim() !== ""
      ? Number(p.actualPrice)
      : NaN;
  const hasActual = Number.isFinite(actual) && actual >= 0;
  const variants = resolveVariantUrls(p);

  const inStock = p.inStock !== undefined ? p.inStock : p.stock !== undefined ? Number(p.stock) > 0 : true;
  const outOfStock = p.outOfStock !== undefined ? p.outOfStock : p.stock !== undefined ? Number(p.stock) <= 0 : false;
  const lowStock = p.lowStock === true;

  return {
    id: String(p._id),
    name: String(p.name),
    description: typeof p.description === "string" ? p.description : undefined,
    specification: typeof p.specification === "string" ? p.specification : undefined,
    inStock,
    lowStock,
    outOfStock,
    price,
    actualPrice: hasActual ? actual : undefined,
    originalPrice: hasActual && actual > price ? actual : undefined,
    image: img || fallbackImage,
    hasCoverImage: p.hasImage !== false && img.length > 0,
    videoUrl: vid || undefined,
    variantImageUrls: variants.length ? variants : undefined,
    rating: 4.8,
  };
}
