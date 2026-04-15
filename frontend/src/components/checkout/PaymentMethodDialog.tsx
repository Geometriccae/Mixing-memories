import { Building2, CreditCard, Smartphone } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type PaymentMethod = "upi" | "netbanking" | "card";

const METHODS: {
  id: PaymentMethod;
  label: string;
  hint: string;
  Icon: typeof Smartphone;
}[] = [
  {
    id: "upi",
    label: "UPI",
    hint: "Google Pay, PhonePe, or any UPI app",
    Icon: Smartphone,
  },
  { id: "netbanking", label: "Net banking", hint: "Pay from your bank account", Icon: Building2 },
  { id: "card", label: "Card", hint: "Debit or credit card", Icon: CreditCard },
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
              Razorpay opens the secure payment window. Available options depend on your device and Razorpay mode.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {METHODS.map((m) => {
              const Icon = m.Icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChange(m.id)}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    value === m.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                      value === m.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted/50 text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{m.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{m.hint}</span>
                  </span>
                </button>
              );
            })}
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
