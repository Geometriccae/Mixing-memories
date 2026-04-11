import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import type { Product } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPublicProductById, mapApiProductToProduct } from "@/lib/catalogApi";
import goldenJaggeryWhite from "@/assets/royal-oven-golden-jaggery-white.png";
import { createOrder } from "@/lib/orderApi";
import PaymentMethodDialog, { type PaymentMethod } from "@/components/checkout/PaymentMethodDialog";

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isLiked, toggleLike } = useWishlist();
  const { user, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [pmOpen, setPmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [orderingNow, setOrderingNow] = useState(false);

  const addressOk = useMemo(() => {
    if (!user) return false;
    const a = user.address;
    return Boolean(a.line1 && a.city && a.state && a.pincode);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const doc = await fetchPublicProductById(productId);
        if (cancelled) return;
        const mapped = doc ? mapApiProductToProduct(doc, goldenJaggeryWhite) : null;
        setProduct(mapped);
        if (mapped) {
          const start = mapped.hasCoverImage === false && mapped.videoUrl ? mapped.videoUrl : mapped.image;
          setActiveImage(start);
          setImageLoading(true);
        }
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const thumbs = product
    ? [
        ...(product.hasCoverImage === false ? [] : [product.image]),
        ...(product.variantImageUrls || []),
        ...(product.videoUrl ? [product.videoUrl] : []),
      ].filter((u, i, a) => u && a.indexOf(u) === i)
    : [];

  const mainSrc = activeImage || product?.image || "";
  const mainIsVideo = Boolean(product?.videoUrl && mainSrc === product.videoUrl);

  const handleOrderNow = async () => {
    if (!product) return;
    if (!token || !user) {
      toast.error("Please sign in to place an order.");
      return;
    }
    if (!addressOk) {
      toast.error("Please fill your delivery address in Profile.");
      return;
    }
    setOrderingNow(true);
    try {
      await createOrder(token, {
        items: [
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
          },
        ],
        paymentMethod,
      });
      toast.success("Order placed successfully!");
      setPmOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to place order.");
    } finally {
      setOrderingNow(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <SectionWrapper>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </Link>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !product ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-foreground font-medium">Product not found</p>
              <p className="text-sm text-muted-foreground mt-2">It may have been removed or the link is invalid.</p>
              <Link to="/products" className="inline-block mt-4 text-primary font-medium hover:underline">
                Browse products
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
              <div className="space-y-3 max-w-xl mx-auto w-full">
                    <div className="rounded-xl overflow-hidden border border-border bg-muted aspect-square relative">
                      {mainIsVideo ? (
                        <video
                          src={mainSrc}
                          controls
                          className="w-full h-full object-contain bg-black"
                          onLoadedData={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                        />
                      ) : (
                        <img
                          src={mainSrc}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onLoad={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                        />
                      )}
                      {imageLoading ? (
                        <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : null}
                    </div>
                {thumbs.length > 1 ? (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {thumbs.map((url) => {
                      const isVid = product.videoUrl === url;
                      const isActive = (activeImage || product.image) === url;
                      return (
                      <button
                        key={url}
                        type="button"
                            onClick={() => {
                              setImageLoading(true);
                              setActiveImage(url);
                            }}
                        className={`h-16 w-16 rounded-lg border overflow-hidden shrink-0 ${
                          isActive ? "ring-2 ring-primary ring-offset-2" : "border-border"
                        }`}
                      >
                        {isVid ? (
                          <video src={url} className="w-full h-full object-cover bg-black" muted playsInline preload="metadata" />
                        ) : (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    );})}
                  </div>
                ) : null}
              </div>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.name}</h1>
                  <button
                    type="button"
                    onClick={() => {
                      const was = isLiked(product.id);
                      toggleLike(product.id);
                      toast.success(was ? "Removed from likes" : "Saved to likes");
                    }}
                    className={`shrink-0 h-11 w-11 rounded-full border flex items-center justify-center transition-colors ${
                      isLiked(product.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    aria-label={isLiked(product.id) ? "Remove from likes" : "Add to likes"}
                  >
                    <Heart className={`h-5 w-5 ${isLiked(product.id) ? "fill-current" : ""}`} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-secondary text-secondary" : "text-border"}`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">({product.rating})</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <p className="text-3xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
                  {product.actualPrice != null && product.actualPrice > product.price ? (
                    <span className="text-xl text-muted-foreground line-through">₹{product.actualPrice.toFixed(2)}</span>
                  ) : null}
                </div>
                {product.actualPrice != null && product.actualPrice <= product.price ? (
                  <p className="text-sm text-muted-foreground">
                    Actual price:{" "}
                    <span className="font-medium text-foreground">₹{product.actualPrice.toFixed(2)}</span>
                  </p>
                ) : null}
                {product.outOfStock ? (
                  <p className="text-sm font-medium text-destructive">Out of stock</p>
                ) : product.lowStock ? (
                  <p className="text-sm font-medium text-destructive">Limited products are available</p>
                ) : null}
                {product.description ? (
                  <div className="border-t border-border pt-4">
                    <h2 className="text-sm font-semibold text-foreground mb-2">Description</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
                  </div>
                ) : null}
                {product.specification ? (
                  <div className="border-t border-border pt-4">
                    <h2 className="text-sm font-semibold text-foreground mb-2">Specification</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.specification}</p>
                  </div>
                ) : null}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    disabled={product.outOfStock === true}
                    onClick={() => {
                      addToCart(product);
                      toast.success("Added to cart");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#000533] text-white font-medium px-6 py-3 hover:opacity-90 transition-opacity w-full sm:w-auto sm:min-w-[180px] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {product.outOfStock ? "Out of stock" : "Add to cart"}
                  </button>
                  <button
                    type="button"
                    disabled={product.outOfStock === true}
                    onClick={() => {
                      if (!user || !token) {
                        toast.error("Please log in to place an order.");
                        navigate("/auth", { state: { from: location.pathname } });
                        return;
                      }
                      if (!addressOk) {
                        toast.error("Please fill your delivery address in Profile before ordering.");
                        return;
                      }
                      setPmOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background text-foreground font-medium px-6 py-3 hover:bg-muted/50 transition-colors w-full sm:w-auto sm:min-w-[180px] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Order now
                  </button>
                </div>
              </div>
            </div>
          )}
        </SectionWrapper>
      </main>
      <Footer />
      <PaymentMethodDialog
        open={pmOpen}
        onOpenChange={setPmOpen}
        value={paymentMethod}
        onChange={setPaymentMethod}
        title="Payment method"
        confirmLabel="Place order"
        confirming={orderingNow}
        onConfirm={() => void handleOrderNow()}
      />
    </>
  );
};

export default ProductDetail;
