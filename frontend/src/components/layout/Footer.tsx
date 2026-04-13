import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Globe, Smartphone, FileText } from "lucide-react";
import royalOvenLogo from "@/assets/royal-oven-logo.png";

const WHATSAPP_CHAT_URL = "https://wa.me/917338843363";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              className="h-10 w-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={WHATSAPP_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Chat on WhatsApp"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="h-10 w-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
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
          <h4 className="font-display text-lg font-semibold text-background mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/products" className="hover:text-primary transition-colors">
                All products
              </Link>
            </li>
            <li>
              <Link to="/orders/pending" className="hover:text-primary transition-colors">
                My orders
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-primary transition-colors">
                Cart
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-background mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                No. 1/ 1 First Floor 3rd Street, Kamaraj Nagar Main Road, Avadi, Chennai - 600071
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <a href="tel:+917338843363" className="hover:text-primary transition-colors">
                  73388 43363
                </a>
                <span className="mx-1 text-background/40">·</span>
                <a href="tel:+919043288812" className="hover:text-primary transition-colors">
                  90432 88812
                </a>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a href="tel:+914447659338" className="hover:text-primary transition-colors">
                044 - 47659338
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a href="mailto:mixingmemories2025@gmail.com" className="hover:text-primary transition-colors break-all">
                mixingmemories2025@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0" />
              <a
                href="https://theroyaloven.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                theroyaloven.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 shrink-0" />
              <span>GST No: 33ACGFM2172B1ZQ</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 shrink-0" />
              <span>FSSAI No: 12426023000272</span>
            </li>
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
