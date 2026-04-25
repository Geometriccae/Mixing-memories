import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-choco-crunchy-story.png";
import { fetchPublicProducts, mapApiProductToProduct } from "@/lib/catalogApi";
import type { Product } from "@/data/mockData";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const MARQUEE_LIMIT = 15;

const HeroSection = () => {
  const [marqueeProducts, setMarqueeProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (marqueeProducts.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % Math.min(marqueeProducts.length, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [marqueeProducts.length]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
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
      } finally {
        if (!cancelled) setLoading(false);
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
            <h1 className="font-display font-bold text-foreground leading-tight mb-6">
              <span className="text-4xl md:text-5xl lg:text-6xl block mb-2">Right snack, Right now,</span>
              <span className="text-xl md:text-2xl lg:text-3xl text-gradient block">Where every Crunch tells a story</span>
              {/* don't remove */}
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg">
              Discover the pioneer of Right Snacks. Handcrafted with pure, transparent ingredients and a lot of love  wholesome goodness delivered to your doorstep.
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
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end items-center h-[450px] md:h-[550px] perspective-1000"
          >
            <div className="relative w-full max-w-[600px] h-full flex items-center justify-center">
              {loading || marqueeProducts.length === 0 ? (
                <div className="w-full h-[300px] rounded-3xl bg-muted/50 animate-pulse flex items-center justify-center">
                  <img src={heroImg} alt="Loading..." className="w-1/2 h-1/2 object-contain opacity-20" />
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center preserve-3d">
                  {marqueeProducts.slice(0, 5).map((p, i) => {
                    // Calculate relative index for 3D position
                    let relativeIndex = (i - activeIndex + 5) % 5;
                    if (relativeIndex > 2) relativeIndex -= 5;

                    return (
                      <motion.div
                        key={p.id}
                        animate={{
                          x: relativeIndex * 120, // Horizontal spread
                          z: -Math.abs(relativeIndex) * 150, // Depth
                          rotateY: relativeIndex * -35, // Cylinder angle
                          opacity: 1 - Math.abs(relativeIndex) * 0.3,
                          scale: 1 - Math.abs(relativeIndex) * 0.15,
                        }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="absolute w-[240px] md:w-[280px] aspect-[4/5] z-[10]"
                        style={{
                          transformStyle: "preserve-3d",
                          zIndex: 20 - Math.abs(relativeIndex) * 5,
                        }}
                      >
                        <Link 
                          to={`/products/${p.id}`}
                          className="block w-full h-full rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl bg-white group flex flex-col"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                          
                          {/* Image Container - Increased size */}
                          <div className="flex-1 w-full p-4 md:p-6 flex items-center justify-center relative overflow-hidden">
                             <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110 z-0"
                              />
                          </div>

                          {/* Product Info - Added Name */}
                          <div className="px-4 pb-6 pt-2 text-center bg-white/50 backdrop-blur-sm">
                            <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-wider mb-1 line-clamp-2 leading-tight">
                              {p.name}
                            </p>
                            <p className="text-primary font-black text-sm md:text-base">
                              ₹{p.price.toFixed(2)}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                  
                  {/* Subtle ground reflection/shadow */}
                  <div className="absolute bottom-10 w-[80%] h-10 bg-black/10 blur-3xl rounded-[100%]" />
                </div>
              )}
            </div>

            {/* Navigation Dots - Centered under images */}
            <div className="absolute -bottom-10 md:-bottom-12 left-1/2 -translate-x-1/2 flex gap-2.5 z-40">
              {marqueeProducts.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeIndex === i ? "w-10 bg-primary" : "w-2.5 bg-primary/20 hover:bg-primary/40"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
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
        {loading ? (
          <LoadingSpinner text="Fetching crowd favorites..." className="py-20" />
        ) : marqueeProducts.length > 0 ? (
          <div className="marquee flex w-max items-stretch">
            {loop.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="flex-shrink-0 mx-3 md:mx-5 first:ml-8 last:mr-8 md:first:ml-12 md:last:mr-12"
              >
                <Link
                  to={`/products/${p.id}`}
                  className="group flex h-full items-center gap-2 sm:gap-4 rounded-2xl border border-border/70 bg-card/95 backdrop-blur-sm pl-2 pr-3 py-2 sm:pl-3.5 sm:pr-5 sm:py-3.5 shadow-[0_4px_20px_-6px_hsl(210_11%_15%/0.1)] ring-1 ring-border/25 hover:shadow-[0_8px_28px_-8px_hsl(210_11%_15%/0.12)] transition-shadow duration-300 pointer-events-auto"
                >
                  <div className="h-28 w-28 sm:h-44 sm:w-44 md:h-52 md:w-52 shrink-0 overflow-hidden rounded-xl bg-muted">
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
                  <div className="flex min-w-0 flex-col gap-0.5 pr-1 text-left max-w-[8rem] sm:max-w-[12rem] md:max-w-[13.5rem]">
                    <span className="font-semibold text-sm leading-tight text-card-foreground sm:text-lg sm:leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {p.name}
                    </span>
                    <div className="mt-1 flex flex-wrap items-baseline gap-1 sm:gap-1.5">
                      <span className="text-sm font-bold tabular-nums text-primary sm:text-xl">₹{p.price.toFixed(2)}</span>
                      <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">in store</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">No products available at the moment.</p>
        )}
      </section>
    </>
  );
};

export default HeroSection;
