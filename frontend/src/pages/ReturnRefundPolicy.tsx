import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { RefreshCw, AlertTriangle, RotateCcw, XCircle, Phone, Mail } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const WHATSAPP_URL = "https://wa.me/917338843363";

const sections = [
  {
    id: 1,
    icon: RotateCcw,
    title: "Returns",
    color: "text-rose-500",
    bg: "bg-rose-500/8",
    border: "border-rose-500/20",
    iconBg: "bg-rose-50 dark:bg-rose-950",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Due to the nature of our products, we do not accept returns unless:
        </p>
        <ul className="space-y-2.5 mb-4">
          {[
            "You receive a damaged, expired, or wrong product.",
            "The product (the bottle) without seal and broken during transit.",
          ].map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              {pt}
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            If you experience any of the above, please contact us within{" "}
            <span className="font-semibold text-amber-600">48 hours</span> of delivery.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 2,
    icon: RefreshCw,
    title: "Refunds",
    color: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
    iconBg: "bg-primary/10",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Refunds will be issued only under these conditions:
        </p>
        <ul className="space-y-2.5 mb-4">
          {[
            "Product is unavailable or out of stock after your order is placed.",
            "You received the wrong or damaged item and are unable to receive a replacement.",
          ].map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {pt}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Refunds will be processed to your original payment method within{" "}
          <span className="font-semibold text-foreground">7–10 business days</span> after approval.
        </p>
      </>
    ),
  },
  {
    id: 3,
    icon: RotateCcw,
    title: "Replacement Policy",
    color: "text-emerald-500",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          If eligible, we will offer a <span className="font-semibold text-foreground">free replacement</span> of the product. Please share:
        </p>
        <ul className="space-y-2.5 mb-4">
          {[
            "A photo of the product and packaging.",
            "Order number and reason for replacement.",
          ].map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              {pt}
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <a
            href="mailto:mixingmemories2025@gmail.com"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            mixingmemories2025@gmail.com
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline"
          >
            <Phone className="h-4 w-4" />
            7338843363 / 90432 88812
          </a>
        </div>
      </>
    ),
  },
  {
    id: 4,
    icon: XCircle,
    title: "Cancellation",
    color: "text-amber-500",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    iconBg: "bg-amber-50 dark:bg-amber-950",
    content: (
      <ul className="space-y-2.5">
        {[
          "Orders can only be canceled before dispatch. Once shipped, cancellations are not possible.",
          "To cancel, contact us as soon as possible after placing the order.",
        ].map((pt, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            {pt}
          </li>
        ))}
      </ul>
    ),
  },
];

const ReturnRefundPolicy = () => (
  <>
    <Navbar />
    <main className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background pt-28 pb-16">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div className="container relative text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold px-4 py-1.5 mb-5"
          >
            <RefreshCw className="h-4 w-4" />
            Policy Details
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Return &amp; Refund Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            At Royal Oven, customer satisfaction and product quality are our top priorities.
            Since our products are perishable and handcrafted, we follow a transparent but strict return and refund policy.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground/50 mt-4"
          >
            Last updated: May 2026
          </motion.p>
        </div>
      </section>

      {/* ── Policy Sections ── */}
      <section className="container py-14">
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((sec, i) => (
            <motion.div
              key={sec.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`rounded-2xl border p-6 md:p-8 ${sec.bg} ${sec.border} hover:shadow-md transition-shadow duration-300`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`h-11 w-11 rounded-xl ${sec.iconBg} flex items-center justify-center shadow-sm`}>
                  <sec.icon className={`h-5 w-5 ${sec.color}`} />
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-widest ${sec.color} opacity-70`}>
                    0{sec.id}
                  </span>
                  <h2 className="font-display text-xl font-bold text-foreground">{sec.title}</h2>
                </div>
              </div>

              {/* Section Content */}
              {sec.content}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section className="container pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto rounded-3xl bg-primary/5 border border-primary/15 p-8 text-center"
        >
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Still have questions?
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Our team is here to help. Reach out via email or WhatsApp — we respond quickly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:mixingmemories2025@gmail.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-3 hover:opacity-90 transition-opacity"
            >
              <Mail className="h-4 w-4" />
              Email Us
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 text-primary font-semibold px-6 py-3 hover:bg-primary/5 transition-colors"
            >
              <Phone className="h-4 w-4" />
              WhatsApp / Call
            </a>
          </div>
        </motion.div>
      </section>

    </main>
    <Footer />
  </>
);

export default ReturnRefundPolicy;
