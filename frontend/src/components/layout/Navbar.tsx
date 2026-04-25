import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut, Search, ShoppingCart, Heart, User, Menu, X } from "lucide-react";
import { toast } from "sonner";
import royalOvenLogo from "@/assets/royal-oven-logo.png";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { fetchPublicProductsSearch, lookupProductByBarcode, mapApiProductToProduct } from "@/lib/catalogApi";
import type { Product } from "@/data/mockData";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";

const navLinks: { path: string; label: string; authForPath?: string }[] = [
  { path: "/", label: "Home" },
  { path: "/products", label: "Products" },
  { path: "/orders", label: "My Orders", authForPath: "/orders" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [searchHits, setSearchHits] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { likeCount } = useWishlist();
  const { user, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const profileLabel = user ? (user.name.split(/\s+/)[0] ?? "Profile") : "";

  const runProductSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const docs = await fetchPublicProductsSearch(q, 12);
      const mapped = docs
        .map((p) => mapApiProductToProduct(p, goldenJaggeryWhite))
        .filter((p): p is Product => p !== null);
      setSearchHits(mapped);
    } catch {
      setSearchHits([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = headerSearch.trim();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.length < 2) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      void runProductSearch(q);
    }, 320);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [headerSearch, runProductSearch]);

  const submitHeaderSearch = () => {
    const q = headerSearch.trim();
    if (!q) return;
    void (async () => {
      try {
        const id = await lookupProductByBarcode(q);
        if (id) {
          setHeaderSearch("");
          setSearchOpen(false);
          setMobileOpen(false);
          navigate(`/products/${id}`);
          return;
        }
      } catch {
        /* fall through */
      }
      navigate(`/products?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setMobileOpen(false);
    })();
  };

  return (
    <>
      {/* Top bar (primary green strip) — hidden
      <div className="bg-primary text-primary-foreground text-sm py-2">
        <div className="container flex flex-wrap justify-end items-center gap-2">
          <div className="flex gap-4 items-center">
            <Link to="/contact" className="hover:underline">Help?</Link>
            <Link to="/admin" className="hover:underline">Admin</Link>
          </div>
        </div>
      </div>
      */}

      {/* Main nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 py-1 pr-2"
            aria-label="Royal Oven home"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center md:h-[3.35rem] md:w-[3.35rem]">
              <img
                src={royalOvenLogo}
                alt="Royal Oven"
                width={56}
                height={56}
                className="h-full w-full object-contain object-center"
                decoding="async"
              />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
              Royal Oven
            </span>
          </Link>

          {/* Search bar - desktop */}
          <form
            className="hidden lg:block relative flex-1 max-w-md mx-8"
            onSubmit={(e) => {
              e.preventDefault();
              submitHeaderSearch();
            }}
          >
            <div className="flex items-center bg-muted rounded-full px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" aria-hidden />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => {
                  setHeaderSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setSearchOpen(false), 180);
                }}
                placeholder="Search products…"
                autoComplete="off"
                className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground min-w-0"
              />
            </div>
            {searchOpen && headerSearch.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-card shadow-lg max-h-80 overflow-auto">
                {searchLoading ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
                ) : searchHits.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No matches — press Enter to see all search results</p>
                ) : (
                  <ul className="py-1">
                    {searchHits.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/products/${p.id}`}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/60 text-left"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setHeaderSearch("");
                            setSearchOpen(false);
                          }}
                        >
                          <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover border border-border shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                          <span className="text-xs text-primary font-semibold ml-auto shrink-0">₹{p.price.toFixed(2)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </form>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const needsAuth = Boolean(link.authForPath) && !user;
              const to = needsAuth ? "/auth" : link.path === "/orders" ? "/orders/pending" : link.path;
              const state = needsAuth ? { from: link.authForPath } : undefined;
              const active =
                link.path === "/orders"
                  ? location.pathname.startsWith("/orders")
                  : location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={to}
                  state={state}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-3 ml-4">
            <Link
              to="/likes"
              className="relative p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Liked products"
            >
              <Heart className="h-5 w-5 text-foreground" />
              {likeCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 bg-secondary text-secondary-foreground text-xs rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center font-bold">
                  {likeCount > 99 ? "99+" : likeCount}
                </span>
              ) : null}
            </Link>
            <Link to="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors" aria-label="Cart">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {itemCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 bg-secondary text-secondary-foreground text-xs rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center font-bold">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </Link>
            {user ? (
              <div className="hidden md:block relative group">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 hover:bg-muted transition-colors"
                  title="My profile"
                >
                  <span className="p-1.5 rounded-full bg-muted/80">
                    <User className="h-5 w-5 text-foreground" />
                  </span>
                  <span className="text-sm font-medium text-foreground max-w-[7rem] truncate">{profileLabel}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Link>

                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg opacity-0 pointer-events-none translate-y-1 transition-all group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLogoutOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Link
                  to="/auth"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-2 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="text-sm font-semibold rounded-full bg-primary text-primary-foreground px-4 py-2 hover:opacity-90 transition-opacity"
                >
                  Sign up
                </Link>
              </div>
            )}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Visible only on small screens */}
        <div className="lg:hidden container pb-3">
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              submitHeaderSearch();
            }}
          >
            <div className="flex items-center bg-muted/80 rounded-xl px-4 py-2.5 border border-border/40 shadow-sm focus-within:bg-background focus-within:border-primary/30 transition-all">
              <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" aria-hidden />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => {
                  setHeaderSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setSearchOpen(false), 180);
                }}
                placeholder="Search products…"
                autoComplete="off"
                className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground min-w-0"
              />
            </div>
            {searchOpen && headerSearch.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-card shadow-2xl max-h-80 overflow-auto">
                {searchLoading ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground animate-pulse">Searching…</p>
                ) : searchHits.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">No matches found</p>
                ) : (
                  <ul className="py-2">
                    {searchHits.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/products/${p.id}`}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-muted/60 text-left active:bg-muted"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setHeaderSearch("");
                            setSearchOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover border border-border shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                            <p className="text-xs text-primary font-bold">₹{p.price.toFixed(2)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </form>
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
                {navLinks.map((link) => {
                  const needsAuth = Boolean(link.authForPath) && !user;
                  const to = needsAuth ? "/auth" : link.path === "/orders" ? "/orders/pending" : link.path;
                  const state = needsAuth ? { from: link.authForPath } : undefined;
                  const active =
                    link.path === "/orders"
                      ? location.pathname.startsWith("/orders")
                      : location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={to}
                      state={state}
                      onClick={() => setMobileOpen(false)}
                      className={`text-sm font-medium py-2 ${active ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {user ? (
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium py-2 text-muted-foreground"
                  >
                    My profile
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-medium py-2 text-primary"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/auth?mode=signup"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-medium py-2 text-muted-foreground"
                    >
                      Create account
                    </Link>
                  </>
                )}
                <Link
                  to="/likes"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium py-2 text-muted-foreground"
                >
                  Liked products{likeCount > 0 ? ` (${likeCount})` : ""}
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out?"
        description="You will be signed out from your account."
        confirmLabel="Logout"
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
          toast.success("Signed out.");
        }}
      />
    </>
  );
};

export default Navbar;
