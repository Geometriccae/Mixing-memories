import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminSubcategoryRow } from "./subcategoryTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: string[];
  subcategory: AdminSubcategoryRow | null;
  onUpdate: (id: number, data: { subName: string; categoryName: string }) => void;
};

const SubCategoryEditDialog = ({ open, onOpenChange, categoryOptions, subcategory, onUpdate }: Props) => {
  const [subName, setSubName] = useState("");
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (subcategory && open) {
      setSubName(subcategory.subName);
      setCategoryName(subcategory.categoryName);
    }
  }, [subcategory, open]);

  useEffect(() => {
    if (open && categoryOptions.length > 0 && categoryName && !categoryOptions.includes(categoryName)) {
      setCategoryName(categoryOptions[0]);
    }
  }, [open, categoryOptions, categoryName]);

  const handleBack = () => onOpenChange(false);

  const handleUpdate = () => {
    if (!subcategory) return;
    const trimmed = subName.trim();
    if (!trimmed || !categoryName) return;
    onUpdate(subcategory.id, { subName: trimmed, categoryName });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-xl p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-xl",
          "[&>button]:hidden",
        )}
      >
        <div className="rounded-xl overflow-hidden border border-border/60 bg-card shadow-lg">
          <div className="bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Edit Sub Category Details</h2>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Back
              </button>
            </div>

            <div className="pt-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Sub Category Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Sub Category Name</label>
                  <input
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Select Category</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {categoryOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="rounded-md bg-[#20c997] text-white text-sm font-semibold px-6 py-2.5 hover:opacity-90 transition-opacity"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubCategoryEditDialog;
