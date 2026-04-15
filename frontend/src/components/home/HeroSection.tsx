import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-choco-crunchy-story.png";
import { fetchPublicProducts, mapApiProductToProduct } from "@/lib/catalogApi";
import type { Product } from "@/data/mockData";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";

const MARQUEE_LIMIT = 5;

const HeroSection = () => {
  const [marqueeProducts, setMarqueeProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const apiProducts = await fetchPublicProducts(MARQUEE_LIMIT);
        if (cancelled) return;
        const mapped = apiProducts
          .map((p) => mapApiProductToProduct(p, goldenJaggeryWhite))
          .filter((p): p is Product => p !== null)
          .slice(0, MARQUEE_LIMIT);
        setMarqueeProducts(mapped);
      } catch {
        if (!cancelled) setMarqueeProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loop =
    marqueeProducts.length > 0 ? [...marqueeProducts, ...marqueeProducts] : [];

  return (
    <>
      <section className="hero-gradient relative overflow-hidden">
        <div className="container grid lg:grid-cols-2 gap-8 items-center py-12 md:py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Right snack, right now,
              <br />
              <span className="text-gradient">Where every Crunch tells a story</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg">
              Fresh produce, artisan bakery, and daily essentials — all in one place. Experience premium quality at unbeatable prices.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3.5 rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                View all products
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 hidden">
              <div className="flex -space-x-3">
                {["SJ", "MC", "ED", "AK"].map((initials, i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-bold text-foreground">500k+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <img
              src={heroImg}
              alt="Royal Oven Choco Crunchy Granola — Where every crunch tells a story"
              width={1200}
              height={800}
              className="w-full max-w-md sm:max-w-lg lg:max-w-none h-auto max-h-[min(52vh,440px)] sm:max-h-[min(56vh,480px)] lg:max-h-[min(72vh,560px)] object-contain object-center"
              decoding="async"
            />
          </motion.div>
        </div>
      </section>

      {/* Featured offers marquee — catalog products, links to product detail (same typography as product cards) */}
      <section className="relative border-y border-border/70 bg-gradient-to-b from-muted/50 via-background to-muted/40 py-12 md:py-16 lg:py-20 overflow-hidden">
        <div className="container relative mb-8 md:mb-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">Featured picks</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-foreground mt-3 tracking-tight">Crowd favourites</h2>
          <p className="text-center text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
            Tap a product to view details — same styles as the shop catalog
          </p>
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 md:w-28 bg-gradient-to-r from-background via-background/80 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 md:w-28 bg-gradient-to-l from-background via-background/80 to-transparent"
          aria-hidden
        />
        {loop.length > 0 ? (
          <div className="marquee flex w-max items-stretch">
            {loop.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="flex-shrink-0 mx-3 md:mx-5 first:ml-8 last:mr-8 md:first:ml-12 md:last:mr-12"
              >
                <Link
                  to={`/products/${p.id}`}
                  className="group flex h-full items-center gap-3 md:gap-4 rounded-2xl border border-border/70 bg-card/95 backdrop-blur-sm pl-3 pr-4 py-3 md:pl-3.5 md:pr-5 md:py-3.5 shadow-[0_4px_20px_-6px_hsl(210_11%_15%/0.1)] ring-1 ring-border/25 hover:shadow-[0_8px_28px_-8px_hsl(210_11%_15%/0.12)] transition-shadow duration-300 pointer-events-auto"
                >
                  <div className="h-44 w-44 sm:h-48 sm:w-48 md:h-52 md:w-52 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {p.hasCoverImage === false && p.videoUrl ? (
                      <video
                        src={p.videoUrl}
                        className="h-full w-full object-cover object-center"
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        aria-label={p.name}
                      />
                    ) : (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover object-center" loading="lazy" decoding="async" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 pr-1 text-left max-w-[10.5rem] sm:max-w-[12rem] md:max-w-[13.5rem]">
                    <span className="font-semibold text-base leading-snug text-card-foreground md:text-lg md:leading-tight group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
                      <span className="text-lg font-bold tabular-nums text-primary md:text-xl">₹{p.price.toFixed(2)}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">in store</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">Loading featured products…</p>
        )}
      </section>
    </>
  );
};

export default HeroSection;
