import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import ProductCard from "@/components/common/ProductCard";
import type { Product } from "@/data/mockData";
import { fetchPublicProducts, mapApiProductToProduct } from "@/lib/catalogApi";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-5 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const apiProducts = await fetchPublicProducts();
        if (cancelled) return;
        const mapped = apiProducts
          .map((p) => mapApiProductToProduct(p, goldenJaggeryWhite))
          .filter((p): p is Product => p !== null);
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
    <>
      <Navbar />
      <main className="min-h-screen">
        <SectionWrapper>
          <SectionHeading title="Our Products" subtitle="Fresh & quality products for your everyday needs" />
          {loading ? (
            <ProductGridSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
};

export default Products;
