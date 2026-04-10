import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export type CreateProductPayload = {
  name: string;
  description: string;
  specification: string;
  /** Selling price */
  price: number;
  actualPrice: number | null;
  stock: number;
  minStock: number;
  imageDataUrl: string;
  variantImageDataUrls: [string | null, string | null, string | null];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateProductPayload) => Promise<void>;
};

const SimpleProductCreateDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState("");
  const [price, setPrice] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [mainFileLabel, setMainFileLabel] = useState("No file chosen");
  const [mainImage, setMainImage] = useState<string | null>(null);
  const mainInputRef = useRef<HTMLInputElement | null>(null);
  const variantInputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null]);
  const [variantLabels, setVariantLabels] = useState<[string, string, string]>(["No file", "No file", "No file"]);
  const [variantPreviews, setVariantPreviews] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setSpecification("");
      setPrice("");
      setActualPrice("");
      setStock("");
      setMinStock("");
      setMainFileLabel("No file chosen");
      setMainImage(null);
      setVariantLabels(["No file", "No file", "No file"]);
      setVariantPreviews([null, null, null]);
      setIsSaving(false);
    }
  }, [open]);

  const handleBack = () => onOpenChange(false);
  const clearMainImage = () => {
    setMainFileLabel("No file chosen");
    setMainImage(null);
    if (mainInputRef.current) mainInputRef.current.value = "";
  };
  const clearVariantImage = (index: 0 | 1 | 2) => {
    setVariantLabels((prev) => {
      const next = [...prev] as [string, string, string];
      next[index] = "No file";
      return next;
    });
    setVariantPreviews((prev) => {
      const next = [...prev] as [string | null, string | null, string | null];
      next[index] = null;
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
  };

  const handleVariantFile = async (index: 0 | 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setVariantLabels((prev) => {
      const next = [...prev] as [string, string, string];
      next[index] = file ? file.name : "No file";
      return next;
    });
    if (!file) {
      setVariantPreviews((prev) => {
        const next = [...prev] as [string | null, string | null, string | null];
        next[index] = null;
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
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    const p = Number(price);
    if (!trimmed || !Number.isFinite(p) || p < 0) return;
    if (!mainImage) return;

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

    setIsSaving(true);
    try {
      await onCreate({
        name: trimmed,
        description: description.trim(),
        specification: specification.trim(),
        price: p,
        actualPrice: ap,
        stock: st,
        minStock: minS,
        imageDataUrl: mainImage,
        variantImageDataUrls: [...variantPreviews],
      });
      onOpenChange(false);
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
            <h2 className="text-base font-semibold text-foreground">New Products</h2>
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
                  placeholder="Type Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Selling Price (₹)</label>
                <input
                  placeholder="Type Price"
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
                  placeholder="Type Price"
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
                  placeholder="Type Stock"
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
                  placeholder="e.g. 30"
                  type="number"
                  min={0}
                  step={1}
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Table turns red when stock ≤ this value.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Product Image</label>
                <input ref={mainInputRef} type="file" accept="image/*" onChange={(e) => void handleMainFile(e)} className="text-sm" />
                <p className="text-xs text-muted-foreground mt-1">{mainFileLabel}</p>
                {mainImage ? (
                  <div className="relative mt-2 inline-block">
                    <img src={mainImage} alt="" className="h-20 w-20 rounded object-cover border border-border" />
                    <button
                      type="button"
                      onClick={clearMainImage}
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
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
                        <button
                          type="button"
                          onClick={() => clearVariantImage(i)}
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted"
                          aria-label={`Remove variant ${i + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
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
              {isSaving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleProductCreateDialog;
