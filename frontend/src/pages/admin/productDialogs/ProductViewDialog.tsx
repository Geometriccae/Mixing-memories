import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminProductRow } from "./productTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProductRow | null;
};

const ProductViewDialog = ({ open, onOpenChange, product }: Props) => {
  const handleBack = () => onOpenChange(false);
  const stockLow = product ? product.minStock > 0 && product.stock <= product.minStock : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-3xl p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-3xl",
          "[&>button]:hidden",
        )}
      >
        <div className="rounded-xl overflow-hidden border border-border/60 bg-card shadow-lg max-h-[90vh] flex flex-col">
          <div className="bg-card p-5 md:p-6 overflow-y-auto">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <h2 className="text-base font-medium text-[hsl(222_60%_26%)]">View product</h2>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Back
              </button>
            </div>

            {product ? (
              <div className="mt-5 rounded-lg bg-muted/50 border border-border/40 p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Product name</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.name}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Selling price</p>
                        <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">₹{product.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Actual price</p>
                        <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">
                          {product.actualPrice != null ? `₹${product.actualPrice.toFixed(2)}` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Stock</p>
                        <p className={`text-base font-bold mt-0.5 ${stockLow ? "text-destructive" : "text-[hsl(222_60%_22%)]"}`}>
                          {product.stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Min stock</p>
                        <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.minStock}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Description</p>
                      <p className="text-sm font-bold text-[hsl(222_60%_22%)] mt-2 whitespace-pre-wrap">
                        {product.description || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Specification</p>
                      <p className="text-sm font-bold text-[hsl(222_60%_22%)] mt-2 whitespace-pre-wrap">
                        {product.specification || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 w-full lg:w-[220px] space-y-4">
                    {product.hasImage ? (
                      <div>
                        <p className="text-sm font-bold text-[hsl(222_60%_26%)] mb-2">Product image</p>
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full max-w-[220px] mx-auto lg:mx-0 rounded-lg border border-border object-cover aspect-square"
                        />
                      </div>
                    ) : null}
                    {product.hasVideo ? (
                      <div>
                        <p className="text-sm font-bold text-[hsl(222_60%_26%)] mb-2">Product video</p>
                        <video
                          src={product.videoUrl}
                          controls
                          className="w-full max-w-[220px] mx-auto lg:mx-0 rounded-lg border border-border bg-black aspect-square object-contain"
                        />
                      </div>
                    ) : null}
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)] mb-2">Variant images</p>
                      <div className="flex flex-wrap gap-2">
                        {product.variantImageUrls.map((url, i) =>
                          url ? (
                            <img
                              key={i}
                              src={url}
                              alt={`Variant ${i + 1}`}
                              className="h-16 w-16 rounded border border-border object-cover"
                            />
                          ) : (
                            <div
                              key={i}
                              className="h-16 w-16 rounded border border-dashed border-border bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground text-center px-1"
                            >
                              —
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewDialog;
