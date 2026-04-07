import { motion } from "framer-motion";
import { Leaf, Truck, Shield, Clock } from "lucide-react";
import SectionWrapper from "@/components/common/SectionWrapper";

const features = [
  { icon: Leaf, title: "100% Organic", desc: "All our produce is sourced from certified organic farms" },
  { icon: Truck, title: "Fast Delivery", desc: "Same-day delivery on orders placed before 2 PM" },
  { icon: Shield, title: "Quality Guaranteed", desc: "Freshness guaranteed or your money back" },
  { icon: Clock, title: "24/7 Support", desc: "Our support team is always ready to help you" },
];

const AboutSection = () => (
  <SectionWrapper>
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="text-primary text-sm font-semibold uppercase tracking-wider">Why Choose Us</span>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-6">
          At Mixing Memories, Every Blend Is Thoughtfully Crafted with Pure Ingredients, Natural Goodness, and Mindful Care.
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          ◆ We are Pioneer to introduce Granola based snacks.
          <br />
          ◆ We are focused mixing healthy and transparent ingredients that are home made and packed with pure love.
          <br />
          <br />
          <span className="font-semibold text-foreground">Our story</span>
          <br />
          It began with love for family and a promise to choose health without compromise.
          <br />
          At mixing memories every blend is thoughtfully crafted with pure ingredients natural goodness and mindful care.
          <br />
          No shortcuts no guilt just wholesome crunch in every bite.
          <br />
          Make to nourish your body and quietly become a part of your everyday memories.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <f.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{f.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative hidden"
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "500K+", label: "Happy Customers" },
            { value: "150+", label: "Products" },
            { value: "50+", label: "Local Farms" },
            { value: "4.9★", label: "Average Rating" },
          ].map((stat, i) => (
            <div key={i} className={`bg-accent rounded-2xl p-6 text-center ${stat.label === 'Happy Customers' ? 'hidden' : ''}`}>
              <p className="text-3xl font-display font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </SectionWrapper>
);

export default AboutSection;
