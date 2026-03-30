import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminSubcategoryRow } from "./subcategoryTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcategory: AdminSubcategoryRow | null;
};

const SubCategoryViewDialog = ({ open, onOpenChange, subcategory }: Props) => {
  const handleBack = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-xl p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-lg",
          "[&>button]:hidden",
        )}
      >
        <div className="rounded-xl overflow-hidden border border-border/60 bg-card shadow-lg">
          <div className="bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <h2 className="text-base font-medium text-[hsl(222_60%_26%)]">View Sub Category</h2>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Back
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-muted/50 border border-border/40 p-4 md:p-6">
              {subcategory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm font-bold text-[hsl(222_60%_26%)] mb-1">Category :</p>
                    <p className="text-base font-bold text-[hsl(222_60%_22%)]">{subcategory.categoryName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[hsl(222_60%_26%)] mb-1">Sub Category :</p>
                    <p className="text-base font-bold text-[hsl(222_60%_22%)]">{subcategory.subName}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubCategoryViewDialog;
