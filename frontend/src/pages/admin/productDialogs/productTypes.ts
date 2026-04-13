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
  /** Absolute URL when product has a cover image in DB */
  imageUrl: string;
  /** Absolute URL when product has a video in DB */
  videoUrl: string;
  hasImage: boolean;
  hasVideo: boolean;
  /** Up to 3 resolved URLs (null if no image) */
  variantImageUrls: (string | null)[];
  /** Set on create (admin API only). Used for barcode PNG download. */
  barcode?: string;
};
