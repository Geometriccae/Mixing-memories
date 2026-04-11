import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Product } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const { isLiked, toggleLike } = useWishlist();
  const liked = isLiked(product.id);
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="group bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow duration-300"
    >
      <Link to={`/products/${product.id}`} className="block text-left">
        <div className="relative overflow-hidden aspect-square bg-muted">
          {product.hasCoverImage === false && product.videoUrl ? (
            <video
              src={product.videoUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              muted
              playsInline
              loop
              preload="metadata"
              aria-label={product.name}
            />
          ) : (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}
          {product.outOfStock ? (
            <span className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full bg-destructive text-destructive-foreground">
              Out of stock
            </span>
          ) : product.lowStock ? (
            <span className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full bg-destructive/90 text-destructive-foreground">
              Limited availability
            </span>
          ) : product.badge ? (
            <span
              className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${
                product.badge === "Sale"
                  ? "bg-destructive text-destructive-foreground"
                  : product.badge === "New"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
              }`}
            >
              {product.badge}
            </span>
          ) : null}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const was = liked;
                toggleLike(product.id);
                toast.success(was ? "Removed from likes" : "Saved to likes");
              }}
              className={`h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
                liked
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-primary hover:text-primary-foreground"
              }`}
              aria-label={liked ? "Remove from likes" : "Add to likes"}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              disabled={product.outOfStock === true}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!product.outOfStock) {
                  addToCart(product);
                  toast.success("Added to cart");
                }
              }}
              className="h-9 w-9 bg-background rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          {product.category ? <p className="text-xs text-muted-foreground mb-1">{product.category}</p> : null}
          <h3 className="font-semibold text-card-foreground mb-2">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-secondary text-secondary" : "text-border"}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({product.rating})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
