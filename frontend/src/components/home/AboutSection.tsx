import { motion } from "framer-motion";
import { Leaf, Truck, Shield, Clock } from "lucide-react";
import SectionWrapper from "@/components/common/SectionWrapper";

const features = [
  { icon: Leaf, title: "100% Organic", desc: "All our produce is sourced from certified organic farms" },
  { icon: Shield, title: "Quality Guaranteed", desc: "Freshness guaranteed or your money back" },
  { icon: Clock, title: "Easy Replacement", desc: "Replacement within 2 working days" },
  { icon: Truck, title: "Fast Delivery", desc: "Chennai - within 2 days, Tamil Nadu - within 4 days, Outside - within 7 days" },
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
          ◆ We are Pioneer to introduce Right Snacks.
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
              <h4 className="font-display text-lg font-bold text-foreground leading-tight">{f.title}</h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-medium">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

export default AboutSection;
