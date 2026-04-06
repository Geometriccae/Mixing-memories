import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  return (
  <motion.div
    whileHover={{ y: -6 }}
    className="group bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow duration-300"
  >
    <div className="relative overflow-hidden aspect-square bg-muted">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      {product.badge && (
        <span className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${
          product.badge === "Sale" ? "bg-destructive text-destructive-foreground" :
          product.badge === "New" ? "bg-primary text-primary-foreground" :
          "bg-secondary text-secondary-foreground"
        }`}>
          {product.badge}
        </span>
      )}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="h-9 w-9 bg-background rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-primary-foreground transition-colors">
          <Heart className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => addToCart(product)}
          className="h-9 w-9 bg-background rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label="Add to cart"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
    </div>
    <div className="p-4">
      <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
      <h3 className="font-semibold text-card-foreground mb-2">{product.name}</h3>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-secondary text-secondary" : "text-border"}`} />
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
  </motion.div>
  );
};

export default ProductCard;
