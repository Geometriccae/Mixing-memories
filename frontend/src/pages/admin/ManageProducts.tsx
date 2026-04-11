import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SimpleProductCreateDialog from "@/pages/admin/productDialogs/SimpleProductCreateDialog";
import SimpleProductEditDialog from "@/pages/admin/productDialogs/SimpleProductEditDialog";
import ProductViewDialog from "@/pages/admin/productDialogs/ProductViewDialog";
import type { AdminProductRow } from "@/pages/admin/productDialogs/productTypes";

const navy = "bg-[hsl(222_47%_16%)]";
const thClass = `${navy} text-white text-left text-xs font-semibold uppercase tracking-wide px-4 py-3 border-b border-white/10`;
const sortIcon = <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-70" />;

function ActionButtons({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={onView}
        className="h-8 w-8 rounded-md bg-[hsl(222_47%_16%)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="h-8 w-8 rounded-md bg-sky-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="h-8 w-8 rounded-md bg-orange-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

type ApiProduct = {
  _id?: string;
  name?: string;
  description?: string;
  specification?: string;
  price?: number;
  actualPrice?: number | null;
  stock?: number;
  minStock?: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  hasImage?: boolean;
  hasVideo?: boolean;
  updatedAt?: string;
  variantImageUrls?: (string | null)[];
};

const ManageProducts = () => {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [viewProductOpen, setViewProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductRow | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const adminTokenRef = useRef<string | null>(sessionStorage.getItem("admin_token"));

  const requireAdminToken = () => {
    const token = adminTokenRef.current ?? sessionStorage.getItem("admin_token");
    adminTokenRef.current = token;
    return token;
  };

  const authedFetch = async (path: string, init?: RequestInit, requireAuth = false) => {
    const token = requireAdminToken();
    if (requireAuth && !token) {
      throw new Error("Admin token missing. Please login to the admin panel.");
    }

    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
    });
  };

  const toBlob = async (src: string): Promise<Blob> => {
    if (src.startsWith("data:")) {
      const comma = src.indexOf(",");
      if (comma === -1) throw new Error("Invalid image data.");
      const meta = src.slice(0, comma);
      const base64 = src.slice(comma + 1);
      const mimeMatch = meta.match(/data:([^;]+);/);
      const mime = mimeMatch?.[1] || "image/png";
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }

    const res = await fetch(src);
    if (!res.ok) throw new Error("Failed to load image for upload.");
    return res.blob();
  };

  const mapApiToRow = useCallback(
    (p: ApiProduct): AdminProductRow | null => {
      const id = p._id ? String(p._id) : "";
      if (!id || !p.name) return null;
      const price = Number(p.price);
      if (!Number.isFinite(price)) return null;
      const ts = p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now();
      const hasImageFlag = p.hasImage === true || (p.hasImage !== false && p.imageUrl != null && p.imageUrl !== "");
      const imageUrl = hasImageFlag
        ? p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.startsWith("/")
          ? `${apiBaseUrl}${p.imageUrl}`
          : `${apiBaseUrl}/api/products/${id}/image?v=${ts}`
        : "";
      const hasVideoFlag = p.hasVideo === true;
      const videoUrl = hasVideoFlag
        ? p.videoUrl && typeof p.videoUrl === "string" && p.videoUrl.startsWith("/")
          ? `${apiBaseUrl}${p.videoUrl}`
          : `${apiBaseUrl}/api/products/${id}/video?v=${ts}`
        : "";
      const ap =
        p.actualPrice !== undefined && p.actualPrice !== null && Number.isFinite(Number(p.actualPrice))
          ? Number(p.actualPrice)
          : null;
      const stock = p.stock !== undefined && p.stock !== null && Number.isFinite(Number(p.stock)) ? Math.floor(Number(p.stock)) : 0;
      const minStock =
        p.minStock !== undefined && p.minStock !== null && Number.isFinite(Number(p.minStock)) ? Math.floor(Number(p.minStock)) : 0;
      const rawUrls = Array.isArray(p.variantImageUrls) ? p.variantImageUrls : [];
      const variantImageUrls: (string | null)[] = [0, 1, 2].map((i) => {
        const u = rawUrls[i];
        if (u && typeof u === "string" && u.startsWith("/")) {
          return `${apiBaseUrl}${u}`;
        }
        return null;
      });
      return {
        id,
        name: String(p.name),
        description: typeof p.description === "string" ? p.description : "",
        specification: typeof p.specification === "string" ? p.specification : "",
        price,
        actualPrice: ap,
        stock,
        minStock,
        imageUrl,
        videoUrl,
        hasImage: Boolean(hasImageFlag && imageUrl),
        hasVideo: Boolean(hasVideoFlag && videoUrl),
        variantImageUrls,
      };
    },
    [apiBaseUrl],
  );

  const refreshProducts = useCallback(async () => {
    setDataLoaded(false);
    const prodRes = await authedFetch("/api/products?page=1&limit=1000", undefined, false);
    if (!prodRes.ok) throw new Error("Failed to load products.");
    const prodJson: unknown = await prodRes.json();
    const prodData = prodJson && typeof prodJson === "object" && "data" in prodJson ? (prodJson as { data: unknown }).data : [];
    const prodItems: ApiProduct[] = Array.isArray(prodData) ? (prodData as ApiProduct[]) : [];
    const nextProducts: AdminProductRow[] = prodItems.map((p) => mapApiToRow(p)).filter((r): r is AdminProductRow => r !== null);
    setProducts(nextProducts);
    setDataLoaded(true);
  }, [apiBaseUrl, mapApiToRow]);

  useEffect(() => {
    void refreshProducts().catch(() => {
      setProducts([]);
      setDataLoaded(true);
      toast.error("Could not load products.");
    });
  }, [refreshProducts]);

  const appendVariantFiles = async (form: FormData, urls: [string | null, string | null, string | null]) => {
    for (let i = 0; i < 3; i += 1) {
      const v = urls[i];
      if (v && v.startsWith("data:")) {
        const blob = await toBlob(v);
        const ext = blob.type.split("/")[1] || "png";
        form.append(`variantImage${i}`, blob, `variant-${i}.${ext}`);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [products, search]);

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const productSlice = filteredProducts.slice(start, start + pageSize);

  return (
    <>
      <SimpleProductCreateDialog
        open={createProductOpen}
        onOpenChange={setCreateProductOpen}
        onCreate={async (data) => {
          if (!dataLoaded) {
            toast.error("Please wait while data loads.");
            throw new Error("Not loaded");
          }
          const token = requireAdminToken();
          if (!token) {
            toast.error("Please login to create products.");
            throw new Error("Not authorized");
          }

          const form = new FormData();
          form.append("name", data.name);
          form.append("description", data.description || "");
          form.append("specification", data.specification || "");
          form.append("price", String(data.price));
          if (data.actualPrice != null) form.append("actualPrice", String(data.actualPrice));
          form.append("stock", String(data.stock));
          form.append("minStock", String(data.minStock));
          if (data.coverFile) {
            form.append("image", data.coverFile, data.coverFile.name || "cover");
          }
          if (data.videoFile) {
            form.append("video", data.videoFile, data.videoFile.name || "clip");
          }
          await appendVariantFiles(form, data.variantImageDataUrls);

          const res = await authedFetch("/api/products", { method: "POST", body: form }, true);
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = (json as { message?: string })?.message || "Failed to create product.";
            toast.error(msg);
            throw new Error(msg);
          }

          toast.success("Product created");
          await refreshProducts();
        }}
      />
      <ProductViewDialog open={viewProductOpen} onOpenChange={setViewProductOpen} product={selectedProduct} />
      <SimpleProductEditDialog
        open={editProductOpen}
        onOpenChange={setEditProductOpen}
        product={selectedProduct}
        onUpdate={async (id, data) => {
          if (!dataLoaded) {
            toast.error("Please wait while data loads.");
            throw new Error("Not loaded");
          }
          const form = new FormData();
          form.append("name", data.name);
          form.append("description", data.description || "");
          form.append("specification", data.specification || "");
          form.append("price", String(data.price));
          if (data.actualPrice != null) form.append("actualPrice", String(data.actualPrice));
          else form.append("actualPrice", "");
          form.append("stock", String(data.stock));
          form.append("minStock", String(data.minStock));

          if (data.imageDataUrl) {
            const imageBlob = await toBlob(data.imageDataUrl);
            const imageExt = imageBlob.type.split("/")[1] || "png";
            form.append("image", imageBlob, `product-image.${imageExt}`);
          }
          if (data.removeMainImage) form.append("removeMainImage", "1");
          if (data.removeVideo) form.append("removeVideo", "1");
          if (data.videoFile) {
            form.append("video", data.videoFile, data.videoFile.name || "clip");
          }
          if (data.removeVariants) {
            data.removeVariants.forEach((flag, i) => {
              if (flag) form.append(`removeVariant${i}`, "1");
            });
          }

          await appendVariantFiles(form, data.variantImageDataUrls);

          const res = await authedFetch(`/api/products/${id}`, { method: "PUT", body: form }, true);
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = (json as { message?: string })?.message || "Failed to update product.";
            toast.error(msg);
            throw new Error(msg);
          }

          toast.success("Product updated");
          await refreshProducts();
        }}
      />

      <div className="rounded-xl bg-card border border-border/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Products</h2>
          <button
            type="button"
            onClick={() => setCreateProductOpen(true)}
            className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity w-fit ml-auto"
          >
            Create product
          </button>
        </div>

        <div className="p-5 pt-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-border rounded-md px-2 py-1.5 bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="admin-table-search" className="text-muted-foreground whitespace-nowrap">
                Search:
              </label>
              <input
                id="admin-table-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="border border-border rounded-md px-3 py-1.5 min-w-[200px] bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>#{sortIcon}</th>
                  <th className={thClass}>Product name{sortIcon}</th>
                  <th className={thClass}>Image{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Selling{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Stock{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Min{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Action{sortIcon}</th>
                </tr>
              </thead>
              <tbody>
                {!dataLoaded ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : productSlice.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No data
                    </td>
                  </tr>
                ) : (
                  productSlice.map((r, idx) => {
                    const stockLow = r.minStock > 0 && r.stock <= r.minStock;
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-border ${stockLow ? "bg-destructive/10" : idx % 2 === 1 ? "bg-muted/35" : "bg-card"}`}
                      >
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{start + idx + 1}</td>
                        <td className="px-4 py-3 text-foreground max-w-[280px]">{r.name}</td>
                        <td className="px-4 py-3">
                          {r.hasImage ? (
                            <img src={r.imageUrl} alt="" className="h-12 w-12 rounded object-cover border border-border" />
                          ) : r.hasVideo ? (
                            <video
                              src={r.videoUrl}
                              className="h-12 w-12 rounded object-cover border border-border bg-black"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded border border-dashed border-border bg-muted/50" aria-hidden />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">₹{r.price.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-center tabular-nums font-medium ${stockLow ? "text-destructive" : ""}`}>
                          {r.stock}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">{r.minStock}</td>
                        <td className="px-4 py-3">
                          <ActionButtons
                            onView={() => {
                              setSelectedProduct(r);
                              setViewProductOpen(true);
                            }}
                            onEdit={() => {
                              setSelectedProduct(r);
                              setEditProductOpen(true);
                            }}
                            onDelete={() => setDeleteTarget(r)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-muted-foreground">
            <p>
              Showing {total === 0 ? 0 : start + 1} to {Math.min(start + pageSize, total)} of {total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border border-border bg-background disabled:opacity-40 hover:bg-muted/50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPage(num)}
                  className={`min-w-[2rem] px-2 py-1.5 rounded text-sm font-medium ${
                    num === safePage ? `${navy} text-white` : "border border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border border-border bg-background disabled:opacity-40 hover:bg-muted/50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteConfirming) setDeleteTarget(null);
        }}
        title="Delete this product?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed permanently. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        confirming={deleteConfirming}
        onConfirm={() => {
          if (!deleteTarget || !dataLoaded) {
            toast.error("Please wait while data loads.");
            return;
          }
          const id = deleteTarget.id;
          void (async () => {
            setDeleteConfirming(true);
            try {
              const res = await authedFetch(`/api/products/${id}`, { method: "DELETE" }, true);
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error((json as { message?: string })?.message || "Failed to delete product.");
              toast.success("Product removed");
              setDeleteTarget(null);
              await refreshProducts();
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : String(err);
              toast.error(message || "Failed to delete product.");
            } finally {
              setDeleteConfirming(false);
            }
          })();
        }}
      />
    </>
  );
};

export default ManageProducts;
