import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-choco-crunchy-granola.png";
import { products } from "@/data/mockData";
import chocoTicker from "@/assets/royal-oven-choco-crunchy.png";
import mewaTicker from "@/assets/royal-oven-golden-jaggery-hero.png";

const HeroSection = () => (
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
                <div key={i} className="h-10 w-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img src={heroImg} alt="Royal Oven Choco Crunchy Granola" width={1920} height={1080} className="w-full h-auto object-cover" />
          </div>
        </motion.div>
      </div>
    </section>

    {/* Featured offers marquee — light strip, seamless loop (two copies) */}
    {(() => {
      const tickerItems = [
        { name: "Choco Crunchy Granola", price: 270, image: chocoTicker },
        { name: "Gulkand-e-Mewa", price: 300, image: mewaTicker },
      ];
      const loop = [...tickerItems, ...tickerItems];
      return (
        <section className="relative border-y border-border/70 bg-gradient-to-b from-muted/40 via-background to-muted/30 py-10 md:py-14 overflow-hidden">
          <div className="container relative mb-6 md:mb-8">
            <p className="text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Featured picks
            </p>
            <p className="text-center text-xs text-muted-foreground/80 mt-1 max-w-md mx-auto">
              Popular items — same quality, straight from our catalog
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-24 bg-gradient-to-r from-background to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-24 bg-gradient-to-l from-background to-transparent" aria-hidden />
          <div className="marquee flex w-max items-stretch">
            {loop.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex-shrink-0 mx-3 md:mx-5 first:ml-8 last:mr-8 md:first:ml-12 md:last:mr-12"
              >
                <div className="flex h-full items-center gap-6 md:gap-10 rounded-2xl border border-border/80 bg-card px-6 py-5 md:px-10 md:py-7 shadow-[0_2px_16px_-4px_hsl(210_11%_15%/0.08)] ring-1 ring-border/40">
                  <div className="flex h-28 w-28 md:h-36 md:w-36 shrink-0 items-center justify-center rounded-xl bg-muted/50 p-2">
                    <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 pr-2 text-left">
                    <span className="font-display text-lg font-semibold leading-snug text-foreground md:text-2xl md:leading-tight">
                      {p.name}
                    </span>
                    <div className="mt-2 flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-2xl font-bold tabular-nums text-primary md:text-4xl">
                        ₹{p.price.toFixed(2)}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">in store</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    })()}
  </>
);

export default HeroSection;
