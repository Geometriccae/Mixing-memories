import type { Product } from "@/data/mockData";

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
  imageUrl?: string;
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

export async function fetchPublicProducts(): Promise<ApiProductDoc[]> {
  const res = await fetch(`${apiBaseUrl()}/api/products?page=1&limit=1000`);
  if (!res.ok) throw new Error("Failed to load products");
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
  return data && typeof data === "object" ? (data as ApiProductDoc) : null;
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
  const id = p._id ? String(p._id) : "";
  if (p.imageUrl && p.imageUrl.startsWith("/")) {
    return `${apiBaseUrl()}${p.imageUrl}`;
  }
  if (p.image && p.image.startsWith("/uploads/")) {
    return `${apiBaseUrl()}${p.image}`;
  }
  if (id) {
    const ts = p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now();
    return `${apiBaseUrl()}/api/products/${id}/image?v=${ts}`;
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
    variantImageUrls: variants.length ? variants : undefined,
    rating: 4.8,
  };
}
