import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { testimonials } from "@/data/mockData";

const TestimonialsSection = () => (
  <SectionWrapper className="bg-muted/50">
    <SectionHeading title="What Our Customers Say" subtitle="Real reviews from real people" />
    <div className="grid md:grid-cols-3 gap-6">
      {testimonials.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="bg-card rounded-2xl p-6 card-shadow"
        >
          <Quote className="h-8 w-8 text-primary/20 mb-4" />
          <p className="text-foreground leading-relaxed mb-6">{t.text}</p>
          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, j) => (
              <Star key={j} className={`h-4 w-4 ${j < t.rating ? "fill-secondary text-secondary" : "text-border"}`} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {t.avatar}
            </div>
            <p className="font-semibold text-foreground">{t.name}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </SectionWrapper>
);

export default TestimonialsSection;
