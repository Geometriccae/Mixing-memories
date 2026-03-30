import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram } from "lucide-react";
import royalOvenLogo from "@/assets/royal-oven-logo.png";

const Footer = () => (
  <footer className="bg-foreground text-background/80">
    <div className="container py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="mb-4 flex justify-start">
            <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-[5.25rem] sm:w-[5.25rem]">
              <img
                src={royalOvenLogo}
                alt="Royal Oven"
                width={84}
                height={84}
                className="h-full w-full object-contain object-center"
                decoding="async"
              />
            </span>
          </div>
          <p className="text-sm leading-relaxed mb-6">Your one-stop shop for quality groceries. Fresh produce, artisan bakery, and daily essentials delivered to your door.</p>
          <div className="flex gap-3">
            {[Facebook, Twitter, Instagram].map((Icon, i) => (
              <a key={i} href="#" className="h-10 w-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-background mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[{ to: "/", label: "Home" }, { to: "/about", label: "About Us" }, { to: "/products", label: "Products" }, { to: "/contact", label: "Contact" }].map(l => (
              <li key={l.to}><Link to={l.to} className="hover:text-primary transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-background mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            {["Vegetables", "Fruits", "Bakery", "Dairy & Eggs"].map(c => (
              <li key={c}><Link to="/categories" className="hover:text-primary transition-colors">{c}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-background mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> 1/1A, First floor, 3rd street, Kamaraj Nagar Main Road, Avadi, Chennai- 600 071.</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> info@royaloven.com</li>
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t border-background/10 py-6">
      <div className="container text-center text-sm text-background/50">
        © 2026 Royal Oven. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
