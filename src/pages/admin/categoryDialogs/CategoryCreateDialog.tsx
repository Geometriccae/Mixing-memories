import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const navyBar = "bg-[#000533] text-white";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; image: string }) => void;
};

const CategoryCreateDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [fileLabel, setFileLabel] = useState("No file chosen");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setFileLabel("No file chosen");
      setImageDataUrl(null);
    }
  }, [open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileLabel("No file chosen");
      setImageDataUrl(null);
      return;
    }
    setFileLabel(file.name);
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleBack = () => onOpenChange(false);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, image: imageDataUrl ?? "" });
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
          <div className={cn(navyBar, "px-4 py-3 flex items-center justify-between gap-3")}>
            <span className="font-bold text-base">Category</span>
            <span className="text-sm text-white/90 whitespace-nowrap">
              Category &gt; <strong className="font-semibold">Create</strong>
            </span>
          </div>

          <div className="bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">New Category</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Category Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Type Name"
                    className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-[#95A5A6] bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#95A5A6] mb-1.5">Category Image</label>
                  <label className="flex items-center w-full rounded-md border border-border bg-background overflow-hidden cursor-pointer">
                    <span className="shrink-0 bg-sky-100/80 text-sky-900 text-xs font-medium px-3 py-2.5 border-r border-border">
                      Choose File
                    </span>
                    <span className="flex-1 px-3 py-2.5 text-sm text-muted-foreground truncate">
                      {fileLabel}
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                  </label>
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

export default CategoryCreateDialog;
