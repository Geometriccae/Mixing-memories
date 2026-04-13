import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import ProductCard from "@/components/common/ProductCard";
import type { Product } from "@/data/mockData";
import { useWishlist } from "@/contexts/WishlistContext";
import { fetchPublicProducts, mapApiProductToProduct } from "@/lib/catalogApi";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";

const Likes = () => {
  const { likedIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const apiProducts = await fetchPublicProducts(500);
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

  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);
  const likedProducts = useMemo(
    () => products.filter((p) => likedSet.has(p.id)),
    [products, likedSet],
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <SectionWrapper>
          <SectionHeading title="Liked products" subtitle="Items you saved with the heart icon" />

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : likedIds.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center max-w-lg mx-auto">
              <p className="text-foreground font-medium">No likes yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tap the heart on a product to save it here.
              </p>
              <Link to="/products" className="inline-block mt-4 text-primary font-medium hover:underline">
                Browse products
              </Link>
            </div>
          ) : likedProducts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center max-w-lg mx-auto">
              <p className="text-foreground font-medium">No matching products</p>
              <p className="text-sm text-muted-foreground mt-2">
                Some liked items may no longer be available in the catalog.
              </p>
              <Link to="/products" className="inline-block mt-4 text-primary font-medium hover:underline">
                Browse products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {likedProducts.map((p) => (
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

export default Likes;
