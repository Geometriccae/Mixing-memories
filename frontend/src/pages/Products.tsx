import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import ProductCard from "@/components/common/ProductCard";
import type { Product } from "@/data/mockData";
import { fetchPublicProducts, mapApiProductToProduct } from "@/lib/catalogApi";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiProducts = await fetchPublicProducts();
        if (cancelled) return;
        const mapped = apiProducts
          .map((p) => mapApiProductToProduct(p, goldenJaggeryWhite))
          .filter((p): p is Product => p !== null);
        setProducts(mapped);
      } catch {
        if (!cancelled) setProducts([]);
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
};

export default Products;
