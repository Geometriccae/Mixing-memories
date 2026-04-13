import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { IndianRupee, Package, ShoppingCart, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";
import OrderAnalyticsDateFilter from "@/components/admin/OrderAnalyticsDateFilter";
import OrderStatusDonut from "@/components/admin/OrderStatusDonut";
import OrdersTrendBarChart from "@/components/admin/OrdersTrendBarChart";
import {
  buildOrdersHistogram,
  calendarMonthRanges,
  computeOrderStats,
  defaultDateRange,
  formatInr,
  resolvePreset,
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

const AdminDashboard = () => {
  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);
  const initial = useMemo(() => defaultDateRange(), []);
  const [applied, setApplied] = useState<AppliedOrderRange>(() => ({ allTime: false, ...initial }));
  const [draftFrom, setDraftFrom] = useState(initial.from);
  const [draftTo, setDraftTo] = useState(initial.to);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthThis, setMonthThis] = useState<OrderDoc[]>([]);
  const [monthPrev, setMonthPrev] = useState<OrderDoc[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(true);

  const loadMain = useCallback(async () => {
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
      toast.error(e instanceof Error ? e.message : "Failed to load dashboard.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, applied]);

  useEffect(() => {
    void loadMain();
  }, [loadMain]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setLoadingMonths(true);
      try {
        const { thisFrom, thisTo, prevFrom, prevTo } = calendarMonthRanges();
        const [t, p] = await Promise.all([
          fetchAdminOrders(token, { from: thisFrom, to: thisTo }),
          fetchAdminOrders(token, { from: prevFrom, to: prevTo }),
        ]);
        if (!cancelled) {
          setMonthThis(t);
          setMonthPrev(p);
        }
      } catch {
        if (!cancelled) {
          setMonthThis([]);
          setMonthPrev([]);
        }
      } finally {
        if (!cancelled) setLoadingMonths(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const stats = useMemo(() => computeOrderStats(orders), [orders]);
  const barData = useMemo(() => buildOrdersHistogram(orders), [orders]);
  const snapThis = useMemo(() => computeOrderStats(monthThis), [monthThis]);
  const snapPrev = useMemo(() => computeOrderStats(monthPrev), [monthPrev]);

  const avgPaid =
    stats.paidOrderCount > 0 ? formatInr(stats.revenuePaid / stats.paidOrderCount) : "—";

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
        description="KPIs and charts use order created date in range. Calendar month cards below always use this month vs last month."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Orders (filtered)" value={String(stats.totalOrders)} icon={ShoppingCart} />
            <StatCard title="Paid revenue (filtered)" value={formatInr(stats.revenuePaid)} icon={IndianRupee} />
            <StatCard title="Unpaid / pending (filtered)" value={formatInr(stats.revenuePending)} icon={Package} />
            <StatCard title="Customers (all)" value={customerCount != null ? String(customerCount) : "—"} icon={User} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Avg. paid order (filtered)" value={avgPaid} icon={TrendingUp} />
            <StatCard title="Paid orders (filtered)" value={String(stats.paidOrderCount)} icon={ShoppingCart} />
            <StatCard
              title="This month — paid ₹"
              value={loadingMonths ? "…" : formatInr(snapThis.revenuePaid)}
              icon={IndianRupee}
            />
            <StatCard
              title="Last month — paid ₹"
              value={loadingMonths ? "…" : formatInr(snapPrev.revenuePaid)}
              icon={IndianRupee}
            />
            <StatCard
              title="This month — orders"
              value={loadingMonths ? "…" : String(snapThis.totalOrders)}
              icon={ShoppingCart}
            />
            <StatCard
              title="Last month — orders"
              value={loadingMonths ? "…" : String(snapPrev.totalOrders)}
              icon={ShoppingCart}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardBase} min-h-[320px]`}>
              <OrderStatusDonut
                data={stats.pieData}
                title="Status mix (filtered)"
                subtitle="Share by fulfilment status"
              />
            </div>
            <div className={`${cardBase} min-h-[320px]`}>
              <OrdersTrendBarChart
                data={barData}
                title="Volume trend (filtered)"
                subtitle={
                  applied.allTime
                    ? "Grouped by week when the range has many days"
                    : "Orders per day or week in range"
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
