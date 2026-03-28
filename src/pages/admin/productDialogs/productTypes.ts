import type { AdminSubcategoryRow } from "@/pages/admin/subcategoryDialogs/subcategoryTypes";

export type AdminProductRow = {
  id: number;
  category: string;
  subCategory: string;
  name: string;
  image: string;
  variantImages: [string, string, string];
  stock: number;
  /** Selling price (shown in products table as Price) */
  price: number;
  actualPrice: number;
  manufacturer: string;
  quality: string;
  description: string;
  specification: string;
};

export const ADMIN_PRODUCT_MANUFACTURERS = ["Testing", "Apple"] as const;

export const ADMIN_PRODUCT_QUALITIES = ["OEM", "INCELL"] as const;

export function subcategoryNamesForCategory(
  subcategories: AdminSubcategoryRow[],
  categoryName: string,
): string[] {
  return subcategories.filter((s) => s.categoryName === categoryName).map((s) => s.subName);
}
