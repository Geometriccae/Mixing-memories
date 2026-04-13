import { endOfMonth, format, parseISO, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns";
import type { OrderDoc } from "@/lib/orderApi";

export const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PIE_COLORS: Record<string, string> = {
  placed: "hsl(168 55% 42%)",
  shipped: "hsl(217 91% 55%)",
  completed: "hsl(142 55% 42%)",
  cancelled: "hsl(0 72% 52%)",
};

export type PieDatum = { key: string; name: string; value: number; color: string };

export type OrderStats = {
  counts: Record<string, number>;
  revenuePaid: number;
  revenuePending: number;
  pieData: PieDatum[];
  totalOrders: number;
  paidOrderCount: number;
};

export function formatInr(n: number): string {
  if (!Number.isFinite(n)) return "₹0";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

export type AppliedOrderRange = { allTime: true } | { allTime: false; from: string; to: string };

export function defaultDateRange(): { from: string; to: string } {
  const to = format(new Date(), "yyyy-MM-dd");
  const from = format(subDays(new Date(), 29), "yyyy-MM-dd");
  return { from, to };
}

export function resolvePreset(preset: "7d" | "30d" | "month" | "all"): {
  applied: AppliedOrderRange;
  draftFrom: string;
  draftTo: string;
} {
  if (preset === "all") {
    const d = defaultDateRange();
    return { applied: { allTime: true }, draftFrom: d.from, draftTo: d.to };
  }
  const now = new Date();
  if (preset === "7d") {
    const from = format(subDays(now, 6), "yyyy-MM-dd");
    const to = format(now, "yyyy-MM-dd");
    return { applied: { allTime: false, from, to }, draftFrom: from, draftTo: to };
  }
  if (preset === "30d") {
    const { from, to } = defaultDateRange();
    return { applied: { allTime: false, from, to }, draftFrom: from, draftTo: to };
  }
  const from = format(startOfMonth(now), "yyyy-MM-dd");
  const to = format(endOfMonth(now), "yyyy-MM-dd");
  return { applied: { allTime: false, from, to }, draftFrom: from, draftTo: to };
}

export function calendarMonthRanges(): { thisFrom: string; thisTo: string; prevFrom: string; prevTo: string } {
  const now = new Date();
  const thisFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const thisTo = format(endOfMonth(now), "yyyy-MM-dd");
  const prev = subMonths(now, 1);
  const prevFrom = format(startOfMonth(prev), "yyyy-MM-dd");
  const prevTo = format(endOfMonth(prev), "yyyy-MM-dd");
  return { thisFrom, thisTo, prevFrom, prevTo };
}

export function computeOrderStats(orders: OrderDoc[]): OrderStats {
  const counts: Record<string, number> = { placed: 0, shipped: 0, completed: 0, cancelled: 0 };
  let revenuePaid = 0;
  let revenuePending = 0;
  let paidOrderCount = 0;
  for (const o of orders) {
    const s = String(o.status || "").toLowerCase();
    if (s in counts) counts[s] += 1;
    const amt = Number(o.totalAmount) || 0;
    if (String(o.paymentStatus || "").toLowerCase() === "paid") {
      revenuePaid += amt;
      paidOrderCount += 1;
    } else revenuePending += amt;
  }
  const pieData = (Object.keys(counts) as (keyof typeof counts)[])
    .map((key) => ({
      key,
      name: STATUS_LABELS[key] || key,
      value: counts[key],
      color: PIE_COLORS[key] || "hsl(210 10% 60%)",
    }))
    .filter((d) => d.value > 0);
  return { counts, revenuePaid, revenuePending, pieData, totalOrders: orders.length, paidOrderCount };
}

/** Bar chart: daily buckets, or weekly if too many days */
export function buildOrdersHistogram(orders: OrderDoc[]): { label: string; orders: number }[] {
  if (orders.length === 0) return [];
  const dayMap = new Map<string, number>();
  for (const o of orders) {
    if (!o.createdAt) continue;
    const key = format(new Date(o.createdAt), "yyyy-MM-dd");
    dayMap.set(key, (dayMap.get(key) || 0) + 1);
  }
  const sortedDays = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (sortedDays.length <= 36) {
    return sortedDays.map(([day, count]) => ({
      label: format(parseISO(day), "MMM d"),
      orders: count,
    }));
  }
  const weekMap = new Map<number, { label: string; orders: number }>();
  for (const [day, c] of sortedDays) {
    const ws = startOfWeek(parseISO(day), { weekStartsOn: 1 });
    const t = ws.getTime();
    const prev = weekMap.get(t);
    weekMap.set(t, {
      label: format(ws, "MMM d"),
      orders: (prev?.orders || 0) + c,
    });
  }
  return [...weekMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}
