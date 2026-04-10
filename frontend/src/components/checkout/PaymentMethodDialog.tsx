import { Dialog, DialogContent } from "@/components/ui/dialog";

export type PaymentMethod = "cod" | "upi" | "online";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  title?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  confirming?: boolean;
};

const PaymentMethodDialog = ({
  open,
  onOpenChange,
  value,
  onChange,
  title = "Select payment method",
  confirmLabel = "Continue",
  onConfirm,
  confirming = false,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">Choose how you want to pay for this order.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: "cod" as const, label: "COD" },
              { id: "upi" as const, label: "UPI" },
              { id: "online" as const, label: "Online" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange(m.id)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  value === m.id ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
            >
              {confirming ? "Processing…" : confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;

