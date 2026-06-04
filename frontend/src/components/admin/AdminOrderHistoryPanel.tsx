import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  CalendarRange,
  Inbox,
  Info,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AppliedOrderRange } from "@/lib/adminOrderAnalytics";
import { formatInr } from "@/lib/adminOrderAnalytics";
import {
  fetchBinOrders,
  moveOrdersToBinByRange,
  permanentDeleteBinOrder,
  restoreOrderFromBin,
  type OrderDoc,
} from "@/lib/orderApi";

const cardBase =
  "bg-card rounded-[10px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.06)] border border-border/40";

function formatOrderDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function paymentBadgeVariant(ps?: string): "default" | "secondary" | "destructive" | "outline" {
  const p = String(ps || "").toLowerCase();
  if (p === "paid") return "default";
  if (p === "failed") return "destructive";
  return "secondary";
}

const StepPill = ({ n, label, active }: { n: number; label: string; active?: boolean }) => (
  <div
    className={cn(
      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
      active ? "border-primary/40 bg-primary/10 text-foreground" : "border-border bg-muted/40 text-muted-foreground",
    )}
  >
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
        active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground",
      )}
    >
      {n}
    </span>
    {label}
  </div>
);

type Props = {
  token: string;
  applied: AppliedOrderRange;
  orderCountInRange: number;
  onHistoryChanged: () => void;
};

