import type { Category, Product } from "@/data/mockData";

const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type ApiCategoryDoc = {
  _id?: string;
  name?: string;
  description?: string;
  image?: string;
  createdAt?: string;
};

type ApiProductDoc = {
  _id?: string;
  name?: string;
  description?: string;
  price?: number | string;
  image?: string;
  categoryId?: { name?: string } | string | null;
  subCategoryId?: { name?: string } | string | null;
};

function parseJsonData<T>(json: unknown): T[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function fetchPublicCategories(): Promise<ApiCategoryDoc[]> {
  const res = await fetch(`${apiBaseUrl()}/api/categories`);
  if (!res.ok) throw new Error("Failed to load categories");
  const json: unknown = await res.json();
  return parseJsonData<ApiCategoryDoc>(json);
}

export async function fetchPublicProducts(): Promise<ApiProductDoc[]> {
  const res = await fetch(`${apiBaseUrl()}/api/products?page=1&limit=1000`);
  if (!res.ok) throw new Error("Failed to load products");
  const json: unknown = await res.json();
  return parseJsonData<ApiProductDoc>(json);
}

export function productImageUrl(image: string | undefined, fallback: string): string {
  if (!image) return fallback;
  if (image.startsWith("/uploads/")) return `${apiBaseUrl()}${image}`;
  return image;
}

function categoryNameFromProduct(p: ApiProductDoc): string {
  const c = p.categoryId;
  if (c && typeof c === "object" && "name" in c) return String((c as { name?: string }).name ?? "");
  return "";
}

export function countProductsByCategoryName(products: ApiProductDoc[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of products) {
    const name = categoryNameFromProduct(p);
    if (!name) continue;
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return map;
}

const defaultDiscounts = ["Up to 15% off", "Up to 20% off", "New arrivals", "Shop collection"];

export function mapApiCategoriesToDisplay(
  apiCats: ApiCategoryDoc[],
  counts: Map<string, number>,
  placeholderImages: string[],
): Category[] {
  return apiCats
    .filter((c) => c._id && c.name)
    .map((c, i) => {
      const fallback = placeholderImages[i % placeholderImages.length] ?? placeholderImages[0];
      return {
        id: String(c._id),
        name: String(c.name),
        image: productImageUrl(c.image, fallback),
        itemCount: counts.get(String(c.name)) ?? 0,
        discount: defaultDiscounts[i % defaultDiscounts.length],
      };
    });
}

export function mapApiProductToProduct(p: ApiProductDoc, fallbackImage: string): Product | null {
  if (!p._id || !p.name) return null;
  const category = categoryNameFromProduct(p);
  const price = Number(p.price);
  if (!Number.isFinite(price)) return null;
  return {
    id: String(p._id),
    name: String(p.name),
    category,
    price,
    image: productImageUrl(p.image, fallbackImage),
    rating: 4.8,
  };
}
