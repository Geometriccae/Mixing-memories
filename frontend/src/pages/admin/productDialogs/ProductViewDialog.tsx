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
              <h2 className="text-base font-medium text-[hsl(222_60%_26%)]">View Products</h2>
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
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Product Name :</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Category :</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Sub Category :</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.subCategory}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Product Price :</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.price}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Product Stock :</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.stock}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Manufacturer :</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.manufacturer}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Product Quality :</p>
                      <p className="text-base font-bold text-[hsl(222_60%_22%)] mt-0.5">{product.quality}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Product Description :</p>
                      <p className="text-sm font-bold text-[hsl(222_60%_22%)] mt-2 whitespace-pre-wrap">
                        {product.description || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(222_60%_26%)]">Product Specification :</p>
                      <p className="text-sm font-bold text-[hsl(222_60%_22%)] mt-2 whitespace-pre-wrap">
                        {product.specification || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 w-full lg:w-[200px]">
                    <p className="text-sm font-bold text-[hsl(222_60%_26%)] mb-2">Product Image</p>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full max-w-[200px] mx-auto lg:mx-0 rounded-lg border border-border object-cover aspect-square"
                    />
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
