import { motion } from "framer-motion";
import { Leaf, Truck, Shield, Clock, Sprout } from "lucide-react";
import SectionWrapper from "@/components/common/SectionWrapper";

const features = [
  { icon: Leaf, title: "100% Certified Organic", desc: "Sourced directly from trusted organic farms for the purest, most natural ingredients." },
  { icon: Shield, title: "Nutrient-Dense Superfood", desc: "Rich in protein, dietary fiber, and healthy antioxidants to fuel your body right." },
  { icon: Clock, title: "Clean Ingredients", desc: "No added sugars, artificial preservatives, or toxic pesticides — just honest, wholesome goodness." },
  { icon: Sprout, title: "Plant-Based & Vegan", desc: "A wholesome, guilt-free dietary choice for healthy snacking lovers and families." },
  { icon: Truck, title: "Fast Delivery", desc: "Chennai - within 2 days, Tamil Nadu - within 4 days, All States - within 7 days" }
];

const AboutSection = () => (
  <SectionWrapper>
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="text-primary text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: "'Algerian', cursive" }}>Why Choose Us</span>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-2" style={{ fontFamily: "'Algerian', cursive" }}>
          Right Snack, Right Now
        </h2>
        <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-4" style={{ fontFamily: "'Algerian', cursive" }}>
          Where Every Crunch Tells a Story
        </p>
        <div className="space-y-4 text-muted-foreground leading-relaxed mb-8" style={{ fontFamily: "'Monotype Corsiva', cursive" }}>
          <p>
            Discover the pioneer of Right Snacks. Handcrafted with pure, transparent ingredients
            and a lot of love — wholesome goodness delivered to your doorstep.
          </p>

          <div className="pt-4">
            <h3 className="font-display text-xl font-bold text-foreground mb-4" style={{ fontFamily: "'Algerian', cursive" }}>Our Story</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                <p>
                  Welcome to The Royal Oven, where gourmet luxury meets the comforting warmth of home-baked goodness.
                  We pioneer the art of mindful snacking, crafting exquisite blends that honor both your health and your palate.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                <p>
                  Our recipe is simple yet elite: zero added sugar, sweetened only by nature. We carefully select premium
                  ingredients — hearty Organic Oats, rich Raw Honey, and an abundance of Premium Nuts. For a truly royal
                  distinction, we infuse our blends with the exotic, aromatic touch of real{" "}
                  <span className="font-semibold text-foreground">Gulkand</span> (Rose petal preserve). Every batch is
                  mindfully prepared in our kitchen and packed with pure love, delivering an unmatched artisanal experience
                  straight to your noble table.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              <f.icon className="h-7 w-7" />
            </div>
            <div>
              <h4 className="font-display text-xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Monotype Corsiva', cursive" }}>{f.title}</h4>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed font-medium" style={{ fontFamily: "'Monotype Corsiva', cursive" }}>{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

export default AboutSection;
