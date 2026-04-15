import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { toast } from "sonner";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { fetchTestimonials, submitCustomerReview, type TestimonialDoc } from "@/lib/testimonialsApi";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

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
    <SectionWrapper className="bg-muted/50">
      <SectionHeading title="What Our Customers Say" subtitle="Real reviews from real people" />
      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Loading reviews…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6 max-w-lg mx-auto">
          Published reviews will appear here after an admin approves them.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.div
              key={t._id}
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
                  {t.avatar || "?"}
                </div>
                <p className="font-semibold text-foreground">{t.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-10 max-w-xl mx-auto rounded-2xl border border-border bg-card p-6 card-shadow">
        <h3 className="font-display text-lg font-semibold text-foreground text-center">Share your experience</h3>
        {/* <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
          Your review is sent to our team. Once approved, it appears above.
        </p> */}
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
    </SectionWrapper>
  );
};

export default TestimonialsSection;
