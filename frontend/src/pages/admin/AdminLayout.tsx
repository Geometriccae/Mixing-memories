import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Monitor,
  Store,
  ShoppingCart,
  IndianRupee,
  UserCircle,
  Boxes,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const isOrdersPath = (p: string) => p === "/admin/orders" || p.startsWith("/admin/orders/");
const isTransactionsPath = (p: string) => p === "/admin/transactions" || p.startsWith("/admin/transactions/");
const isMasterPath = (p: string) => p.startsWith("/admin/master/") || p === "/admin/testimonials";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Product Management",
  "/admin/orders": "Orders",
  "/admin/orders/overview": "Orders overview",
  "/admin/orders/placed": "Placed Orders",
  "/admin/orders/shipped": "Shipped Orders",
  "/admin/orders/completed": "Completed Orders",
  "/admin/orders/cancelled": "Cancelled Orders",
  "/admin/transactions": "Transactions",
  "/admin/transactions/success": "Success Transaction",
  "/admin/transactions/pending": "Pending Transaction",
  "/admin/users": "Customer",
  "/admin/testimonials": "Testimonials",
  "/admin/master/manufacturer": "Manufacturer List",
  "/admin/master/quality": "Quality List",
};

function headerTitleForPath(pathname: string): string {
  return PAGE_TITLES[pathname] ?? "Admin";
}

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(() => isOrdersPath(location.pathname));
  const [masterOpen, setMasterOpen] = useState(() => isMasterPath(location.pathname));

  useEffect(() => {
    if (sessionStorage.getItem("admin_demo") !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  useEffect(() => {
    if (isOrdersPath(location.pathname)) setOrdersOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isMasterPath(location.pathname)) setMasterOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const headerTitle = useMemo(() => headerTitleForPath(location.pathname), [location.pathname]);

  const isDark = (resolvedTheme ?? theme) === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const confirmLogout = () => {
    sessionStorage.removeItem("admin_demo");
    sessionStorage.removeItem("admin_token");
    setLogoutOpen(false);
    setSidebarOpen(false);
    navigate("/admin");
  };

  const itemClass = (path: string) => {
    const active = location.pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
    }`;
  };

  const subLinkClass = (path: string) =>
    `flex items-start gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
      location.pathname === path
        ? "bg-sidebar-accent text-sidebar-primary font-medium"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40"
    }`;

  const ordersParentActive = isOrdersPath(location.pathname);
  const masterParentActive = isMasterPath(location.pathname);

  return (
    <div className="min-h-screen bg-muted">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-sidebar-border shrink-0">
          <Link to="/" className="font-display text-xl font-bold text-sidebar-primary-foreground">
            Royal Oven
          </Link>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Admin Panel</p>
        </div>

        <nav className="admin-sidebar-scroll flex-1 overflow-y-auto p-4 pb-28">
          <div className="px-4 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">Main</div>
          <Link
            to="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={itemClass("/admin/dashboard")}
          >
            <Monitor className="h-5 w-5 shrink-0" />
            Dashboards
          </Link>

          <div className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            Product Management
          </div>
          <Link
            to="/admin/products"
            onClick={() => setSidebarOpen(false)}
            className={itemClass("/admin/products")}
          >
            <Store className="h-5 w-5 shrink-0" />
            Product Management
          </Link>

          <div className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            Order Management
          </div>
          <button
            type="button"
            onClick={() => setOrdersOpen((o) => !o)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left ${
              ordersParentActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
            }`}
          >
            <ShoppingCart className="h-5 w-5 shrink-0" />
            <span className="flex-1">Orders</span>
            {ordersOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
            )}
          </button>
          {ordersOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
              <Link
                to="/admin/orders/overview"
                onClick={() => setSidebarOpen(false)}
                className={subLinkClass("/admin/orders/overview")}
              >
                <span className="text-sidebar-foreground/50 shrink-0">-</span>
                <span>Orders overview &amp; charts</span>
              </Link>
              {[
                { to: "/admin/orders/placed", label: "Placed Orders" },
                { to: "/admin/orders/shipped", label: "Shipped Orders" },
                { to: "/admin/orders/completed", label: "Completed Orders" },
                { to: "/admin/orders/cancelled", label: "Cancelled Orders" },
              ].map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setSidebarOpen(false)} className={subLinkClass(to)}>
                  <span className="text-sidebar-foreground/50 shrink-0">-</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            Transaction Management
          </div>
          <Link
            to="/admin/transactions/success"
            onClick={() => setSidebarOpen(false)}
            className={itemClass("/admin/transactions/success")}
          >
            <IndianRupee className="h-5 w-5 shrink-0" />
            Successful payments
          </Link>
          <Link
            to="/admin/transactions/pending"
            onClick={() => setSidebarOpen(false)}
            className={itemClass("/admin/transactions/pending")}
          >
            <IndianRupee className="h-5 w-5 shrink-0" />
            Pending payments
          </Link>

          <div className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            Customer Management
          </div>
          <Link to="/admin/users" onClick={() => setSidebarOpen(false)} className={itemClass("/admin/users")}>
            <UserCircle className="h-5 w-5 shrink-0" />
            Customer
          </Link>

          <div className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">Common Data</div>
          <button
            type="button"
            onClick={() => setMasterOpen((o) => !o)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left ${
              masterParentActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
            }`}
          >
            <Boxes className="h-5 w-5 shrink-0" />
            <span className="flex-1">Master Data</span>
            {masterOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
            )}
          </button>
          {masterOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-2">
              <div className="px-4 pt-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">List</div>
              <div className="space-y-0.5">
                {[
                  { to: "/admin/master/manufacturer", label: "Manufacturer List" },
                  { to: "/admin/master/quality", label: "Quality List" },
                ].map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setSidebarOpen(false)} className={subLinkClass(to)}>
                    <span className="text-sidebar-foreground/50 shrink-0">-</span>
                    <span>{label}</span>
                  </Link>
                ))}
                <Link
                  to="/admin/testimonials"
                  onClick={() => setSidebarOpen(false)}
                  className={subLinkClass("/admin/testimonials")}
                >
                  <span className="text-sidebar-foreground/50 shrink-0">-</span>
                  <span>Testimonials</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex flex-col h-[100dvh] min-h-0 overflow-hidden bg-muted lg:pl-64">
        <header className="shrink-0 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-3.5">
            <button
              type="button"
              className="lg:hidden shrink-0 p-2 rounded-md hover:bg-sidebar-accent/50 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-sidebar-foreground" />
            </button>
            <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-sidebar-foreground tracking-tight truncate min-w-0 flex-1">
              {headerTitle}
            </h1>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                disabled={!themeReady}
                className="p-2 rounded-md hover:bg-sidebar-accent/50 transition-colors disabled:opacity-50"
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              >
                {!themeReady ? (
                  <Moon className="h-5 w-5 text-sidebar-foreground/90" />
                ) : isDark ? (
                  <Sun className="h-5 w-5 text-sidebar-foreground/90" />
                ) : (
                  <Moon className="h-5 w-5 text-sidebar-foreground/90" />
                )}
              </button>
              <span className="text-xs sm:text-sm font-medium text-sidebar-foreground/90 pr-0.5 sm:pr-1">Admin</span>
            </div>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6">
          <Outlet />
        </main>
        <footer className="shrink-0 bg-background border-t border-border py-4 px-4">
          <p className="text-center text-sm text-muted-foreground">
            Copyright © 2026 . Designed with <span className="text-red-500">❤️</span> by{" "}
            <strong className="font-semibold underline underline-offset-2 text-foreground">GES</strong> All rights reserved
          </p>
        </footer>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will leave the admin panel and need to sign in again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button type="button" className={cn(buttonVariants(), "sm:mt-0")} onClick={confirmLogout}>
              Log out
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLayout;
