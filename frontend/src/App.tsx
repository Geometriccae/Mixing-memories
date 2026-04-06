import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./contexts/CartContext";

const Categories = lazy(() => import("./pages/Categories"));
const Products = lazy(() => import("./pages/Products"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Orders = lazy(() => import("./pages/Orders"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageProducts = lazy(() => import("./pages/admin/ManageProducts"));
const ManageCategories = lazy(() => import("./pages/admin/ManageCategories"));
const ManageTestimonials = lazy(() => import("./pages/admin/ManageTestimonials"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ManageOrders = lazy(() => import("./pages/admin/ManageOrders"));
const AdminStub = lazy(() => import("./pages/admin/AdminStub"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<ManageProducts />} />
              <Route path="/admin/orders" element={<ManageOrders />} />
              <Route path="/admin/orders/placed" element={<ManageOrders />} />
              <Route path="/admin/orders/shipped" element={<ManageOrders />} />
              <Route path="/admin/orders/completed" element={<ManageOrders />} />
              <Route path="/admin/orders/cancelled" element={<ManageOrders />} />
              <Route path="/admin/transactions" element={<AdminStub />} />
              <Route path="/admin/transactions/success" element={<AdminStub />} />
              <Route path="/admin/transactions/pending" element={<AdminStub />} />
              <Route path="/admin/master/manufacturer" element={<AdminStub />} />
              <Route path="/admin/master/quality" element={<AdminStub />} />
              <Route path="/admin/categories" element={<ManageCategories />} />
              <Route path="/admin/testimonials" element={<ManageTestimonials />} />
              <Route path="/admin/users" element={<ManageUsers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
