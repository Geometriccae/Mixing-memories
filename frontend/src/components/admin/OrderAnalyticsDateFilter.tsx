import { CalendarRange, RefreshCw } from "lucide-react";
import type { AppliedOrderRange } from "@/lib/adminOrderAnalytics";

const cardBase =
  "bg-card rounded-[10px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.06)] border border-border/40 p-5";

type Props = {
  draftFrom: string;
  draftTo: string;
  onDraftFrom: (v: string) => void;
  onDraftTo: (v: string) => void;
  applied: AppliedOrderRange;
  loading: boolean;
  onPreset: (preset: "7d" | "30d" | "month" | "all") => void;
  onApplyCustom: () => void;
  description?: string;
};

const OrderAnalyticsDateFilter = ({
  draftFrom,
  draftTo,
  onDraftFrom,
  onDraftTo,
  applied,
  loading,
  onPreset,
  onApplyCustom,
  description = "Totals and charts below follow orders whose created date falls in the range (inclusive).",
}: Props) => (
  <div className={cardBase}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary shrink-0" />
          Date filter
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPreset("7d")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted/80"
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => onPreset("30d")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted/80"
        >
          Last 30 days
        </button>
        <button
          type="button"
          onClick={() => onPreset("month")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted/80"
        >
          This month
        </button>
        <button
          type="button"
          onClick={() => onPreset("all")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted/80"
        >
          All time
        </button>
      </div>
    </div>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        From
        <input
          type="date"
          value={draftFrom}
          onChange={(e) => onDraftFrom(e.target.value)}
          disabled={applied.allTime}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        To
        <input
          type="date"
          value={draftTo}
          onChange={(e) => onDraftTo(e.target.value)}
          disabled={applied.allTime}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
        />
      </label>
      <button
        type="button"
        disabled={loading || applied.allTime}
        onClick={onApplyCustom}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 sm:mb-0.5"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Apply range
      </button>
    </div>
    {applied.allTime ? (
      <p className="mt-3 text-xs text-muted-foreground">
        Active: <span className="font-medium text-foreground">all orders</span> (no date filter).
      </p>
    ) : (
      <p className="mt-3 text-xs text-muted-foreground">
        Active: <span className="font-mono text-foreground">{applied.from}</span> →{" "}
        <span className="font-mono text-foreground">{applied.to}</span>
      </p>
    )}
  </div>
);

export default OrderAnalyticsDateFilter;
