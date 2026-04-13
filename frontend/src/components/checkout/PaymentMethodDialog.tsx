import { Dialog, DialogContent } from "@/components/ui/dialog";

export type PaymentMethod = "upi" | "netbanking" | "card";

const METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  {
    id: "upi",
    label: "UPI",
    hint: "Best on your phone’s browser (opens GPay/PhonePe). On a PC, Razorpay may show a QR or a UPI ID box.",
  },
  { id: "netbanking", label: "Net banking", hint: "Pay from your bank" },
  { id: "card", label: "Card", hint: "Debit or credit card" },
];

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
            <p className="text-sm text-muted-foreground mt-1">
              Razorpay opens the actual payment screen. Which options you see depends on test vs live mode and your device.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange(m.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  value === m.id ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="block text-sm font-medium text-foreground">{m.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{m.hint}</span>
              </button>
            ))}
          </div>

          {value === "card" ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              In Razorpay&apos;s card screen you can enter a new card or pick another saved card. If you see only one saved
              card, look for an option such as &quot;Change&quot; or &quot;Use another card&quot; (wording depends on Razorpay).
            </p>
          ) : null}

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
