const Testimonial = require("../models/Testimonial");

const DEFAULT_TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    text: "The freshest produce I've ever had delivered. The quality is consistently outstanding, and the organic options are wonderful!",
    rating: 5,
    avatar: "SJ",
  },
  {
    name: "Mike Chen",
    text: "Love the bakery section! The sourdough bread is incredible, and the pastries are always fresh. Best grocery shop in town.",
    rating: 5,
    avatar: "MC",
  },
  {
    name: "Emily Davis",
    text: "Amazing variety and unbeatable prices. The customer service is exceptional — they always go above and beyond.",
    rating: 4,
    avatar: "ED",
  },
];

async function seedTestimonialsIfEmpty() {
  try {
    const n = await Testimonial.countDocuments();
    if (n > 0) return;
    await Testimonial.insertMany(DEFAULT_TESTIMONIALS);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("seedTestimonialsIfEmpty:", err.message);
  }
}

module.exports = { seedTestimonialsIfEmpty };
