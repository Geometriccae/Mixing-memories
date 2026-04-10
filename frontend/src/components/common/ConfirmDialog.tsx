import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
};

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  onConfirm,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-foreground">{title}</p>
            {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted/50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium hover:opacity-90 disabled:opacity-50"
            >
              {confirming ? "Please wait…" : confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;

