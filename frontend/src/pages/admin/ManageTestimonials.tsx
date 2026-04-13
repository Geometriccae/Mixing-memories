import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
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
import { createTestimonial, deleteTestimonial, fetchTestimonials, type TestimonialDoc } from "@/lib/testimonialsApi";

const ManageTestimonials = () => {
  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);
  const [items, setItems] = useState<TestimonialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", text: "" });
  const [deleteTarget, setDeleteTarget] = useState<TestimonialDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await fetchTestimonials();
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

  const handleAdd = async () => {
    if (!token) {
      toast.error("Please log in to the admin panel.");
      return;
    }
    if (!form.name.trim() || !form.text.trim()) {
      toast.error("Fill all fields");
      return;
    }
    setSaving(true);
    try {
      const doc = await createTestimonial(token, { name: form.name.trim(), text: form.text.trim() });
      setItems((prev) => [...prev, doc]);
      setForm({ name: "", text: "" });
      toast.success("Testimonial added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Manage Testimonials</h2>
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Customer name"
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
        <textarea
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          placeholder="Review text"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleAdd()}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add Testimonial"}
        </button>
      </div>
      <div className="bg-card rounded-2xl card-shadow divide-y divide-border">
        {loading ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">No testimonials yet. Add one above.</p>
        ) : (
          items.map((t) => (
            <div key={t._id} className="flex items-start justify-between px-6 py-4 gap-4">
              <div className="flex gap-3 items-start">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {t.avatar || "?"}
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.text}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(t)}
                className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Delete testimonial"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent
          onPointerDownOutside={(e) => deleting && e.preventDefault()}
          onEscapeKeyDown={(e) => deleting && e.preventDefault()}
        >
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
