import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: string[];
  onCreate: (data: { subName: string; categoryName: string }) => void;
};

const SubCategoryCreateDialog = ({ open, onOpenChange, categoryOptions, onCreate }: Props) => {
  const [subName, setSubName] = useState("");
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!open) {
      setSubName("");
      setCategoryName("");
      return;
    }
    if (categoryOptions.length > 0) {
      setCategoryName(categoryOptions[categoryOptions.length - 1]);
    }
  }, [open, categoryOptions]);

  const handleBack = () => onOpenChange(false);

  const handleCreate = () => {
    const trimmed = subName.trim();
    if (!trimmed || !categoryName || categoryOptions.length === 0) return;
    onCreate({ subName: trimmed, categoryName });
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
              <h2 className="text-base font-semibold text-foreground">New Sub Category</h2>
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
                    placeholder="Type Name"
                    className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-[#95A5A6] bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Select Category</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    disabled={categoryOptions.length === 0}
                    className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  >
                    {categoryOptions.length === 0 ? (
                      <option value="">Add a category first</option>
                    ) : (
                      categoryOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))
                    )}
                  </select>
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

export default SubCategoryCreateDialog;
