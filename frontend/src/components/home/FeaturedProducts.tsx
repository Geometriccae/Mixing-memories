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
        // Add a small artificial delay to ensure the spinner is visible and not flickering
        const [apiProducts] = await Promise.all([
          fetchPublicProducts(FEATURED_LIMIT + 4),
          new Promise((resolve) => setTimeout(resolve, 600))
        ]);
        
        if (cancelled) return;
        const mapped = apiProducts
          .map((p) => mapApiProductToProduct(p, goldenJaggeryWhite))
          .filter((p): p is Product => p !== null)
          .slice(0, FEATURED_LIMIT);
        setProducts(mapped);
      } catch (err) {
        console.error("Failed to fetch products:", err);
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
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          <LoadingSpinner text="Fetching latest products..." />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-dashed border-border shadow-sm">
          <p className="text-muted-foreground font-medium mb-4">No products available at the moment.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all text-sm"
          >
            Refresh Page
          </button>
        </div>
      )}
    </SectionWrapper>
  );
};

export default FeaturedProducts;
