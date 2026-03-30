import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminCategoryRow } from "./categoryTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminCategoryRow | null;
};

const CategoryViewDialog = ({ open, onOpenChange, category }: Props) => {
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
              <h2 className="text-base font-medium text-[hsl(222_60%_26%)]">View Category</h2>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Back
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-muted/50 border border-border/40 p-4 md:p-5">
              {category ? (
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  <div>
                    <p className="text-lg md:text-xl font-bold text-[hsl(222_60%_26%)]">
                      Category : {category.name}
                    </p>
                  </div>
                  <div className="sm:text-right min-w-[140px]">
                    <p className="text-sm text-muted-foreground mb-2">Category Image</p>
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-24 w-24 sm:ml-auto rounded-md object-cover border border-border bg-background"
                    />
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

export default CategoryViewDialog;
