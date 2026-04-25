import { useEffect, useState } from "react";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import ProductCard from "@/components/common/ProductCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Product } from "@/data/mockData";
import { fetchPublicProducts, mapApiProductToProduct } from "@/lib/catalogApi";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";

const FEATURED_LIMIT = 8;

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const apiProducts = await fetchPublicProducts(FEATURED_LIMIT + 4);
        if (cancelled) return;
        const mapped = apiProducts
          .map((p) => mapApiProductToProduct(p, goldenJaggeryWhite))
          .filter((p): p is Product => p !== null)
          .slice(0, FEATURED_LIMIT);
        setProducts(mapped);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SectionWrapper className="bg-muted/50">
      <SectionHeading title="Available Products" subtitle="Handpicked fresh items just for you" />
      {loading ? (
        <LoadingSpinner text="Fetching latest products..." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default FeaturedProducts;
