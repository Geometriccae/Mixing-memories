import { useState } from "react";
import emailjs from "@emailjs/browser";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      toast.error("Email service is not configured. Please try again later.");
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          name: form.name.trim(),
          reply_to: form.email.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          time: new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
        { publicKey: PUBLIC_KEY },
      );
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      const apiMessage =
        err && typeof err === "object" && "text" in err && typeof err.text === "string"
          ? err.text
          : null;
      toast.error(apiMessage ?? "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SectionWrapper id="contact">
      <SectionHeading title="Get In Touch" subtitle="We'd love to hear from you" />
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={sending}
            className="w-full px-5 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-60"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={sending}
            className="w-full px-5 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-60"
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            disabled={sending}
            className="w-full px-5 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition resize-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {sending ? (
              <>
                Sending... <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                Send Message <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </SectionWrapper>
  );
};

export default ContactSection;
