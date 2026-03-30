import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminCategoryRow } from "./categoryTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminCategoryRow | null;
  onUpdate: (id: number, data: { name: string; image: string }) => void;
};

const CategoryEditDialog = ({ open, onOpenChange, category, onUpdate }: Props) => {
  const [name, setName] = useState("");
  const [fileLabel, setFileLabel] = useState("No file chosen");
  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => {
    if (category && open) {
      setName(category.name);
      setFileLabel("No file chosen");
      setNewImage(null);
    }
  }, [category, open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileLabel("No file chosen");
      setNewImage(null);
      return;
    }
    setFileLabel(file.name);
    const reader = new FileReader();
    reader.onload = () => setNewImage(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleBack = () => onOpenChange(false);

  const handleUpdate = () => {
    if (!category) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const image = newImage ?? category.image;
    onUpdate(category.id, { name: trimmed, image });
    onOpenChange(false);
  };

  const previewImage = newImage ?? category?.image ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-3xl p-0 gap-0 border-0 bg-transparent shadow-none",
          "[&>button]:hidden",
        )}
      >
        <div className="rounded-xl overflow-hidden border border-border/60 bg-card shadow-lg">
          <div className="bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Edit Category Details</h2>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Back
              </button>
            </div>

            <div className="pt-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Category Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Category Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Category Image</label>
                  <label className="flex items-center w-full rounded-md border border-border bg-background overflow-hidden cursor-pointer">
                    <span className="shrink-0 bg-sky-100/80 text-sky-900 text-xs font-medium px-3 py-2.5 border-r border-border">
                      Choose File
                    </span>
                    <span className="flex-1 px-3 py-2.5 text-sm text-muted-foreground truncate">{fileLabel}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Current Image</label>
                  <div className="rounded-md border border-border bg-muted/30 p-2 flex items-center justify-center min-h-[100px]">
                    {previewImage ? (
                      <img src={previewImage} alt="Current" className="max-h-24 max-w-full rounded object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No image</span>
                    )}
                  </div>
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

export default CategoryEditDialog;
