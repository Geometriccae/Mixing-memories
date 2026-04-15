import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Trash2 } from "lucide-react";
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { approveTestimonial, deleteTestimonial, fetchAllTestimonials, type TestimonialDoc } from "@/lib/testimonialsApi";

const ManageTestimonials = () => {
  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);
  const [items, setItems] = useState<TestimonialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialDoc | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await fetchAllTestimonials(token);
      setItems(list);
    } catch {
      toast.error("Could not load testimonials.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (t: TestimonialDoc) => {
    if (!token) return;
    setApprovingId(t._id);
    try {
      const updated = await approveTestimonial(token, t._id);
      setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      toast.success("Review approved — visible on the site.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve.");
    } finally {
      setApprovingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTestimonial(token, deleteTarget._id);
      setItems((prev) => prev.filter((x) => x._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  if (!token) {
    return <p className="text-sm text-muted-foreground">Admin session missing. Please log in.</p>;
  }

  const pending = items.filter((x) => x.status === "pending");

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Manage Testimonials</h2>
      <p className="text-sm text-muted-foreground -mt-2">
        Reviews are submitted by customers on the site. Approve pending entries to show them on the home page, or delete
        as needed.
      </p>

      {pending.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Pending customer reviews ({pending.length})</p>
          <p className="text-xs text-muted-foreground">Approve to show them on the home page.</p>
        </div>
      ) : null}

      <div className="bg-card rounded-2xl card-shadow divide-y divide-border">
        {loading ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">No testimonials yet. Customer reviews will appear here when submitted.</p>
        ) : (
          items.map((t) => (
            <div key={t._id} className="flex items-start justify-between px-6 py-4 gap-4">
              <div className="flex gap-3 items-start min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {t.avatar || "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{t.name}</p>
                    {t.status === "pending" ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200">
                        Pending
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 break-words">{t.text}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {t.status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => void handleApprove(t)}
                    disabled={approvingId === t._id}
                    className="p-2 hover:bg-primary/10 rounded-lg text-primary"
                    aria-label="Approve review"
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(t)}
                  className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Delete testimonial"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the review for &quot;{deleteTarget?.name ?? ""}&quot; from the database? Customer-facing pages load
              testimonials from the API only (not static mock data).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <button
              type="button"
              disabled={deleting}
              className={cn(buttonVariants({ variant: "destructive" }), "sm:mt-0")}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageTestimonials;
