import goldenJaggeryHero from "@/assets/royal-oven-golden-jaggery-hero.png";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";
import chocoCrunchy from "@/assets/royal-oven-choco-crunchy.png";
import honeyDipped from "@/assets/royal-oven-honey-dipped.png";
import peanutHero from "@/assets/royal-oven-nutty-peanut-hero.png";
import peanutWhite from "@/assets/royal-oven-peanut-power-white.png";

export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  specification?: string;
  /** Not exposed on public catalog — use availability on checkout */
  inStock?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
  manufacturer?: string;
  quality?: string;
  price: number;
  /** MRP / list price (e.g. for strikethrough when higher than selling price) */
  originalPrice?: number;
  /** Same as list/MRP when you need to show both prices explicitly */
  actualPrice?: number;
  image: string;
  /** Optional short clip from API (`/api/products/:id/video`) */
  videoUrl?: string;
  /** False when catalog item is video-only (no cover image in DB) */
  hasCoverImage?: boolean;
  /** Extra gallery images (e.g. variants) */
  variantImageUrls?: string[];
  badge?: string;
  rating: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  itemCount: number;
  discount: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar: string;
}

export const categories: Category[] = [
  { id: "1", name: "Golden Jaggery", image: goldenJaggeryHero, itemCount: 12, discount: "Up to 15% off" },
  { id: "2", name: "Choco Crunchy", image: chocoCrunchy, itemCount: 10, discount: "Up to 20% off" },
  { id: "3", name: "Honey Dipped", image: honeyDipped, itemCount: 8, discount: "New arrivals" },
  { id: "4", name: "Peanut Power", image: peanutHero, itemCount: 11, discount: "Up to 10% off" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Royal Oven Golden Jaggery Granola 100g",
    category: "Golden Jaggery",
    price: 8.99,
    originalPrice: 10.99,
    image: goldenJaggeryWhite,
    badge: "Sale",
    rating: 4.9,
  },
  {
    id: "2",
    name: "Royal Oven Golden Jaggery Granola",
    category: "Golden Jaggery",
    price: 9.49,
    image: goldenJaggeryHero,
    badge: "Popular",
    rating: 4.8,
  },
  {
    id: "3",
    name: "Royal Oven Choco Crunchy Granola",
    category: "Choco Crunchy",
    price: 9.99,
    image: chocoCrunchy,
    badge: "New",
    rating: 4.9,
  },
  {
    id: "4",
    name: "Royal Oven Choco Crunchy Granola Large",
    category: "Choco Crunchy",
    price: 11.49,
    originalPrice: 12.99,
    image: chocoCrunchy,
    badge: "Sale",
    rating: 4.7,
  },
  {
    id: "5",
    name: "Royal Oven Honey Dipped Granola",
    category: "Honey Dipped",
    price: 9.25,
    image: honeyDipped,
    rating: 4.8,
  },
  {
    id: "6",
    name: "Royal Oven Honey Dipped Granola Twin Pack",
    category: "Honey Dipped",
    price: 16.99,
    originalPrice: 18.5,
    image: honeyDipped,
    badge: "Popular",
    rating: 4.6,
  },
  {
    id: "7",
    name: "Royal Oven Peanut Power Granola 100g",
    category: "Peanut Power",
    price: 8.49,
    image: peanutWhite,
    rating: 4.7,
  },
  {
    id: "8",
    name: "Royal Oven Peanut Power Granola",
    category: "Peanut Power",
    price: 9.99,
    image: peanutHero,
    badge: "New",
    rating: 4.9,
  },
];

export const marqueeItems = [
  "🥬 Fresh Vegetables 30% Off",
  "🍎 Organic Fruits 20% Off",
  "🥐 Artisan Bakery 15% Off",
  "🧀 Dairy & Eggs 25% Off",
  "🏠 Household Items 22% Off",
  "🥛 Fresh Milk 10% Off",
];