const AdminOrderHistoryPanel = ({ token, applied, orderCountInRange, onHistoryChanged }: Props) => {
  const [binOrders, setBinOrders] = useState<OrderDoc[]>([]);
  const [binLoading, setBinLoading] = useState(true);
  const [binSearch, setBinSearch] = useState("");
  const [activeTab, setActiveTab] = useState("move");
  const [moveOpen, setMoveOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<OrderDoc | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [permanentTarget, setPermanentTarget] = useState<OrderDoc | null>(null);
  const [permanentDeleting, setPermanentDeleting] = useState(false);

  const loadBin = useCallback(async () => {
    if (!token) return;
    setBinLoading(true);
    try {
      const list = await fetchBinOrders(token);
      setBinOrders(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load bin.");
      setBinOrders([]);
    } finally {
      setBinLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadBin();
  }, [loadBin]);

  const rangeLabel = applied.allTime ? "All time" : `${applied.from} → ${applied.to}`;

  const filteredBin = useMemo(() => {
    const q = binSearch.trim().toLowerCase();
    if (!q) return binOrders;
    return binOrders.filter((o) => {
      const id = (o.orderNumber || o._id).toLowerCase();
      const name = (o.customerName || "").toLowerCase();
      const email = (o.email || "").toLowerCase();
      return id.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [binOrders, binSearch]);

  const canMove = applied.allTime || orderCountInRange > 0;

  const confirmMoveToBin = async () => {
    if (!token) return;
    setMoving(true);
    try {
      const moved = await moveOrdersToBinByRange(
        token,
        applied.allTime ? { allTime: true } : { from: applied.from, to: applied.to },
      );
      setMoveOpen(false);
      toast.success(moved > 0 ? `Moved ${moved} order(s) to bin.` : "No orders in that range to move.");
      setActiveTab("bin");
      await loadBin();
      onHistoryChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to move to bin.");
    } finally {
      setMoving(false);
    }
  };

  const confirmRestore = async () => {
    if (!token || !restoreTarget) return;
    setRestoring(true);
    try {
      await restoreOrderFromBin(token, restoreTarget._id);
      setRestoreTarget(null);
      toast.success("Order restored — it will show on the dashboard again.");
      await loadBin();
      onHistoryChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore.");
    } finally {
      setRestoring(false);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!token || !permanentTarget) return;
    setPermanentDeleting(true);
    try {
      await permanentDeleteBinOrder(token, permanentTarget._id);
      setPermanentTarget(null);
      toast.success("Order permanently deleted.");
      await loadBin();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete permanently.");
    } finally {
      setPermanentDeleting(false);
    }
  };

  return (
    <div className={cn(cardBase, "overflow-hidden")}>
      <div className="p-5 md:p-6 border-b border-border/50 bg-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary shrink-0" />
              Order history &amp; recycle bin
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Hide old orders from reports without losing data. Restore anytime, or delete forever from the bin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StepPill n={1} label="Move to bin" active={activeTab === "move"} />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 hidden sm:block" aria-hidden />
            <StepPill n={2} label="Restore" active={activeTab === "bin"} />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 hidden sm:block" aria-hidden />
            <StepPill n={3} label="Delete forever" active={activeTab === "bin"} />
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto h-auto flex flex-wrap gap-1 p-1">
            <TabsTrigger value="move" className="flex-1 sm:flex-none gap-2 px-4">
              <Archive className="h-4 w-4" />
              Move to bin
            </TabsTrigger>
            <TabsTrigger value="bin" className="flex-1 sm:flex-none gap-2 px-4">
              <Inbox className="h-4 w-4" />
              Recycle bin
              {!binLoading && (
                <Badge variant={binOrders.length > 0 ? "secondary" : "outline"} className="ml-0.5 h-5 min-w-[1.25rem] px-1.5">
                  {binOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="move" className="mt-5 space-y-4 focus-visible:outline-none">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <CalendarRange className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Using date filter above</p>
                <p className="text-base font-semibold text-foreground mt-0.5 font-mono">{rangeLabel}</p>
                {!applied.allTime && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {orderCountInRange === 0
                      ? "No orders in this range — pick another range or use All time."
                      : `${orderCountInRange} order${orderCountInRange === 1 ? "" : "s"} will be hidden from KPIs and charts.`}
                  </p>
                )}
                {applied.allTime && (
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    All active orders will be moved to the bin.
                  </p>
                )}
              </div>
              {!applied.allTime && orderCountInRange > 0 && (
                <Badge className="self-start sm:self-center shrink-0 text-sm px-3 py-1">{orderCountInRange} orders</Badge>
              )}
            </div>

            <div className="flex gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <p>
                Moving to bin only hides orders from the dashboard and admin lists. Customers won&apos;t see removed
                history. Open the <span className="font-medium text-foreground">Recycle bin</span> tab to restore or
                delete permanently.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              disabled={!canMove}
              onClick={() => setMoveOpen(true)}
              className="w-full sm:w-auto"
            >
              <Archive className="h-4 w-4" />
              Move selected history to bin
            </Button>
            {!canMove && (
              <p className="text-xs text-muted-foreground">Change the date filter above to include orders, then try again.</p>
            )}
          </TabsContent>

          <TabsContent value="bin" className="mt-5 space-y-4 focus-visible:outline-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search order ID, name, or email…"
                  value={binSearch}
                  onChange={(e) => setBinSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  aria-label="Search bin orders"
                />
              </div>
              <Button type="button" variant="outline" size="sm" disabled={binLoading} onClick={() => void loadBin()}>
                {binLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>

            {binLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Loading recycle bin…</p>
              </div>
            ) : binOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Inbox className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Recycle bin is empty</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Orders you move from the dashboard will appear here. You can restore them or delete them permanently.
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab("move")}>
                  Go to Move to bin
                </Button>
              </div>
            ) : filteredBin.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No orders match your search.</p>
            ) : (
              <ul className="space-y-3">
                {filteredBin.map((o) => (
                  <li
                    key={o._id}
                    className="rounded-xl border border-border/60 bg-background p-4 shadow-sm hover:border-border transition-colors"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {o.orderNumber || `#${o._id.slice(-8)}`}
                          </span>
                          <Badge variant={paymentBadgeVariant(o.paymentStatus)}>
                            {String(o.paymentStatus || "pending")}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground truncate">{o.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatInr(o.totalAmount)} · Moved {formatOrderDate(o.deletedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => setRestoreTarget(o)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => setPermanentTarget(o)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete forever
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {binOrders.length > 0 && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground flex gap-3">
                <Trash2 className="h-5 w-5 shrink-0 text-destructive" />
                <p>
                  <span className="font-medium text-foreground">Delete forever</span> removes the order from the database.
                  You&apos;ll always be asked to confirm — this cannot be undone.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={moveOpen} onOpenChange={(open) => !moving && setMoveOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move orders to recycle bin?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Range: <span className="font-mono font-medium text-foreground">{rangeLabel}</span>
                </p>
                {!applied.allTime && orderCountInRange > 0 && (
                  <p>About {orderCountInRange} order(s) will leave the dashboard until you restore them.</p>
                )}
                {applied.allTime && <p>All active orders will be moved to the bin.</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={moving}>Cancel</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants(), "sm:mt-0")}
              disabled={moving}
              onClick={() => void confirmMoveToBin()}
            >
              {moving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Moving…
                </>
              ) : (
                "Yes, move to bin"
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => !restoring && !open && setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this order?</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreTarget?.orderNumber || restoreTarget?._id} for {restoreTarget?.customerName} will show again on
              the dashboard and in order lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants(), "sm:mt-0")}
              disabled={restoring}
              onClick={() => void confirmRestore()}
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Restoring…
                </>
              ) : (
                "Restore order"
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={permanentTarget !== null}
        onOpenChange={(open) => !permanentDeleting && !open && setPermanentTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>This action cannot be undone.</p>
                <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1 text-foreground">
                  <p>
                    <span className="text-muted-foreground">Order:</span>{" "}
                    <span className="font-mono font-medium">{permanentTarget?.orderNumber || permanentTarget?._id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Customer:</span> {permanentTarget?.customerName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Amount:</span>{" "}
                    {permanentTarget ? formatInr(permanentTarget.totalAmount) : ""}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={permanentDeleting}>Keep in bin</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive" }), "sm:mt-0")}
              disabled={permanentDeleting}
              onClick={() => void confirmPermanentDelete()}
            >
              {permanentDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrderHistoryPanel;
