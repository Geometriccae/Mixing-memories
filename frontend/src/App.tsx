import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { AuthProvider } from "./contexts/AuthContext";

const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Orders = lazy(() => import("./pages/Orders"));
const Likes = lazy(() => import("./pages/Likes"));
const Cart = lazy(() => import("./pages/Cart"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrdersOverview = lazy(() => import("./pages/admin/AdminOrdersOverview"));
const ManageProducts = lazy(() => import("./pages/admin/ManageProducts"));
const ManageTestimonials = lazy(() => import("./pages/admin/ManageTestimonials"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ManageOrders = lazy(() => import("./pages/admin/ManageOrders"));
const AdminStub = lazy(() => import("./pages/admin/AdminStub"));
const ManageTransactions = lazy(() => import("./pages/admin/ManageTransactions"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="royal-oven-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <CartProvider>
          <WishlistProvider>
          <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Navigate to="/orders/pending" replace />} />
            <Route path="/orders/success" element={<Orders />} />
            <Route path="/orders/pending" element={<Orders />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<ManageProducts />} />
              <Route path="/admin/orders" element={<ManageOrders />} />
              <Route path="/admin/orders/overview" element={<AdminOrdersOverview />} />
              <Route path="/admin/orders/placed" element={<ManageOrders />} />
              <Route path="/admin/orders/shipped" element={<ManageOrders />} />
              <Route path="/admin/orders/completed" element={<ManageOrders />} />
              <Route path="/admin/orders/cancelled" element={<ManageOrders />} />
              <Route path="/admin/transactions" element={<ManageTransactions />} />
              <Route path="/admin/transactions/success" element={<ManageTransactions />} />
              <Route path="/admin/transactions/pending" element={<ManageTransactions />} />
              <Route path="/admin/master/manufacturer" element={<AdminStub />} />
              <Route path="/admin/master/quality" element={<AdminStub />} />
              <Route path="/admin/testimonials" element={<ManageTestimonials />} />
              <Route path="/admin/users" element={<ManageUsers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </WishlistProvider>
          </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
