import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { toast } from "sonner";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { fetchTestimonials, submitCustomerReview, type TestimonialDoc } from "@/lib/testimonialsApi";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const TestimonialCard = ({ testimonial }: { testimonial: TestimonialDoc }) => (
  <div className="flex-shrink-0 w-[280px] sm:w-[350px] md:w-[400px] lg:w-[450px] h-full bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col">
    <div className="flex justify-between items-start mb-3 sm:mb-4">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star key={j} className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${j < testimonial.rating ? "fill-secondary text-secondary" : "text-border"}`} />
        ))}
      </div>
      <Quote className="h-4 w-4 sm:h-6 sm:w-6 text-primary/10 group-hover:text-primary/20 transition-colors" />
    </div>
    <p className="text-foreground/90 text-xs sm:text-sm md:text-base leading-relaxed italic mb-4 sm:mb-8 line-clamp-4">
      "{testimonial.text}"
    </p>
    <div className="mt-auto flex items-center gap-3">
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm">
        {testimonial.avatar || "?"}
      </div>
      <div>
        <p className="font-bold text-foreground text-xs sm:text-sm md:text-base">{testimonial.name}</p>
      </div>
    </div>
  </div>
);

const TestimonialsSection = () => {
  const { user, token } = useAuth();
  const [items, setItems] = useState<TestimonialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchTestimonials();
        if (!cancelled) setItems(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please sign in to leave a review.");
      return;
    }
    const text = reviewText.trim();
    if (text.length < 4) {
      toast.error("Please write a few words about your experience.");
      return;
    }
    setSubmitting(true);
    try {
      await submitCustomerReview(token, { text, rating: reviewRating });
      setReviewText("");
      setReviewRating(5);
      toast.success("Thanks! Your review was sent for approval.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && items.length === 0 && !user) return null;

  return (
    <section className="relative border-y border-border/70 bg-gradient-to-b from-muted/50 via-background to-muted/40 py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="container relative mb-8 md:mb-10">
        <SectionHeading title="What Our Customers Say" subtitle="Real reviews from real people" />
      </div>

      {loading ? (
        <div className="container">
          <p className="text-center text-sm text-muted-foreground py-8">Loading reviews…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="container">
          <p className="text-center text-sm text-muted-foreground py-6 max-w-lg mx-auto">
            Published reviews will appear here after an admin approves them.
          </p>
        </div>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 md:w-28 bg-gradient-to-r from-background via-background/80 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 md:w-28 bg-gradient-to-l from-background via-background/80 to-transparent"
            aria-hidden
          />
          
          <div className="marquee flex w-max items-stretch">
            {[...items, ...items, ...items].map((t, i) => (
              <div key={`${t._id}-${i}`} className="flex-shrink-0 mx-3 md:mx-5 first:ml-8 last:mr-8 md:first:ml-12 md:last:mr-12">
                <TestimonialCard testimonial={t} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="container mt-12 md:mt-16">
        <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-6 card-shadow">
          <h3 className="font-display text-lg font-semibold text-foreground text-center">Share your experience</h3>
          {user && token ? (
            <form onSubmit={(e) => void handleSubmitReview(e)} className="space-y-4">
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReviewRating(i + 1)}
                    className="p-1 rounded-md hover:bg-muted/80 transition-colors"
                    aria-label={`Rate ${i + 1} out of 5`}
                  >
                    <Star className={`h-6 w-6 ${i < reviewRating ? "fill-secondary text-secondary" : "text-border"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell others what you loved about your order…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Submit review"}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary font-medium hover:underline">
                Sign in
              </Link>{" "}
              to leave a review.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
