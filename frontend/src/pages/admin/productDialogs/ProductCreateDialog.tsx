import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminSubcategoryRow } from "@/pages/admin/subcategoryDialogs/subcategoryTypes";
import {
  ADMIN_PRODUCT_MANUFACTURERS,
  ADMIN_PRODUCT_QUALITIES,
  subcategoryNamesForCategory,
  type AdminProductRow,
} from "./productTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: string[];
  subcategories: AdminSubcategoryRow[];
  fallbackMainImage: string;
  onCreate: (data: Omit<AdminProductRow, "id">) => void;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const ProductCreateDialog = ({
  open,
  onOpenChange,
  categoryOptions,
  subcategories,
  fallbackMainImage,
  onCreate,
}: Props) => {
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [manufacturer, setManufacturer] = useState<string>(ADMIN_PRODUCT_MANUFACTURERS[0]);
  const [quality, setQuality] = useState<string>(ADMIN_PRODUCT_QUALITIES[0]);
  const [sellingPrice, setSellingPrice] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState("");
  const [mainFileLabel, setMainFileLabel] = useState("No file chosen");
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [varLabels, setVarLabels] = useState<[string, string, string]>([
    "No file chosen",
    "No file chosen",
    "No file chosen",
  ]);
  const [variantImages, setVariantImages] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);

  const subOptions = useMemo(
    () => subcategoryNamesForCategory(subcategories, categoryName),
    [subcategories, categoryName],
  );

  useEffect(() => {
    if (!open) {
      setName("");
      setCategoryName("");
      setSubCategoryName("");
      setManufacturer(ADMIN_PRODUCT_MANUFACTURERS[0]);
      setQuality(ADMIN_PRODUCT_QUALITIES[0]);
      setSellingPrice("");
      setActualPrice("");
      setStock("");
      setDescription("");
      setSpecification("");
      setMainFileLabel("No file chosen");
      setMainImage(null);
      setVarLabels(["No file chosen", "No file chosen", "No file chosen"]);
      setVariantImages([null, null, null]);
      return;
    }
    if (categoryOptions.length > 0) {
      const cat = categoryOptions[categoryOptions.length - 1];
      setCategoryName(cat);
    }
  }, [open, categoryOptions]);

  useEffect(() => {
    if (!open) return;
    if (categoryName && subOptions.length > 0) {
      setSubCategoryName((prev) => (prev && subOptions.includes(prev) ? prev : subOptions[subOptions.length - 1]));
    } else {
      setSubCategoryName("");
    }
  }, [open, categoryName, subOptions]);

  const handleBack = () => onOpenChange(false);

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
    if (!file) {
      setVarLabels((l) => {
        const next = [...l] as [string, string, string];
        next[index] = "No file chosen";
        return next;
      });
      setVariantImages((v) => {
        const next: [string | null, string | null, string | null] = [...v];
        next[index] = null;
        return next;
      });
      return;
    }
    setVarLabels((l) => {
      const next = [...l] as [string, string, string];
      next[index] = file.name;
      return next;
    });
    const url = await readFileAsDataUrl(file);
    setVariantImages((v) => {
      const next: [string | null, string | null, string | null] = [...v];
      next[index] = url;
      return next;
    });
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed || !categoryName || !subCategoryName || categoryOptions.length === 0) return;
    const sell = Number(sellingPrice);
    const actual = Number(actualPrice);
    const stk = Number(stock);
    if (!Number.isFinite(sell) || !Number.isFinite(actual) || !Number.isFinite(stk)) return;

    const main = mainImage ?? fallbackMainImage;
    const v0 = variantImages[0] ?? main;
    const v1 = variantImages[1] ?? main;
    const v2 = variantImages[2] ?? main;

    onCreate({
      category: categoryName,
      subCategory: subCategoryName,
      name: trimmed,
      image: main,
      variantImages: [v0, v1, v2],
      stock: stk,
      price: sell,
      actualPrice: actual,
      manufacturer,
      quality,
      description: description.trim(),
      specification: specification.trim(),
    });
    onOpenChange(false);
  };

  const labelCls = "block text-xs text-[#95A5A6] mb-1.5";
  const fieldCls =
    "w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-[#95A5A6] bg-background outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-5xl p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-5xl",
          "[&>button]:hidden",
        )}
      >
        <div className="rounded-xl overflow-hidden border border-border/60 bg-card shadow-lg max-h-[90vh] flex flex-col">
          <div tabIndex={-1} className="bg-card p-5 md:p-6 overflow-y-auto">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-foreground">New Products</h2>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Back
              </button>
            </div>

            <div className="pt-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelCls}>Product Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Type Name"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Select Category</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    disabled={categoryOptions.length === 0}
                    className={`${fieldCls} disabled:opacity-50`}
                  >
                    {categoryOptions.length === 0 ? (
                      <option value="">Add a category first</option>
                    ) : (
                      categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Select Sub Category</label>
                  <select
                    value={subCategoryName}
                    onChange={(e) => setSubCategoryName(e.target.value)}
                    disabled={subOptions.length === 0}
                    className={`${fieldCls} disabled:opacity-50`}
                  >
                    {subOptions.length === 0 ? (
                      <option value="">No sub categories</option>
                    ) : (
                      subOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Manufacturer</label>
                  <select
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className={fieldCls}
                  >
                    {ADMIN_PRODUCT_MANUFACTURERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Quality</label>
                  <select value={quality} onChange={(e) => setQuality(e.target.value)} className={fieldCls}>
                    {ADMIN_PRODUCT_QUALITIES.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Selling Price</label>
                  <input
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="Type Price"
                    type="number"
                    min={0}
                    step="any"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Actual Price</label>
                  <input
                    value={actualPrice}
                    onChange={(e) => setActualPrice(e.target.value)}
                    placeholder="Type Price"
                    type="number"
                    min={0}
                    step="any"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Stock</label>
                  <input
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="Type Stock"
                    type="number"
                    min={0}
                    step="1"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Product Image</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="rounded-md border border-border px-3 py-2 text-xs font-medium bg-muted/50 hover:bg-muted">
                      Choose File
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{mainFileLabel}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleMainFile} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {([0, 1, 2] as const).map((i) => (
                  <div key={i}>
                    <label className={labelCls}>Varient Image</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="rounded-md border border-border px-3 py-2 text-xs font-medium bg-muted/50 hover:bg-muted">
                        Choose File
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{varLabels[i]}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleVariantFile(i, e)}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className={labelCls}>Product Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={`${fieldCls} min-h-[120px] resize-y`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Product Specification</label>
                  <textarea
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    rows={5}
                    className={`${fieldCls} min-h-[120px] resize-y`}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-md bg-[#2ECC71] text-white text-sm font-semibold px-6 py-2.5 hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCreateDialog;
