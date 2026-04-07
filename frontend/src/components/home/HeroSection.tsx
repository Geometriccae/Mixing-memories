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
              to="/categories"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3.5 rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Browse Categories
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

    {/* Custom Ticker Items */}
    {(() => {
      const tickerItems = [
        { name: "CHOCO CRUNCHY GRANOLA", price: 270, image: chocoTicker },
        { name: "GULKAND-E-MEWA", price: 300, image: mewaTicker },
      ];
      return (
        <div className="bg-foreground py-10 md:py-16 overflow-hidden">
          <div className="marquee flex whitespace-nowrap items-center">
            {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((p, i) => (
              <div key={i} className="flex-shrink-0 inline-flex items-center gap-12 bg-white/20 backdrop-blur-xl rounded-[2.5rem] px-16 py-10 mx-12 border border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                <img src={p.image} alt={p.name} className="h-40 w-40 md:h-52 md:w-52 object-contain drop-shadow-2xl scale-110" />
                <div className="flex flex-col gap-2 pr-4">
                  <span className="text-background font-bold text-3xl md:text-5xl tracking-tighter uppercase whitespace-nowrap leading-none">{p.name}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-secondary font-black text-4xl md:text-7xl">₹{p.price.toFixed(2)}</span>
                    <span className="text-background/40 text-lg md:text-xl font-medium tracking-wide">ONLY</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })()}
  </>
);

export default HeroSection;
