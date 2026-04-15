import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, IndianRupee, Package, ShoppingCart, User } from "lucide-react";
import { toast } from "sonner";
import OrderAnalyticsDateFilter from "@/components/admin/OrderAnalyticsDateFilter";
import OrderStatusDonut from "@/components/admin/OrderStatusDonut";
import OrdersTrendBarChart from "@/components/admin/OrdersTrendBarChart";
import {
  buildOrdersHistogram,
  computeOrderStats,
  defaultDateRange,
  formatInr,
  resolvePreset,
  STATUS_LABELS,
  type AppliedOrderRange,
} from "@/lib/adminOrderAnalytics";
import { fetchAdminOrders, type OrderDoc } from "@/lib/orderApi";

const cardBase =
  "bg-card rounded-[10px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.06)] border border-border/40 p-5";

const iconWrap = "h-11 w-11 rounded-lg bg-[hsl(210_90%_94%)] flex items-center justify-center shrink-0";

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconClassName = "h-5 w-5 text-[hsl(222_60%_28%)]",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
}) => (
  <div className={cardBase}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(222_60%_26%)]">{value}</p>
      </div>
      <div className={iconWrap}>
        <Icon className={iconClassName} />
      </div>
    </div>
  </div>
);

const apiUsers = () => `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/users`;

const AdminOrdersOverview = () => {
  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);
  const initial = useMemo(() => defaultDateRange(), []);
  const [applied, setApplied] = useState<AppliedOrderRange>(() => ({ allTime: false, ...initial }));
  const [draftFrom, setDraftFrom] = useState(initial.from);
  const [draftTo, setDraftTo] = useState(initial.to);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const filters = applied.allTime === true ? {} : { from: applied.from, to: applied.to };
      const [list, usersRes] = await Promise.all([
        fetchAdminOrders(token, filters),
        fetch(apiUsers(), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setOrders(list);
      const uj: unknown = await usersRes.json().catch(() => ({}));
      if (usersRes.ok && uj && typeof uj === "object" && "data" in uj && Array.isArray((uj as { data: unknown }).data)) {
        const rows = (uj as { data: { role?: string }[] }).data;
        setCustomerCount(rows.filter((r) => String(r.role || "").toLowerCase() !== "admin").length);
      } else {
        setCustomerCount(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders overview.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => computeOrderStats(orders), [orders]);
  const barData = useMemo(() => buildOrdersHistogram(orders), [orders]);

  const applyPreset = (preset: "7d" | "30d" | "month" | "all") => {
    const { applied: next, draftFrom: df, draftTo: dt } = resolvePreset(preset);
    setApplied(next);
    setDraftFrom(df);
    setDraftTo(dt);
  };

  if (!token) {
    return <p className="text-sm text-muted-foreground">Admin session missing. Please log in.</p>;
  }

  return (
    <div className="space-y-6">
      <OrderAnalyticsDateFilter
        draftFrom={draftFrom}
        draftTo={draftTo}
        onDraftFrom={setDraftFrom}
        onDraftTo={setDraftTo}
        applied={applied}
        loading={loading}
        onPreset={applyPreset}
        onApplyCustom={() => setApplied({ allTime: false, from: draftFrom, to: draftTo })}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Loading overview…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Orders in range" value={String(stats.totalOrders)} icon={ShoppingCart} />
            <StatCard title="Paid revenue" value={formatInr(stats.revenuePaid)} icon={IndianRupee} />
            <StatCard title="Unpaid / pending" value={formatInr(stats.revenuePending)} icon={Package} />
            <StatCard title="Customers" value={customerCount != null ? String(customerCount) : "—"} icon={User} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className={`${cardBase} lg:col-span-2`}>
              <h3 className="font-display text-base font-semibold text-foreground mb-4">By status</h3>
              <p className="text-xs text-muted-foreground mb-4">Counts for the selected range — open a list to manage.</p>
              <div className="grid grid-cols-2 gap-3">
                {(["placed", "shipped", "completed", "cancelled"] as const).map((key) => (
                  <Link
                    key={key}
                    to={
                      key === "placed"
                        ? "/admin/orders/placed"
                        : key === "shipped"
                          ? "/admin/orders/shipped"
                          : key === "completed"
                            ? "/admin/orders/completed"
                            : "/admin/orders/cancelled"
                    }
                    className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{STATUS_LABELS[key]}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.counts[key]}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className={`${cardBase} lg:col-span-3 min-h-[320px]`}>
              <OrderStatusDonut data={stats.pieData} title="Order mix" subtitle="Donut chart by fulfilment status" />
            </div>
          </div>

          <div className={`${cardBase} min-h-[320px]`}>
            <OrdersTrendBarChart
              data={barData}
              title="Orders over time"
              subtitle={applied.allTime ? "Daily or weekly buckets when the history is long" : "Orders per day or week in range"}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrdersOverview;
