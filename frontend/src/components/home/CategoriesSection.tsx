import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import type { Category } from "@/data/mockData";
import {
  countProductsByCategoryName,
  fetchPublicCategories,
  fetchPublicProducts,
  mapApiCategoriesToDisplay,
} from "@/lib/catalogApi";
import categoryVegetables from "@/assets/category-vegetables.jpg";
import categoryFruits from "@/assets/category-fruits.jpg";
import categoryBakery from "@/assets/category-bakery.jpg";
import categoryDairy from "@/assets/category-dairy.jpg";

const categoryPlaceholders = [categoryVegetables, categoryFruits, categoryBakery, categoryDairy];

const CategoriesSection = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apiCats, apiProducts] = await Promise.all([fetchPublicCategories(), fetchPublicProducts()]);
        if (cancelled) return;
        const counts = countProductsByCategoryName(apiProducts);
        setCategories(mapApiCategoriesToDisplay(apiCats, counts, categoryPlaceholders));
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SectionWrapper>
      <SectionHeading title="Shop By Category" subtitle="Explore our wide range of premium categories" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/5]"
          >
            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{cat.discount}</span>
              <h3 className="text-background font-display text-xl font-bold mt-2">{cat.name}</h3>
              <p className="text-background/70 text-sm">{cat.itemCount} items</p>
              <span className="inline-flex items-center gap-1 text-secondary text-sm mt-2 group-hover:gap-2 transition-all">
                Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default CategoriesSection;
