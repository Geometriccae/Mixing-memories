import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Heart, User, Menu, X } from "lucide-react";
import royalOvenLogo from "@/assets/royal-oven-logo.png";
import { useCart } from "@/contexts/CartContext";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/categories", label: "Categories" },
  { path: "/products", label: "Products" },
  { path: "/orders", label: "Orders" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <>
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-sm py-2">
        <div className="container flex flex-wrap justify-between items-center gap-2">
          <span className="min-w-0 break-words">🎉 Flat 50% Off On Grocery Shop — Limited Time!</span>
          <div className="hidden md:flex gap-4 items-center">
            <Link to="/contact" className="hover:underline">Help?</Link>
            <Link to="/admin" className="hover:underline">Admin</Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link
            to="/"
            className="flex shrink-0 items-center py-1 pr-2"
            aria-label="Royal Oven home"
          >
            <span className="flex h-11 w-11 items-center justify-center md:h-[3.35rem] md:w-[3.35rem]">
              <img
                src={royalOvenLogo}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-contain object-center"
                decoding="async"
              />
            </span>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden lg:flex items-center bg-muted rounded-full px-4 py-2 flex-1 max-w-md mx-8">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input
              type="text"
              placeholder="Search products..."
              className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-3 ml-4">
            <button className="relative p-2 hover:bg-muted rounded-full transition-colors">
              <Heart className="h-5 w-5 text-foreground" />
              <span className="absolute -top-0.5 -right-0.5 bg-secondary text-secondary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">3</span>
            </button>
            <Link to="/orders" className="relative p-2 hover:bg-muted rounded-full transition-colors">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {itemCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 bg-secondary text-secondary-foreground text-xs rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center font-bold">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </Link>
            <Link to="/admin" className="p-2 hover:bg-muted rounded-full transition-colors hidden md:flex">
              <User className="h-5 w-5 text-foreground" />
            </Link>
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t overflow-hidden bg-background"
            >
              <nav className="container py-4 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`text-sm font-medium py-2 ${
                      location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 text-muted-foreground">
                  Admin Panel
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Navbar;
