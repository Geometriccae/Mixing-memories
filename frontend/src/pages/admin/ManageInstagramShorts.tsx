import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
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
import {
  addInstagramReel,
  deleteInstagramReel,
  fetchInstagramReels,
  parseInstagramReelUrl,
  reelThumbnailProxyUrl,
  type InstagramReelDoc,
} from "@/lib/instagramApi";

const ManageInstagramShorts = () => {
  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);
  const [items, setItems] = useState<InstagramReelDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasteUrl, setPasteUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InstagramReelDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchInstagramReels();
      setItems(list);
    } catch {
      toast.error("Could not load Instagram shorts.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Admin session missing. Please log in.");
      return;
    }
    if (!parseInstagramReelUrl(pasteUrl)) {
      toast.error("Paste a valid Instagram reel link (instagram.com/reel/…).");
      return;
    }
    setAdding(true);
    try {
      await addInstagramReel(token, pasteUrl.trim());
      setPasteUrl("");
      toast.success("Reel added — visible on the home page.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add reel.");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget?._id) return;
    setDeleting(true);
    try {
      await deleteInstagramReel(token, deleteTarget._id);
      setItems((prev) => prev.filter((x) => x._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Reel removed from home page.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  if (!token) {
    return <p className="text-sm text-muted-foreground">Admin session missing. Please log in.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Instagram Shorts</h2>
      <p className="text-sm text-muted-foreground -mt-2">
        Add or remove reels shown in the Instagram Shorts section on the home page. Paste a public reel URL from
        @the.royaloven.
      </p>

      <form
        onSubmit={(e) => void handleAdd(e)}
        className="bg-card rounded-2xl card-shadow p-4 md:p-6 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="url"
          value={pasteUrl}
          onChange={(e) => setPasteUrl(e.target.value)}
          placeholder="Paste Instagram reel URL…"
          className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={adding || !pasteUrl.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Add reel
        </button>
      </form>

      <div className="bg-card rounded-2xl card-shadow divide-y divide-border">
        {loading ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            No reels yet. Paste a link above and click Add reel.
          </p>
        ) : (
          items.map((reel) => (
            <div key={reel._id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="flex gap-4 items-center min-w-0">
                <div className="h-20 w-14 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                  <img
                    src={reelThumbnailProxyUrl(reel.shortcode)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">Reel {reel.shortcode}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                      Live on site
                    </span>
                  </div>
                  <a
                    href={reel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary mt-1 inline-flex items-center gap-1 truncate max-w-full"
                  >
                    {reel.url}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(reel)}
                className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Delete reel"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this reel?</AlertDialogTitle>
            <AlertDialogDescription>
              Reel &quot;{deleteTarget?.shortcode ?? ""}&quot; will be removed from the home page Instagram Shorts
              section.
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
              {deleting ? "Removing…" : "Remove"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageInstagramShorts;
