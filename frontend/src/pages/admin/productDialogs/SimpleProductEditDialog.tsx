import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminProductRow } from "./productTypes";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export type UpdateProductPayload = {
  name: string;
  description: string;
  specification: string;
  price: number;
  actualPrice: number | null;
  stock: number;
  minStock: number;
  imageDataUrl: string | null;
  variantImageDataUrls: [string | null, string | null, string | null];
  removeMainImage?: boolean;
  removeVariants?: [boolean, boolean, boolean];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProductRow | null;
  onUpdate: (id: string, data: UpdateProductPayload) => Promise<void>;
};

const SimpleProductEditDialog = ({ open, onOpenChange, product, onUpdate }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState("");
  const [price, setPrice] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [mainFileLabel, setMainFileLabel] = useState("No file chosen");
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [removeMainImage, setRemoveMainImage] = useState(false);
  const [removeVariants, setRemoveVariants] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [isSaving, setIsSaving] = useState(false);
  const mainInputRef = useRef<HTMLInputElement | null>(null);
  const variantInputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null]);
  const [variantLabels, setVariantLabels] = useState<[string, string, string]>(["Keep current", "Keep current", "Keep current"]);
  const [variantPreviews, setVariantPreviews] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);

  useEffect(() => {
    if (!product || !open) return;
    setName(product.name);
    setDescription(product.description);
    setSpecification(product.specification);
    setPrice(String(product.price));
    setActualPrice(product.actualPrice != null ? String(product.actualPrice) : "");
    setStock(String(product.stock));
    setMinStock(String(product.minStock));
    setMainFileLabel("No file chosen");
    setMainImage(null);
    setRemoveMainImage(false);
    setVariantLabels(["Keep current", "Keep current", "Keep current"]);
    setVariantPreviews([
      product.variantImageUrls[0] ?? null,
      product.variantImageUrls[1] ?? null,
      product.variantImageUrls[2] ?? null,
    ]);
    setRemoveVariants([false, false, false]);
    setIsSaving(false);
  }, [product, open]);

  const handleBack = () => onOpenChange(false);
  const clearMainImage = () => {
    if (!window.confirm("Remove the selected product image?")) return;
    setMainFileLabel("No file chosen");
    setMainImage(null);
    // if they remove the existing image (and don't upload new), tell backend to clear it
    setRemoveMainImage(true);
    if (mainInputRef.current) mainInputRef.current.value = "";
  };
  const clearVariantImage = (index: 0 | 1 | 2) => {
    if (!window.confirm(`Remove the selected variant image ${index + 1}?`)) return;
    setVariantLabels((prev) => {
      const next = [...prev] as [string, string, string];
      next[index] = "Keep current";
      return next;
    });
    setVariantPreviews((prev) => {
      const next = [...prev] as [string | null, string | null, string | null];
      next[index] = null;
      return next;
    });
    setRemoveVariants((prev) => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[index] = true;
      return next;
    });
    const ref = variantInputRefs.current[index];
    if (ref) ref.value = "";
  };

  const handleMainFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setMainFileLabel("No file chosen");
      setMainImage(null);
      return;
    }
    setMainFileLabel(file.name);
    setMainImage(await readFileAsDataUrl(file));
    setRemoveMainImage(false);
  };

  const handleVariantFile = async (index: 0 | 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setVariantLabels((prev) => {
      const next = [...prev] as [string, string, string];
      next[index] = file ? file.name : "Keep current";
      return next;
    });
    if (!file) {
      setVariantPreviews((prev) => {
        const next = [...prev] as [string | null, string | null, string | null];
        next[index] = product?.variantImageUrls[index] ?? null;
        return next;
      });
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setVariantPreviews((prev) => {
      const next = [...prev] as [string | null, string | null, string | null];
      next[index] = dataUrl;
      return next;
    });
    setRemoveVariants((prev) => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[index] = false;
      return next;
    });
  };

  const displayMain = mainImage ?? product?.imageUrl ?? "";

  const handleSubmit = async () => {
    if (!product) return;
    const trimmed = name.trim();
    const p = Number(price);
    if (!trimmed || !Number.isFinite(p) || p < 0) return;

    let ap: number | null = null;
    if (actualPrice.trim() !== "") {
      const n = Number(actualPrice);
      if (!Number.isFinite(n) || n < 0) return;
      ap = n;
    }

    const st = stock.trim() === "" ? 0 : Math.floor(Number(stock));
    if (!Number.isFinite(st) || st < 0) return;
    const minS = minStock.trim() === "" ? 0 : Math.floor(Number(minStock));
    if (!Number.isFinite(minS) || minS < 0) return;

    const variantImageDataUrls = [...variantPreviews].map((v) => {
      if (!v) return null;
      if (v.startsWith("data:")) return v;
      return null;
    }) as [string | null, string | null, string | null];

    setIsSaving(true);
    try {
      await onUpdate(product.id, {
        name: trimmed,
        description: description.trim(),
        specification: specification.trim(),
        price: p,
        actualPrice: ap,
        stock: st,
        minStock: minS,
        imageDataUrl: mainImage,
        variantImageDataUrls,
        removeMainImage,
        removeVariants,
      });
      onOpenChange(false);
    } catch {
      /* Parent shows toast; keep dialog open */
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-3xl p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-3xl max-h-[90vh] overflow-y-auto",
          "[&>button]:hidden",
        )}
      >
        <div className="rounded-xl border border-border/60 bg-card shadow-lg p-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-base font-semibold text-foreground">Edit product</h2>
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Back
            </button>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Product Details</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Product Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Selling Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Actual Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={actualPrice}
                  onChange={(e) => setActualPrice(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Stock</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Min stock (alert threshold)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Product Image (leave unchanged to keep current)</label>
              <input ref={mainInputRef} type="file" accept="image/*" onChange={(e) => void handleMainFile(e)} className="text-sm" />
              <p className="text-xs text-muted-foreground mt-1">{mainFileLabel}</p>
              {displayMain ? (
                <div className="relative mt-2 inline-block">
                  <img src={displayMain} alt="" className="h-20 w-20 rounded object-cover border border-border" />
                  {mainImage ? (
                    <button
                      type="button"
                      onClick={clearMainImage}
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted"
                      aria-label="Remove selected image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-2">Variant Images</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([0, 1, 2] as const).map((i) => (
                  <div key={i}>
                    <label className="block text-[11px] text-muted-foreground mb-1">Variant Image {i + 1}</label>
                    <input
                      ref={(el) => {
                        variantInputRefs.current[i] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleVariantFile(i, e)}
                      className="text-sm w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1 truncate">{variantLabels[i]}</p>
                    {variantPreviews[i] ? (
                      <div className="relative mt-2 inline-block">
                        <img
                          src={variantPreviews[i]!}
                          alt=""
                          className="h-16 w-full max-w-[120px] rounded object-cover border border-border"
                        />
                        {variantPreviews[i]?.startsWith("data:") ? (
                          <button
                            type="button"
                            onClick={() => clearVariantImage(i)}
                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted"
                            aria-label={`Remove selected variant ${i + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Product Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Product Specification</label>
                <textarea
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[100px]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving}
              className="w-full rounded-md bg-[#000533] text-white text-sm font-medium py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleProductEditDialog;
