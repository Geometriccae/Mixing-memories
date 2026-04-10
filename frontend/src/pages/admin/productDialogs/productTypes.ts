/** Admin product row — synced from API (MongoDB) */
export type AdminProductRow = {
  id: string;
  name: string;
  description: string;
  specification: string;
  /** Selling price */
  price: number;
  actualPrice: number | null;
  stock: number;
  minStock: number;
  imageUrl: string;
  /** Up to 3 resolved URLs (null if no image) */
  variantImageUrls: (string | null)[];
};
